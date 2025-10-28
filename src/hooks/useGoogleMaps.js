import { useEffect, useState } from 'react'

const SCRIPT_ID = 'safe-commute-google-maps'

export function useGoogleMaps() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const rawKey =
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ??
      import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY?.trim() ??
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.trim()

    const apiKey =
      rawKey && rawKey.startsWith('"') && rawKey.endsWith('"')
        ? rawKey.slice(1, -1).trim()
        : rawKey

    if (!apiKey) {
      setError(
        new Error(
          'Missing Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY in .env',
        ),
      )
      return
    }

    if (window.google?.maps) {
      setIsReady(true)
      return
    }

    const existingScript = document.getElementById(SCRIPT_ID)

    const handleLoad = () => {
      setIsReady(true)
      setError(null)
    }

    const handleError = () => {
      setError(
        new Error(
          'Failed to load the Google Maps script. Check your API key and referrer restrictions.',
        ),
      )
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad)
      existingScript.addEventListener('error', handleError)
      return () => {
        existingScript.removeEventListener('load', handleLoad)
        existingScript.removeEventListener('error', handleError)
      }
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=geometry`
    script.async = true
    script.defer = true
    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }
  }, [])

  return { isReady, error }
}
