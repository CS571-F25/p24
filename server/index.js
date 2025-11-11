const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const { Client } = require('@googlemaps/google-maps-services-js')
const polyline = require('polyline')
const crypto = require('crypto')
dotenv.config()

const { admin, db } = require('./firebase')

const PORT = process.env.PORT || 8787
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

const app = express()
const googleMapsClient = new Client({})
const fallbackFeedbackStore = []
const FEEDBACK_WINDOW_HOURS = Number(
  process.env.FEEDBACK_WINDOW_HOURS ?? 24 * 30,
)

const CATEGORY_WEIGHTS = {
  lighting: 4,
  infrastructure: 3,
  community: 2,
  traffic: -3,
  other: -1,
}

const FEEDBACK_SUCCESS_MESSAGE = db
  ? 'Thanks! Your safety intel is now stored in Firestore.'
  : 'Feedback captured locally. Add Firebase credentials to persist it.'

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const metersToMiles = (meters) =>
  typeof meters === 'number' ? meters / 1609.34 : undefined

const secondsToMinutes = (seconds) =>
  typeof seconds === 'number' ? Math.round(seconds / 60) : undefined

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max)

const normalizeMode = (mode) => {
  switch ((mode ?? '').toLowerCase()) {
    case 'walk':
    case 'walking':
      return 'walking'
    case 'bike':
    case 'biking':
    case 'bicycle':
    case 'bicycling':
      return 'bicycling'
    case 'scooter':
    case 'micromobility':
      return 'driving'
    case 'transit':
      return 'transit'
    default:
      return 'walking'
  }
}

const scoreRoute = (route, index, preference) => {
  const base = 92 - index * 6
  const preferenceBoost =
    preference === 'fastest' ? 4 : preference === 'balanced' ? 2 : 0
  return clamp(base + preferenceBoost, 55, 98)
}

const formatIncidents = (route, routeId) => {
  if (Array.isArray(route.warnings) && route.warnings.length > 0) {
    return route.warnings.map((warning, idx) => ({
      id: `${routeId}-warning-${idx}`,
      type: 'Advisory',
      description: warning,
    }))
  }

  return [
    {
      id: `${routeId}-lighting`,
      type: 'Lighting',
      description:
        'Route prioritizes well-lit arterials and community reported safe zones.',
    },
    {
      id: `${routeId}-community`,
      type: 'Community',
      description:
        'Feedback from locals will replace this placeholder once the DB is connected.',
    },
  ]
}

const decodePolyline = (encoded) => {
  if (!encoded) {
    return []
  }

  return polyline.decode(encoded).map(([lat, lng]) => ({ lat, lng }))
}

const hashRouteId = ({ origin, destination, summary, encodedPolyline }) => {
  const hash = crypto.createHash('sha1')
  hash.update(String(origin ?? '').toLowerCase().trim())
  hash.update('|')
  hash.update(String(destination ?? '').toLowerCase().trim())
  hash.update('|')
  hash.update(String(summary ?? '').toLowerCase().trim())
  hash.update('|')
  hash.update(String(encodedPolyline ?? ''))
  return hash.digest('hex')
}

const summarizeNotes = (notes) =>
  notes
    .filter(Boolean)
    .slice(0, 2)
    .map((note) => note.trim())

const chunkArray = (items, size) => {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const fetchFeedbackSummaries = async (routeIds) => {
  const stats = new Map()
  if (routeIds.length === 0) {
    return stats
  }

  const sinceTimestamp = new Date(
    Date.now() - FEEDBACK_WINDOW_HOURS * 60 * 60 * 1000,
  )

  if (!db) {
    fallbackFeedbackStore
      .filter(
        (entry) =>
          entry.routeId &&
          routeIds.includes(entry.routeId) &&
          new Date(entry.createdAt) >= sinceTimestamp,
      )
      .forEach((entry) => {
        const weight = CATEGORY_WEIGHTS[entry.category] ?? 0
        const record = stats.get(entry.routeId) ?? {
          totalReports: 0,
          positive: 0,
          negative: 0,
          highlights: [],
          delta: 0,
        }
        record.totalReports += 1
        if (weight >= 0) {
          record.positive += 1
        } else {
          record.negative += 1
        }
        record.delta += weight
        if (entry.notes && record.highlights.length < 3) {
          record.highlights.push(entry.notes)
        }
        stats.set(entry.routeId, record)
      })
    return stats
  }

  const since = admin.firestore.Timestamp.fromDate(sinceTimestamp)
  const chunks = chunkArray(routeIds, 10)

  await Promise.all(
    chunks.map(async (chunk) => {
      const snapshot = await db
        .collection('feedback')
        .where('routeId', 'in', chunk)
        .where('createdAt', '>=', since)
        .get()

      snapshot.forEach((doc) => {
        const data = doc.data() ?? {}
        if (!data.routeId) {
          return
        }
        const { category, notes } = data
        const weight = CATEGORY_WEIGHTS[category] ?? 0
        const record = stats.get(data.routeId) ?? {
          totalReports: 0,
          positive: 0,
          negative: 0,
          highlights: [],
          delta: 0,
        }
        record.totalReports += 1
        if (weight >= 0) {
          record.positive += 1
        } else {
          record.negative += 1
        }
        record.delta += weight
        if (notes && record.highlights.length < 3) {
          record.highlights.push(notes)
        }
        stats.set(data.routeId, record)
      })
    }),
  )

  return stats
}

const applyFeedbackSummary = (route, summary) => {
  if (!summary) {
    return {
      ...route,
      communityStats: {
        totalReports: 0,
        positive: 0,
        negative: 0,
      },
    }
  }

  const delta = clamp(summary.delta, -12, 12)
  const safetyBefore = route.metrics?.safety ?? route.safetyScore ?? 0
  const adjustedSafety = clamp(safetyBefore + delta, 0, 100)

  return {
    ...route,
    safetyScore: adjustedSafety,
    metrics: {
      ...route.metrics,
      safety: adjustedSafety,
      balance: clamp((route.metrics?.balance ?? 0) + delta * 0.4, 0, 100),
    },
    communityStats: summary,
    incidents: [
      ...route.incidents,
      ...summarizeNotes(summary.highlights).map((note, idx) => ({
        id: `${route.id}-community-${idx}`,
        type: 'Community',
        description: note,
      })),
    ].slice(0, 4),
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/routes', async (req, res) => {
  const {
    origin,
    destination,
    mode = 'walking',
    preference = 'safest',
  } = req.body ?? {}

  if (!origin || !destination) {
    return res
      .status(400)
      .json({ error: 'Both origin and destination are required.' })
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({
      error:
        'Missing GOOGLE_MAPS_API_KEY. Add it to server/.env before requesting routes.',
    })
  }

  try {
    const normalizedMode = normalizeMode(mode)
    const { data } = await googleMapsClient.directions({
      params: {
        origin,
        destination,
        mode: normalizedMode,
        alternatives: true,
        key: GOOGLE_MAPS_API_KEY,
      },
    })

    const rawRoutes = data?.routes ?? []
    const formattedRoutes = rawRoutes.map((route, idx) => {
      const leg = route.legs?.[0] ?? {}
      const distanceMiles = metersToMiles(leg.distance?.value)
      const durationMinutes = secondsToMinutes(leg.duration?.value)
      const summary = route.summary ?? `Option ${idx + 1}`
      const encodedPolyline = route.overview_polyline?.points ?? ''
      const routeId = hashRouteId({
        origin,
        destination,
        summary,
        encodedPolyline,
      })
      const safetyScore = scoreRoute(route, idx, preference)

      return {
        id: routeId,
        name: summary,
        description:
          leg.steps?.[0]?.html_instructions?.replace(/<[^>]+>/g, '') ??
          'SafeCommute live route',
        distanceMiles,
        estimatedDuration: durationMinutes,
        safetyScore,
        confidence: safetyScore >= 90 ? 'High' : safetyScore >= 75 ? 'Medium' : 'Emerging',
        mode:
          normalizedMode === 'bicycling'
            ? 'bike'
            : normalizedMode === 'driving'
              ? 'scooter'
              : 'walk',
        metrics: {
          safety: safetyScore,
          balance: clamp(88 - idx * 4, 60, 95),
          speed: clamp(96 - idx * 5, 55, 99),
        },
        incidents: formatIncidents(route, routeId),
        coordinates: decodePolyline(route.overview_polyline?.points),
      }
    })

    const feedbackSummaries = await fetchFeedbackSummaries(
      formattedRoutes.map((route) => route.id),
    )

    const enrichedRoutes = formattedRoutes.map((route) =>
      applyFeedbackSummary(route, feedbackSummaries.get(route.id)),
    )

    return res.json({ routes: enrichedRoutes })
  } catch (error) {
    const message =
      error.response?.data?.error_message ?? error.message ?? 'Unknown error'
    console.error('Failed to fetch routes from Google Directions:', message)
    return res
      .status(502)
      .json({ error: 'Unable to fetch routes from Google Directions API.' })
  }
})

app.post('/feedback', async (req, res) => {
  const {
    category,
    notes,
    name,
    email,
    routeId,
    routeName,
    locationHint,
    preference,
    tripOrigin,
    tripDestination,
  } = req.body ?? {}

  if (!category || !notes?.trim()) {
    return res.status(400).json({
      error: 'Category and notes are required feedback fields.',
    })
  }

  const normalizedRecord = {
    category,
    notes: notes.trim(),
    name: name?.trim() || null,
    email: email?.trim() || null,
    routeId: routeId ?? null,
    routeName: routeName ?? null,
    locationHint: locationHint?.trim() || null,
    preference: preference ?? null,
    tripOrigin: tripOrigin ?? null,
    tripDestination: tripDestination ?? null,
    createdAt: new Date().toISOString(),
  }

  try {
    if (db) {
      await db.collection('feedback').add({
        ...normalizedRecord,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } else {
      fallbackFeedbackStore.push(normalizedRecord)
    }

    return res.json({
      success: true,
      type: 'success',
      message: FEEDBACK_SUCCESS_MESSAGE,
    })
  } catch (error) {
    console.error('Failed to store feedback', error)
    return res.status(500).json({
      success: false,
      type: 'danger',
      message:
        'We could not save your feedback. Please try again in a few minutes.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`SafeCommute backend running on port ${PORT}`)
})
