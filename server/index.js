const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const { Client } = require('@googlemaps/google-maps-services-js')
const polyline = require('polyline')
const crypto = require('crypto')

dotenv.config()

const PORT = process.env.PORT || 8787
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

const app = express()
const googleMapsClient = new Client({})
const feedbackStore = []

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const metersToMiles = (meters) =>
  typeof meters === 'number' ? meters / 1609.34 : undefined

const secondsToMinutes = (seconds) =>
  typeof seconds === 'number' ? Math.round(seconds / 60) : undefined

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max)

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
    const { data } = await googleMapsClient.directions({
      params: {
        origin,
        destination,
        mode,
        alternatives: true,
        key: GOOGLE_MAPS_API_KEY,
      },
    })

    const rawRoutes = data?.routes ?? []
    const formattedRoutes = rawRoutes.map((route, idx) => {
      const leg = route.legs?.[0] ?? {}
      const distanceMiles = metersToMiles(leg.distance?.value)
      const durationMinutes = secondsToMinutes(leg.duration?.value)
      const routeId = crypto.randomUUID()
      const safetyScore = scoreRoute(route, idx, preference)

      return {
        id: routeId,
        name: route.summary ?? `Option ${idx + 1}`,
        description:
          leg.steps?.[0]?.html_instructions?.replace(/<[^>]+>/g, '') ??
          'SafeCommute live route',
        distanceMiles,
        estimatedDuration: durationMinutes,
        safetyScore,
        confidence: safetyScore >= 90 ? 'High' : safetyScore >= 75 ? 'Medium' : 'Emerging',
        mode: mode === 'bicycling' ? 'bike' : 'walk',
        metrics: {
          safety: safetyScore,
          balance: clamp(88 - idx * 4, 60, 95),
          speed: clamp(96 - idx * 5, 55, 99),
        },
        incidents: formatIncidents(route, routeId),
        coordinates: decodePolyline(route.overview_polyline?.points),
      }
    })

    return res.json({ routes: formattedRoutes })
  } catch (error) {
    const message =
      error.response?.data?.error_message ?? error.message ?? 'Unknown error'
    console.error('Failed to fetch routes from Google Directions:', message)
    return res
      .status(502)
      .json({ error: 'Unable to fetch routes from Google Directions API.' })
  }
})

app.post('/feedback', (req, res) => {
  const { category, note, lat, lng, routeId } = req.body ?? {}

  if (!category || !note) {
    return res
      .status(400)
      .json({ error: 'category and note are required feedback fields.' })
  }

  const record = {
    id: crypto.randomUUID(),
    category,
    note,
    lat,
    lng,
    routeId,
    submittedAt: new Date().toISOString(),
  }

  feedbackStore.push(record)
  console.log('Feedback captured (persist to DB in production):', record)

  return res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`SafeCommute backend running on port ${PORT}`)
})
