import { useEffect, useRef, useState } from 'react';
import useGoogleMaps from '../hooks/useGoogleMaps';
import './MapView.css';

const SAFEST_COLOR = '#22c55e';
const BALANCED_COLOR = '#f97316';
const FASTEST_COLOR = '#3b82f6';

const routeColor = (type) => {
  switch (type) {
    case 'safest':
      return SAFEST_COLOR;
    case 'balanced':
      return BALANCED_COLOR;
    case 'fastest':
    default:
      return FASTEST_COLOR;
  }
};

const MapView = ({ routes, activeRouteId, onRouteSelect }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const polylinesRef = useRef([]);
  const [isInteractive, setIsInteractive] = useState(true);

  const { status, google, mapError } = useGoogleMaps({
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    onScriptBlocked: () => setIsInteractive(false)
  });

  useEffect(() => {
    if (status !== 'ready' || !containerRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: { lat: 37.77919, lng: -122.41914 },
      zoom: 14,
      mapId: process.env.REACT_APP_GOOGLE_MAPS_ID,
      disableDefaultUI: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
      ]
    });
  }, [status, google]);

  useEffect(() => {
    if (!mapRef.current || status !== 'ready') {
      return;
    }

    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    if (!routes.length) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    const newPolylines = routes.map((route) => {
      const path = route.coordinates.map(([lat, lng]) => ({ lat, lng }));
      path.forEach((point) => bounds.extend(point));

      const polyline = new google.maps.Polyline({
        path,
        strokeColor: routeColor(route.type),
        strokeOpacity: route.id === activeRouteId ? 0.95 : 0.6,
        strokeWeight: route.id === activeRouteId ? 6 : 4
      });

      polyline.setMap(mapRef.current);
      polyline.addListener('click', () => onRouteSelect?.(route.id));
      return polyline;
    });

    polylinesRef.current = newPolylines;

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [routes, activeRouteId, status, google, onRouteSelect]);

  if (!isInteractive) {
    return (
      <div className="map-view map-view--fallback">
        <h3>Map unavailable</h3>
        <p>Add a valid Google Maps API key to `.env.local` to enable the interactive map.</p>
        <code>REACT_APP_GOOGLE_MAPS_API_KEY=your-key</code>
      </div>
    );
  }

  return (
    <div className="map-view">
      {status === 'loading' && <span className="map-view__loading">Loading map…</span>}
      {mapError && <span className="map-view__error">{mapError}</span>}
      <div ref={containerRef} className="map-view__canvas" role="presentation" />
    </div>
  );
};

export default MapView;
