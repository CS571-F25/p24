import { Card, Spinner } from 'react-bootstrap'
import { useEffect, useRef } from 'react'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import styles from './MapView.module.css'

const DEFAULT_CENTER = { lat: 43.0731, lng: -89.4012 }

function MapView({ activeRouteId, onSelectRoute, routes }) {
  const containerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const polylinesRef = useRef([])
  const { error, isReady } = useGoogleMaps()

  useEffect(() => {
    if (!isReady || mapInstanceRef.current || !containerRef.current) {
      return
    }

    mapInstanceRef.current = new window.google.maps.Map(
      containerRef.current,
      {
        center: DEFAULT_CENTER,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }],
          },
        ],
      },
    )
  }, [isReady])

  useEffect(() => {
    if (!isReady || !mapInstanceRef.current) {
      return
    }

    polylinesRef.current.forEach((polyline) => polyline.setMap(null))
    polylinesRef.current = []

    const bounds = new window.google.maps.LatLngBounds()

    routes.forEach((route) => {
      if (!Array.isArray(route.coordinates) || route.coordinates.length === 0) {
        return
      }

      const path = route.coordinates.map((coordinate) => ({
        lat: coordinate.lat,
        lng: coordinate.lng,
      }))

      path.forEach((point) => bounds.extend(point))

      const polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: route.id === activeRouteId ? '#0d6efd' : '#74b3ff',
        strokeOpacity: route.id === activeRouteId ? 0.95 : 0.65,
        strokeWeight: route.id === activeRouteId ? 6 : 4,
      })

      polyline.addListener('click', () => onSelectRoute?.(route.id))
      polyline.setMap(mapInstanceRef.current)
      polylinesRef.current.push(polyline)
    })

    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, 48)
    } else {
      mapInstanceRef.current.setCenter(DEFAULT_CENTER)
      mapInstanceRef.current.setZoom(13)
    }
  }, [activeRouteId, isReady, onSelectRoute, routes])

  useEffect(() => {
    const currentPolylines = polylinesRef.current
    return () => {
      currentPolylines.forEach((polyline) => polyline.setMap(null))
      console.log(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
    }
  }, [])

  if (error) {
    return (
      <Card className={styles.card}>
        <Card.Body className="d-flex flex-column justify-content-center align-items-start gap-2">
          <Card.Title className={styles.title}>
            Map preview unavailable
          </Card.Title>
          <Card.Text className={styles.description}>
            {error.message}. Add a valid{' '}
            <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> to <code>.env</code> to
            unlock the interactive preview.
          </Card.Text>
        </Card.Body>
      </Card>
    )
  }

  if (!isReady) {
    return (
      <Card className={styles.card}>
        <Card.Body className="d-flex justify-content-center align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Spinner animation="border" variant="primary" />
            <span className={styles.loadingLabel}>Loading map data…</span>
          </div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className={styles.card}>
      <div ref={containerRef} className={styles.mapContainer} />
    </Card>
  )
}

export default MapView
