import { useEffect, useMemo, useState } from 'react';
import AppHeader from './components/AppHeader';
import RoutePlannerForm from './components/RoutePlannerForm';
import RoutePreferenceToggle from './components/RoutePreferenceToggle';
import RouteList from './components/RouteList';
import MapView from './components/MapView';
import SafetyLegend from './components/SafetyLegend';
import FeedbackForm from './components/FeedbackForm';
import { fetchRoutes } from './services/api';
import { mockRoutes } from './data/mockRoutes';
import './App.css';

const App = () => {
  const [routes, setRoutes] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [preference, setPreference] = useState('safest');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setRoutes(mockRoutes);
    setActiveRouteId('route-safest');
    setStatusMessage('Showing demo routes. Connect the backend to surface live data.');
  }, []);

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === activeRouteId) ?? null,
    [routes, activeRouteId]
  );

  const filteredRoutes = useMemo(() => {
    if (!routes.length) {
      return [];
    }

    if (preference === 'balanced') {
      return routes;
    }

    return routes
      .filter((route) => route.type === preference)
      .concat(routes.filter((route) => route.type !== preference));
  }, [routes, preference]);

  const handlePlannerSubmit = async ({ start, end, mode }) => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const { routes: results, source } = await fetchRoutes({ start, end, mode, preference });
      setRoutes(results);

      const bestMatch =
        results.find((route) => route.type === preference) ??
        results.find((route) => route.type === 'balanced') ??
        results[0];

      setActiveRouteId(bestMatch?.id ?? null);

      if (source === 'mock') {
        setStatusMessage('Live backend unreachable. Displaying SafeCommute demo data.');
      } else {
        setStatusMessage(`Fetched ${results.length} routes from SafeCommute API.`);
      }
    } catch (error) {
      console.error('Unable to fetch routes', error);
      setStatusMessage('Routes could not be loaded. Showing latest cached demo data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <section className="app-main__left">
          <RoutePlannerForm onSubmit={handlePlannerSubmit} isLoading={isLoading} />

          <div className="app-panel">
            <div className="app-panel__header">
              <div>
                <h2>Routes</h2>
                <p>Toggle priorities to see how travel time compares to safety scores.</p>
              </div>
              <RoutePreferenceToggle value={preference} onChange={setPreference} />
            </div>

            {statusMessage && <div className="app-status">{statusMessage}</div>}

            {filteredRoutes.length ? (
              <RouteList routes={filteredRoutes} activeRouteId={activeRouteId} onSelect={setActiveRouteId} />
            ) : (
              <div className="app-empty-state">
                <h3>No routes yet</h3>
                <p>Set your start and destination to see SafeCommute suggestions.</p>
              </div>
            )}
          </div>

          <FeedbackForm />
        </section>

        <section className="app-main__right">
          <MapView routes={routes} activeRouteId={activeRouteId} onRouteSelect={setActiveRouteId} />
          <SafetyLegend />

          {activeRoute && (
            <div className="insights">
              <h2>Route insights</h2>
              <div className="insights__grid">
                <div className="insight-card">
                  <h3>Safety score</h3>
                  <span className="insight-card__value">{activeRoute.safetyScore.toFixed(1)}</span>
                  <p>{activeRoute.summary}</p>
                </div>
                <div className="insight-card">
                  <h3>Community notes</h3>
                  <ul>
                    {activeRoute.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="insight-card insight-card--alert">
                  <h3>Alerts &amp; incidents</h3>
                  <ul>
                    {activeRoute.incidents.map((incident) => (
                      <li key={incident}>{incident}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
