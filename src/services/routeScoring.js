export const DEFAULT_SCORING_WEIGHTS = Object.freeze({
  notes: 45,
  weather: 35,
  metrics: 20,
})

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const normalize = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return 50
  }
  if (max === min) {
    return clamp(value, 0, 100)
  }
  const percentage = ((value - min) / (max - min)) * 100
  return clamp(Math.round(percentage), 0, 100)
}

const stripToNumbers = (value) => {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value !== 'string') {
    return null
  }
  const matches = value.match(/-?\d+(\.\d+)?/g)
  if (!matches || matches.length === 0) {
    return null
  }
  const numbers = matches.map((match) => Number(match))
  const total = numbers.reduce((sum, entry) => sum + entry, 0)
  return total / numbers.length
}

const POSITIVE_NOTE_KEYWORDS = [
  'well lit',
  'good lighting',
  'patrol',
  'safe',
  'calm',
  'protected',
  'new lights',
  'low traffic',
  'neighbors',
  'beacon',
  'favorable',
  'clear',
  'comfortable',
]

const NEGATIVE_NOTE_KEYWORDS = [
  'dark',
  'poor lighting',
  'pothole',
  'construction',
  'detour',
  'incident',
  'unsafe',
  'hazard',
  'crowded',
  'storm',
  'icy',
  'slippery',
  'windy',
  'bad',
  'awful',
  'terrible',
  'dangerous',
  'attack',
  'attacked',
  'assault',
  'robbed',
  'mugged',
  'followed',
  'creepy',
  'sketchy',
  'threat',
  'threatening',
  'harassed',
  'scary',
]

const NEGATIVE_NOTE_PHRASES = [
  { phrase: 'almost got attacked', delta: -4 },
  { phrase: 'almost got hit', delta: -3 },
  { phrase: 'almost got robbed', delta: -4 },
  { phrase: 'almost got jumped', delta: -4 },
  { phrase: 'really bad', delta: -2 },
  { phrase: 'felt unsafe', delta: -2 },
  { phrase: 'got attacked', delta: -4 },
  { phrase: 'got robbed', delta: -4 },
  { phrase: 'got mugged', delta: -4 },
]

const WEATHER_NEGATIVE_KEYWORDS = [
  'storm',
  'thunder',
  'snow',
  'ice',
  'hail',
  'rain',
  'showers',
  'fog',
  'gust',
  'windy',
]

const WEATHER_POSITIVE_KEYWORDS = [
  'clear',
  'sunny',
  'calm',
  'mild',
  'partly sunny',
]

const detectKeywordSentiment = (text, positives, negatives) => {
  if (!text) {
    return 0
  }
  const normalized = text.toLowerCase()
  let score = 0
  positives.forEach((keyword) => {
    if (normalized.includes(keyword)) {
      score += 1
    }
  })
  negatives.forEach((keyword) => {
    if (normalized.includes(keyword)) {
      score -= 1.2
    }
  })
  return score
}

const detectPhraseSentiment = (text, entries) => {
  if (!text) {
    return 0
  }
  const normalized = text.toLowerCase()
  return entries.reduce((total, entry) => {
    if (normalized.includes(entry.phrase)) {
      return total + entry.delta
    }
    return total
  }, 0)
}

const evaluateNoteSentimentValue = (note) =>
  detectKeywordSentiment(
    note,
    POSITIVE_NOTE_KEYWORDS,
    NEGATIVE_NOTE_KEYWORDS,
  ) + detectPhraseSentiment(note, NEGATIVE_NOTE_PHRASES)

const pullRouteNotes = (route) => {
  const highlights = Array.isArray(route?.communityStats?.highlights)
    ? route.communityStats.highlights
    : []
  const communityIncidents = Array.isArray(route?.incidents)
    ? route.incidents
        .filter((incident) =>
          String(incident?.type ?? '')
            .toLowerCase()
            .includes('community'),
        )
        .map((incident) => incident.description)
        .filter(Boolean)
    : []
  return [...highlights, ...communityIncidents].filter(Boolean)
}

const getSentimentOverride = (routeId, overrides) => {
  if (!routeId || !overrides) {
    return null
  }
  if (overrides instanceof Map) {
    return overrides.get(routeId) ?? null
  }
  if (typeof overrides === 'object') {
    return overrides[routeId] ?? null
  }
  return null
}

const analyzeNotesSentiment = (route, overrides) => {
  const override = getSentimentOverride(route?.id, overrides)
  if (override) {
    return override
  }
  const notes = pullRouteNotes(route)
  const stats = route?.communityStats ?? {}
  if (notes.length === 0 && !stats.totalReports) {
    return {
      score: 55,
      label: 'Unknown',
      reasons: ['No community notes available yet.'],
    }
  }

  const noteBreakdown = notes.reduce(
    (acc, note) => {
      const value = evaluateNoteSentimentValue(note)
      acc.sum += value
      if (value <= -1) {
        acc.negative += 1
      } else if (value >= 1) {
        acc.positive += 1
      } else {
        acc.neutral += 1
      }
      acc.total += 1
      return acc
    },
    { sum: 0, positive: 0, negative: 0, neutral: 0, total: 0 },
  )
  const keywordScore = noteBreakdown.sum

  const reportDelta =
    (stats.positive ?? 0) - (stats.negative ?? 0)
  const reportSentiment =
    stats.totalReports > 0
      ? clamp(reportDelta / Math.max(stats.totalReports, 1), -1, 1) * 4
      : 0

  const combined = keywordScore + reportSentiment
  const score = normalize(combined, -8, 8)

  let label = 'Neutral'
  if (score >= 70) {
    label = 'Positive'
  } else if (score <= 40) {
    label = 'Caution'
  }

  const reasons = []
  if (stats.totalReports) {
    reasons.push(
      `${stats.positive ?? 0} positive / ${stats.negative ?? 0} caution reports`,
    )
  }
  if (notes.length > 0) {
    reasons.push(`Analyzed ${notes.length} note${notes.length === 1 ? '' : 's'}`)
  }

  const result = {
    score,
    label,
    reasons,
  }

  const existingPositive = stats.positive ?? 0
  const existingNegative = stats.negative ?? 0
  const mergedPositive = Math.max(existingPositive, noteBreakdown.positive)
  const mergedNegative = Math.max(existingNegative, noteBreakdown.negative)
  const derivedTotal =
    stats.totalReports ??
    (mergedPositive + mergedNegative > 0
      ? mergedPositive + mergedNegative
      : noteBreakdown.total)

  if (
    mergedPositive !== existingPositive ||
    mergedNegative !== existingNegative ||
    (!stats.totalReports && derivedTotal)
  ) {
    result.statsOverride = {
      totalReports: derivedTotal || 0,
      positive: mergedPositive,
      negative: mergedNegative,
    }
  }

  return result
}

const evaluateWeatherSummary = (summary) => {
  if (!summary || typeof summary !== 'object') {
    return 0
  }

  const forecast = (summary.shortForecast ?? '').toLowerCase()
  let impact = detectKeywordSentiment(
    forecast,
    WEATHER_POSITIVE_KEYWORDS,
    WEATHER_NEGATIVE_KEYWORDS,
  )

  const precipitationChance = summary.precipitationChance
  if (typeof precipitationChance === 'number') {
    if (precipitationChance >= 70) {
      impact -= 3
    } else if (precipitationChance >= 40) {
      impact -= 2
    } else if (precipitationChance <= 15) {
      impact += 1
    }
  }

  const temperature = summary.temperature
  if (typeof temperature === 'number') {
    if (temperature <= 30) {
      impact -= 3
    } else if (temperature <= 40 || temperature >= 90) {
      impact -= 2
    } else if (temperature <= 50 || temperature >= 85) {
      impact -= 1
    } else {
      impact += 1
    }
  }

  const windSpeed = stripToNumbers(summary.windSpeed)
  if (typeof windSpeed === 'number') {
    if (windSpeed >= 30) {
      impact -= 3
    } else if (windSpeed >= 20) {
      impact -= 2
    } else if (windSpeed >= 10) {
      impact -= 1
    } else if (windSpeed <= 5) {
      impact += 1
    }
  }

  return clamp(impact, -8, 6)
}

const analyzeWeatherSentiment = (route) => {
  const segments = Array.isArray(route?.weatherSegments)
    ? route.weatherSegments
    : []
  const summaries =
    segments.length > 0
      ? segments.map((segment) => segment.summary)
      : route?.weather
        ? [route.weather]
        : []

  if (summaries.length === 0) {
    return {
      score: 55,
      label: 'Unknown',
      reasons: ['Weather forecast unavailable.'],
    }
  }

  const impacts = summaries.map((summary) =>
    evaluateWeatherSummary(summary),
  )
  const averageImpact =
    impacts.reduce((total, entry) => total + entry, 0) /
    impacts.length
  const score = normalize(averageImpact, -8, 6)

  let label = 'Manageable'
  if (score >= 70) {
    label = 'Favorable'
  } else if (score <= 40) {
    label = 'Risky'
  }

  const reasons = []
  const primary = summaries[0]
  const description = primary?.shortForecast
  if (description) {
    reasons.push(description)
  }
  if (typeof primary?.precipitationChance === 'number') {
    reasons.push(`${primary.precipitationChance}% precip.`)
  }
  if (primary?.windSpeed) {
    reasons.push(`Wind ${primary.windSpeed}`)
  }

  return {
    score,
    label,
    reasons,
  }
}

const computeMetricScore = (route) => {
  const metrics = route?.metrics ?? {}
  const base =
    typeof metrics.safety === 'number'
      ? metrics.safety
      : typeof route?.safetyScore === 'number'
        ? route.safetyScore
        : 70
  const balance = typeof metrics.balance === 'number' ? metrics.balance : base
  const speed = typeof metrics.speed === 'number' ? metrics.speed : base
  return Math.round(base * 0.6 + balance * 0.25 + speed * 0.15)
}

const normalizeWeights = (weights) => {
  const merged = {
    ...DEFAULT_SCORING_WEIGHTS,
    ...(weights ?? {}),
  }
  const notesWeight = Number.isFinite(merged.notes) ? merged.notes : 0
  const weatherWeight = Number.isFinite(merged.weather) ? merged.weather : 0
  const metricsWeight = Number.isFinite(merged.metrics) ? merged.metrics : 0
  const total = notesWeight + weatherWeight + metricsWeight
  const safeTotal = total > 0 ? total : 1
  return {
    notes: notesWeight / safeTotal,
    weather: weatherWeight / safeTotal,
    metrics: metricsWeight / safeTotal,
  }
}

const scoreRoute = (route, weightRatios, options) => {
  const noteSentiment = analyzeNotesSentiment(
    route,
    options?.noteSentimentOverrides,
  )
  const weatherSentiment = analyzeWeatherSentiment(route)
  const metricScore = computeMetricScore(route)

  const originalMetrics = route.metrics ?? {}
  const safetyBaseline =
    typeof originalMetrics.safety === 'number'
      ? originalMetrics.safety
      : route.safetyScore ?? 0
  const balanceBaseline =
    typeof originalMetrics.balance === 'number'
      ? originalMetrics.balance
      : safetyBaseline
  const speedBaseline =
    typeof originalMetrics.speed === 'number'
      ? originalMetrics.speed
      : safetyBaseline

  const sentimentTilt =
    noteSentiment.label === 'Caution'
      ? -12
      : noteSentiment.label === 'Neutral'
        ? -4
        : noteSentiment.label === 'Positive'
          ? 3
          : 0

  const adjustedMetrics = {
    safety: clamp(safetyBaseline + sentimentTilt, 0, 100),
    balance: clamp(balanceBaseline + sentimentTilt * 0.4, 0, 100),
    speed: speedBaseline,
  }

  const composite = Math.round(
    noteSentiment.score * weightRatios.notes +
      weatherSentiment.score * weightRatios.weather +
      metricScore * weightRatios.metrics,
  )

  return {
    ...route,
    scorecard: {
      composite,
      metricScore,
      noteSentiment,
      weatherSentiment,
      adjustedMetrics,
    },
  }
}

const summarizeRecommendation = (route) => {
  if (!route?.scorecard) {
    return null
  }
  const { noteSentiment, weatherSentiment } = route.scorecard
  const details = []
  if (noteSentiment) {
    details.push(
      `Notes trend ${noteSentiment.label.toLowerCase()} (${noteSentiment.score}/100)`,
    )
  }
  if (weatherSentiment) {
    details.push(
      `Weather looks ${weatherSentiment.label.toLowerCase()} (${weatherSentiment.score}/100)`,
    )
  }
  return details.join(' · ')
}

export const evaluateRoutes = (routes, weights, options = {}) => {
  const weightRatios = normalizeWeights(weights)
  const scoredRoutes = Array.isArray(routes)
    ? routes.map((route) =>
        scoreRoute(route, weightRatios, {
          noteSentimentOverrides: options.noteSentimentOverrides,
        }),
      )
    : []
  const bestRoute = scoredRoutes.reduce((current, candidate) => {
    if (!candidate?.scorecard) {
      return current
    }
    if (!current) {
      return candidate
    }
    const candidateScore = candidate.scorecard.composite ?? 0
    const currentScore = current.scorecard.composite ?? 0
    return candidateScore > currentScore ? candidate : current
  }, null)

  return {
    scoredRoutes,
    recommendation: bestRoute
      ? {
          routeId: bestRoute.id,
          routeName: bestRoute.name,
          summary: summarizeRecommendation(bestRoute),
          score: bestRoute.scorecard?.composite ?? null,
        }
      : null,
  }
}
