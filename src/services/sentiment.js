let classifierPromise = null
let hasLoggedWarning = false

const loadClassifier = async () => {
  if (classifierPromise) {
    return classifierPromise
  }

  classifierPromise = (async () => {
    const module = await import(
      /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers'
    )
    const { pipeline, env } = module
    env.allowLocalModels = false
    return pipeline(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    )
  })().catch((error) => {
    classifierPromise = null
    throw error
  })

  return classifierPromise
}

const gatherRouteNotes = (route) => {
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

const labelFromScore = (score) => {
  if (score >= 70) {
    return 'Positive'
  }
  if (score <= 40) {
    return 'Caution'
  }
  return 'Neutral'
}

const normalizeScore = (result) => {
  if (!result) {
    return 50
  }
  const rawScore = typeof result.score === 'number' ? result.score : 0.5
  const label = String(result.label ?? '').toLowerCase()
  const positiveProbability = label.includes('negative')
    ? 1 - rawScore
    : rawScore
  return Math.round(positiveProbability * 100)
}

const classifyNotes = async (notes) => {
  if (notes.length === 0) {
    return null
  }
  try {
    const classifier = await loadClassifier()
    const predictions = []
    // Run sequentially to avoid overwhelming the browser
    for (const note of notes) {
      // eslint-disable-next-line no-await-in-loop
      const result = await classifier(note)
      if (Array.isArray(result)) {
        predictions.push(result)
      }
    }
    return predictions.length > 0 ? predictions : null
  } catch (error) {
    if (!hasLoggedWarning) {
      // eslint-disable-next-line no-console
      console.warn(
        'Sentiment model unavailable — falling back to heuristic scores.',
        error?.message ?? error,
      )
      hasLoggedWarning = true
    }
    return null
  }
}

export const buildNoteSentimentOverrides = async (routes) => {
  if (!Array.isArray(routes) || routes.length === 0) {
    return new Map()
  }

  const overrides = new Map()

  await Promise.all(
    routes.map(async (route) => {
      const notes = gatherRouteNotes(route)
      if (!route?.id || notes.length === 0) {
        return
      }

      const predictions = await classifyNotes(notes)
      if (!predictions) {
        return
      }

      const normalizedScores = predictions.map((prediction) =>
        normalizeScore(prediction[0]),
      )
      const aggregate =
        normalizedScores.reduce((total, value) => total + value, 0) /
        normalizedScores.length

      let positiveCount = 0
      let negativeCount = 0
      predictions.forEach((prediction) => {
        const top = prediction[0]
        if (!top) {
          return
        }
        if (String(top.label ?? '').toUpperCase().includes('POSITIVE')) {
          positiveCount += 1
        } else {
          negativeCount += 1
        }
      })

      overrides.set(route.id, {
        score: Math.round(aggregate),
        label: labelFromScore(aggregate),
        reasons: [
          `AI sentiment: ${positiveCount} positive / ${negativeCount} caution`,
        ],
        statsOverride: {
          totalReports: predictions.length,
          positive: positiveCount,
          negative: negativeCount,
        },
      })
    }),
  )

  return overrides
}
