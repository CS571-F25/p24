import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ButtonGroup,
  Col,
  Container,
  Row,
  ToggleButton,
} from 'react-bootstrap'
import RoutePlannerForm from '../components/RoutePlannerForm'
import RouteCard from '../components/RouteCard'
import FeedbackForm from '../components/FeedbackForm'
import MapView from '../components/MapView'
import SaveRecordPanel from '../components/SaveRecordPanel'
import { fetchRoutes, submitFeedback } from '../services/api'
import { saveRouteRecord } from '../services/records'
import { feedbackCategories, mockRoutes } from '../data/mockRoutes'
import { useAuth } from '../context/AuthContext'
import '../App.css'

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

function PlannerPage() {
  const { user } = useAuth()
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
  const [lastTripRequest, setLastTripRequest] = useState(null)
  const [recordStatus, setRecordStatus] = useState(null)
  const [isSavingRecord, setIsSavingRecord] = useState(false)

  const sortedRoutes = useMemo(
    () => sortRoutesByPreference(routes, preference),
    [routes, preference],
  )

  useEffect(() => {
    if (!sortedRoutes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(sortedRoutes[0]?.id ?? null)
    }
  }, [sortedRoutes, selectedRouteId])

  const activeRoute = useMemo(
    () => sortedRoutes.find((route) => route.id === selectedRouteId) ?? null,
    [sortedRoutes, selectedRouteId],
  )

  const handlePlanRoute = async (tripRequest) => {
    setIsPlanning(true)
    setLastTripRequest(tripRequest)
    try {
      const result = await fetchRoutes(tripRequest)
      setRoutes(result.routes)
      if (Array.isArray(result.routes) && result.routes.length > 0) {
        const weatherSnapshot = result.routes.map((route) => ({
          name: route.name,
          weather: route.weather ?? null,
        }))
      }

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
    const payloadWithContext = {
      ...feedbackPayload,
      routeId: activeRoute?.id ?? null,
      routeName: activeRoute?.name ?? null,
      preference,
      tripOrigin: lastTripRequest?.origin ?? null,
      tripDestination: lastTripRequest?.destination ?? null,
    }

    const result = await submitFeedback(payloadWithContext)
    setFeedbackStatus(result)
    return result
  }

  const handleSaveRecord = async (note) => {
    if (!activeRoute) {
      setRecordStatus({
        type: 'danger',
        message: 'Select a route before saving.',
      })
      return
    }

    setIsSavingRecord(true)
    setRecordStatus(null)
    try {
      await saveRouteRecord({
        userId: user?.uid,
        route: activeRoute,
        note,
        preference,
        tripRequest: lastTripRequest,
      })
      setRecordStatus({
        type: 'success',
        message: 'Saved! Visit the records screen to review it later.',
      })
    } catch (error) {
      setRecordStatus({
        type: 'danger',
        message:
          error?.message ??
          'We could not save this route right now. Please try again later.',
      })
    } finally {
      setIsSavingRecord(false)
    }
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
                activeRoute={activeRoute}
                categories={feedbackCategories}
                onSubmit={handleFeedbackSubmit}
                status={feedbackStatus}
              />
              <SaveRecordPanel
                activeRoute={activeRoute}
                isSaving={isSavingRecord}
                onSave={handleSaveRecord}
                status={recordStatus}
                user={user}
              />
            </Col>
          </Row>
        </section>
      </Container>
    </div>
  )
}

export default PlannerPage
