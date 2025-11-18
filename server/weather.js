const fetch = globalThis.fetch

const DEFAULT_USER_AGENT = 'SafeCommute/1.0 (tanush.shrivastava@gmail.com)'
const WEATHER_USER_AGENT =
  process.env.WEATHER_USER_AGENT?.trim() || DEFAULT_USER_AGENT
const WEATHER_CACHE_TTL_MS = Number(
  process.env.WEATHER_CACHE_TTL_MS ?? 10 * 60 * 1000,
)

const cache = new Map()

const withCache = (key, factory) => {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const valuePromise = factory().catch((error) => {
    cache.delete(key)
    throw error
  })
  cache.set(key, {
    value: valuePromise,
    expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
  })
  return valuePromise
}

const requestJson = async (url, options = {}) => {
  const { headers: extraHeaders } = options
  const response = await fetch(url, {
    headers: {
      'User-Agent': WEATHER_USER_AGENT,
      Accept: 'application/json',
      ...extraHeaders,
    },
  })

  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`)
  }

  return response.json()
}

const OPEN_METEO_CODES = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm',
}

const getOpenMeteoSummary = async (lat, lng) => {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    current:
      'temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
  })

  try {
    const data = await requestJson(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      {
        headers: {
          'User-Agent': WEATHER_USER_AGENT,
        },
      },
    )

    const current = data?.current
    if (!current) {
      return null
    }

    return {
      shortForecast:
        OPEN_METEO_CODES[current.weather_code] ?? 'Conditions mixed',
      detailedForecast: `Precip ${
        current.precipitation ?? 0
      } in, chance ${current.precipitation_probability ?? 0}%`,
      temperature: current.temperature_2m,
      temperatureUnit: 'F',
      windSpeed:
        typeof current.wind_speed_10m === 'number'
          ? `${current.wind_speed_10m} mph`
          : null,
      windDirection:
        typeof current.wind_direction_10m === 'number'
          ? `${current.wind_direction_10m}°`
          : null,
      startTime: current.time ?? null,
      endTime: null,
      precipitationChance: current.precipitation_probability ?? null,
    }
  } catch (error) {
    console.warn('Open-Meteo request failed', error.message)
    return null
  }
}

async function getWeatherSummary(lat, lng) {
  try {
    const key = `open-meteo:${lat}:${lng}`
    return await withCache(key, () => getOpenMeteoSummary(lat, lng))
  } catch (error) {
    console.warn('Open-Meteo summary failed', error.message)
    return null
  }
}

const describeWeatherIncident = (summary) => {
  if (!summary) {
    return null
  }

  const temperature =
    typeof summary.temperature === 'number'
      ? `${summary.temperature}°${summary.temperatureUnit}`
      : null

  const precipitation =
    typeof summary.precipitationChance === 'number'
      ? ` · ${summary.precipitationChance}% precip`
      : ''

  return `Weather: ${summary.shortForecast ?? 'Conditions mixed'}${
    temperature ? ` (${temperature}${precipitation})` : ''
  }`
}

module.exports = {
  getWeatherSummary,
  describeWeatherIncident,
}
