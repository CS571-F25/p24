import { mockRoutes } from '../data/mockRoutes'

const rawBaseUrl =
  import.meta.env.VITE_BACKEND_BASE_URL ??
  import.meta.env.REACT_APP_BACKEND_BASE_URL ??
  process.env.REACT_APP_BACKEND_BASE_URL ??
  ''

const BASE_URL = rawBaseUrl.replace(/\/$/, '')

const headers = {
  'Content-Type': 'application/json',
}

export async function fetchRoutes(criteria) {
  if (!BASE_URL) {
    return {
      routes: mockRoutes,
      usedMock: true,
      message:
        'Backend base URL is not set. Update VITE_BACKEND_BASE_URL to fetch live routes.',
    }
  }

  try {
    // eslint-disable-next-line no-console
    const response = await fetch(`${BASE_URL}/routes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(criteria),
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const payload = await response.json()
    if (!Array.isArray(payload?.routes)) {
      throw new Error('Unexpected response shape. Expected { routes: [] }.')
    }

    return {
      routes: payload.routes,
      usedMock: false,
    }
  } catch (error) {
    console.warn('SafeCommute fetchRoutes fallback to mock data', error)
    return {
      routes: mockRoutes,
      usedMock: true,
      message:
        error?.message ??
        'Unable to reach the backend. Showing demo-safe routes instead.',
    }
  }
}

export async function submitFeedback(feedback) {
  if (!BASE_URL) {
    return {
      success: true,
      type: 'info',
      message:
        'Feedback captured locally. Configure VITE_BACKEND_BASE_URL to post to your API.',
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify(feedback),
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(
        errorPayload?.message ??
          `Request failed with status ${response.status}`,
      )
    }

    const payload = await response.json().catch(() => null)
    if (payload && typeof payload === 'object') {
      return payload
    }

    return {
      success: true,
      type: 'success',
      message: 'Thanks! Your feedback was delivered to the SafeCommute API.',
    }
  } catch (error) {
    console.error('SafeCommute submitFeedback failed', error)
    return {
      success: false,
      type: 'danger',
      message:
        error?.message ??
        'We could not reach the backend. Please try again in a few minutes.',
    }
  }
}
