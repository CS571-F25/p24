import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ButtonGroup,
  Col,
  Container,
  Row,
  ToggleButton,
} from 'react-bootstrap'
import RoutePlannerForm from './components/RoutePlannerForm'
import RouteCard from './components/RouteCard'
import FeedbackForm from './components/FeedbackForm'
import MapView from './components/MapView'
import { fetchRoutes, submitFeedback } from './services/api'
import { feedbackCategories, mockRoutes } from './data/mockRoutes'
import './App.css'

const PREFERENCE_OPTIONS = [
  { value: 'safest', label: 'Safest' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'fastest', label: 'Fastest' },
]

const preferenceScore = (route, preference) => {
  const metrics = route.metrics ?? {}

  switch (preference) {
    case 'fastest':
      return metrics.speed ?? -(route.estimatedDuration ?? 0)
    case 'balanced':
      return (
        metrics.balance ??
        ((metrics.safety ?? 0) * 0.7 + (metrics.speed ?? 0) * 0.3)
      )
    default:
      return metrics.safety ?? route.safetyScore ?? 0
  }
}

const sortRoutesByPreference = (routes, preference) =>
  [...routes].sort(
    (a, b) => preferenceScore(b, preference) - preferenceScore(a, preference),
  )

function App() {
  const [routes, setRoutes] = useState(mockRoutes)
  const [preference, setPreference] = useState('safest')
  const [selectedRouteId, setSelectedRouteId] = useState(
    mockRoutes[0]?.id ?? null,
  )
  const [statusBanner, setStatusBanner] = useState({
    type: 'info',
    text: 'Demo mode: connect your backend to power live safety data.',
  })
  const [isPlanning, setIsPlanning] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState(null)

  const sortedRoutes = useMemo(
    () => sortRoutesByPreference(routes, preference),
    [routes, preference],
  )

  useEffect(() => {
    if (!sortedRoutes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(sortedRoutes[0]?.id ?? null)
    }
  }, [sortedRoutes, selectedRouteId])

  const handlePlanRoute = async (tripRequest) => {
    setIsPlanning(true)
    try {
      const result = await fetchRoutes(tripRequest)
      setRoutes(result.routes)

      if (result.routes.length > 0) {
        setSelectedRouteId(result.routes[0].id)
      }

      if (result.usedMock) {
        setStatusBanner({
          type: 'warning',
          text:
            result.message ??
            'Backend unavailable — showing demo routes instead.',
        })
      } else {
        setStatusBanner({
          type: 'success',
          text: 'Live safety routes loaded from your API.',
        })
      }
    } catch (error) {
      setStatusBanner({
        type: 'danger',
        text:
          error?.message ??
          'Something went wrong while planning your trip. Please try again.',
      })
    } finally {
      setIsPlanning(false)
    }
  }

  const handleFeedbackSubmit = async (feedbackPayload) => {
    const result = await submitFeedback(feedbackPayload)
    setFeedbackStatus(result)
    return result
  }

  return (
    <div className="app-surface">
      <Container className="py-4">
        <header className="hero">
          <div>
            <span className="badge rounded-pill text-bg-primary fw-medium mb-3">
              SafeCommute
            </span>
            <h1 className="hero-title">Plan safer walks & rides</h1>
            <p className="hero-lede">
              Compare community-sourced safety data alongside travel time so
              walkers and cyclists can choose the route that fits their comfort
              level.
            </p>
          </div>
        </header>

        {statusBanner && statusBanner.text ? (
          <Alert variant={statusBanner.type} className="status-banner">
            {statusBanner.text}
          </Alert>
        ) : null}

        <Row className="g-4 align-items-stretch">
          <Col lg={4}>
            <RoutePlannerForm
              isLoading={isPlanning}
              onPlanRoute={handlePlanRoute}
            />
          </Col>
          <Col lg={8}>
            <MapView
              routes={sortedRoutes}
              activeRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
            />
          </Col>
        </Row>

        <section className="routes-section">
          <div className="section-heading">
            <div>
              <h2 className="section-title">Route recommendations</h2>
              <p className="section-subtitle">
                Toggle priorities to re-order the same set of routes by what
                matters most to your travelers.
              </p>
            </div>

            <ButtonGroup>
              {PREFERENCE_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.value}
                  id={`preference-${option.value}`}
                  type="radio"
                  name="preference"
                  value={option.value}
                  variant={
                    preference === option.value
                      ? 'primary'
                      : 'outline-primary'
                  }
                  checked={preference === option.value}
                  onChange={(event) => setPreference(event.currentTarget.value)}
                  className="preference-toggle"
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ButtonGroup>
          </div>

          <Row className="g-4 mt-1">
            <Col lg={8}>
              <div className="route-list">
                {sortedRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isActive={route.id === selectedRouteId}
                    onSelect={() => setSelectedRouteId(route.id)}
                  />
                ))}
              </div>
            </Col>
            <Col lg={4}>
              <FeedbackForm
                categories={feedbackCategories}
                onSubmit={handleFeedbackSubmit}
                status={feedbackStatus}
              />
            </Col>
          </Row>
        </section>
      </Container>
    </div>
  )
}

export default App
