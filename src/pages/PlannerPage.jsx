import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  ButtonGroup,
  Col,
  Container,
  Form,
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
import {
  DEFAULT_SCORING_WEIGHTS,
  evaluateRoutes,
} from '../services/routeScoring'
import { buildNoteSentimentOverrides } from '../services/sentiment'
import '../App.css'

const PREFERENCE_OPTIONS = [
  { value: 'safest', label: 'Safest' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'fastest', label: 'Fastest' },
]

const preferenceScore = (route, preference) => {
  const metrics =
    route.scorecard?.adjustedMetrics ?? route.metrics ?? {}
  const composite = route.scorecard?.composite ?? route.safetyScore ?? 0
  const noteScore = route.scorecard?.noteSentiment?.score ?? 50
  const weatherScore = route.scorecard?.weatherSentiment?.score ?? 50
  const base =
    composite +
    (noteScore - 50) * 0.25 +
    (weatherScore - 50) * 0.2

  switch (preference) {
    case 'fastest':
      return base + (metrics.speed ?? 0) * 0.3
    case 'balanced':
      return (
        base + ((metrics.balance ?? 0) * 0.2 + (metrics.safety ?? 0) * 0.2)
      )
    default:
      return base + (metrics.safety ?? 0) * 0.35
  }
}

const sortRoutesByPreference = (routes, preference) =>
  [...routes].sort(
    (a, b) => preferenceScore(b, preference) - preferenceScore(a, preference),
  )

const initialEvaluation = evaluateRoutes(mockRoutes, DEFAULT_SCORING_WEIGHTS)

function PlannerPage() {
  const { user } = useAuth()
  const [rawRoutes, setRawRoutes] = useState(mockRoutes)
  const [preference, setPreference] = useState('safest')
  const [selectedRouteId, setSelectedRouteId] = useState(
    initialEvaluation.recommendation?.routeId ??
      initialEvaluation.scoredRoutes[0]?.id ??
      null,
  )
  const [statusBanner, setStatusBanner] = useState(null)
  const [isPlanning, setIsPlanning] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState(null)
  const [lastTripRequest, setLastTripRequest] = useState(null)
  const [recordStatus, setRecordStatus] = useState(null)
  const [isSavingRecord, setIsSavingRecord] = useState(false)
  const [weightConfig, setWeightConfig] = useState({
    ...DEFAULT_SCORING_WEIGHTS,
  })
  const [noteSentimentOverrides, setNoteSentimentOverrides] = useState(
    new Map(),
  )
  const carouselRef = useRef(null)
  const [carouselNavState, setCarouselNavState] = useState({
    canScrollPrev: false,
    canScrollNext: false,
  })

  const evaluation = useMemo(
    () =>
      evaluateRoutes(rawRoutes ?? [], weightConfig, {
        noteSentimentOverrides,
      }),
    [rawRoutes, weightConfig, noteSentimentOverrides],
  )
  const routes = evaluation.scoredRoutes ?? []
  const recommendation = evaluation.recommendation ?? null

  const sortedRoutes = useMemo(
    () => sortRoutesByPreference(routes, preference),
    [routes, preference],
  )

  useEffect(() => {
    const node = carouselRef.current
    if (!node) {
      return undefined
    }
    const updateNavState = () => {
      setCarouselNavState({
        canScrollPrev: node.scrollLeft > 8,
        canScrollNext:
          node.scrollLeft + node.clientWidth < node.scrollWidth - 8,
      })
    }
    updateNavState()
    node.addEventListener('scroll', updateNavState)
    window.addEventListener('resize', updateNavState)
    return () => {
      node.removeEventListener('scroll', updateNavState)
      window.removeEventListener('resize', updateNavState)
    }
  }, [sortedRoutes])

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0 })
      setCarouselNavState({
        canScrollPrev: false,
        canScrollNext:
          carouselRef.current.scrollWidth >
          carouselRef.current.clientWidth + 8,
      })
    }
  }, [sortedRoutes])

  useEffect(() => {
    if (!sortedRoutes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(sortedRoutes[0]?.id ?? null)
    }
  }, [sortedRoutes, selectedRouteId])

  const activeRoute = useMemo(
    () => sortedRoutes.find((route) => route.id === selectedRouteId) ?? null,
    [sortedRoutes, selectedRouteId],
  )
  const currentRouteIndex = Math.max(
    0,
    sortedRoutes.findIndex((route) => route.id === selectedRouteId),
  )

  const handlePlanRoute = async (tripRequest) => {
    setIsPlanning(true)
    setLastTripRequest(tripRequest)
    try {
      const result = await fetchRoutes(tripRequest)
      const fetchedRoutes = Array.isArray(result.routes) ? result.routes : []
      const nextEvaluation = evaluateRoutes(fetchedRoutes, weightConfig, {
        noteSentimentOverrides,
      })
      setRawRoutes(fetchedRoutes)
      if (fetchedRoutes.length > 0) {
        const weatherSnapshot = fetchedRoutes.map((route) => ({
          name: route.name,
          weather: route.weather ?? null,
        }))
      }

      if (nextEvaluation.recommendation?.routeId) {
        setSelectedRouteId(nextEvaluation.recommendation.routeId)
      } else if (nextEvaluation.scoredRoutes.length > 0) {
        setSelectedRouteId(nextEvaluation.scoredRoutes[0].id)
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

  useEffect(() => {
    let isCancelled = false
    const updateSentiments = async () => {
      const overrides = await buildNoteSentimentOverrides(rawRoutes)
      if (!isCancelled) {
        setNoteSentimentOverrides(overrides)
      }
    }
    updateSentiments()
    return () => {
      isCancelled = true
    }
  }, [rawRoutes])

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

  const handleWeightChange = (field) => (event) => {
    const nextValue = Number(event.target.value)
    setWeightConfig((prev) => ({
      ...prev,
      [field]: nextValue,
    }))
  }

  const handleCarouselNav = (direction) => {
    const node = carouselRef.current
    if (!node) {
      return
    }
    const scrollAmount = node.clientWidth * 0.9
    node.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
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
          <Alert
            variant={statusBanner.type}
            className="status-banner"
            aria-live="polite"
            role="status"
          >
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

          <div className="weight-controls">
            <div className="weight-controls__header">
              <h3>Scoring weights</h3>
              <p>
                Emphasize community notes or weather risk. Weights auto-balance
                to produce the overall route fit score.
              </p>
            </div>
            <div className="weight-sliders">
              <Form.Group>
                <Form.Label>
                  Notes & community ({weightConfig.notes})
                </Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  step={5}
                  value={weightConfig.notes}
                  onChange={handleWeightChange('notes')}
                  aria-label="Community notes weight"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>
                  Weather impact ({weightConfig.weather})
                </Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  step={5}
                  value={weightConfig.weather}
                  onChange={handleWeightChange('weather')}
                  aria-label="Weather impact weight"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Base metrics ({weightConfig.metrics})</Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  step={5}
                  value={weightConfig.metrics}
                  onChange={handleWeightChange('metrics')}
                  aria-label="Base metrics weight"
                />
              </Form.Group>
            </div>
          </div>

          {recommendation ? (
            <Alert
              variant="success"
              className="status-banner mt-3"
              data-testid="route-recommendation"
              aria-live="polite"
              role="status"
            >
              Recommended route:{' '}
              <strong>{recommendation.routeName}</strong>{' '}
              {recommendation.score
                ? `(score ${recommendation.score}/100)`
                : null}
              {recommendation.summary ? (
                <>
                  {' '}
                  · {recommendation.summary}
                </>
              ) : null}
            </Alert>
          ) : null}

          <Row className="g-4 mt-1">
            <Col lg={8}>
              <div className="route-carousel">
                <button
                  type="button"
                  className="route-carousel__button"
                  disabled={!carouselNavState.canScrollPrev}
                  onClick={() => handleCarouselNav('prev')}
                  aria-label="View previous routes"
                >
                  ‹
                </button>
                <div className="route-carousel__track" ref={carouselRef}>
                  {sortedRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="route-carousel__item"
                      data-active={route.id === selectedRouteId}
                    >
                      <RouteCard
                        route={route}
                        isActive={route.id === selectedRouteId}
                        onSelect={() => setSelectedRouteId(route.id)}
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="route-carousel__button"
                  disabled={!carouselNavState.canScrollNext}
                  onClick={() => handleCarouselNav('next')}
                  aria-label="View more routes"
                >
                  ›
                </button>
              </div>
              {sortedRoutes.length > 0 ? (
                <p className="route-carousel__status">
                  Route {currentRouteIndex + 1} of {sortedRoutes.length}
                </p>
              ) : null}
              <div className="save-panel-wrapper">
                <SaveRecordPanel
                  activeRoute={activeRoute}
                  isSaving={isSavingRecord}
                  onSave={handleSaveRecord}
                  status={recordStatus}
                  user={user}
                />
              </div>
            </Col>
            <Col lg={4}>
              <FeedbackForm
                activeRoute={activeRoute}
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

export default PlannerPage
