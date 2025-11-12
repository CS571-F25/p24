import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from 'react-bootstrap'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeToUserRecords } from '../services/records'

const formatDateTime = (date) =>
  date
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : 'Pending timestamp…'

function RecordsPage() {
  const { user, firebaseReady } = useAuth()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!firebaseReady || !user) {
      setIsLoading(false)
      setRecords([])
      return
    }

    setIsLoading(true)
    const unsubscribe = subscribeToUserRecords(
      user.uid,
      (nextRecords) => {
        setRecords(nextRecords)
        setError(null)
        setIsLoading(false)
      },
      (nextError) => {
        setError(nextError)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [user, firebaseReady])

  const summary = useMemo(() => {
    if (!records.length) {
      return ''
    }
    const preferences = records.reduce((acc, record) => {
      acc[record.preference] = (acc[record.preference] ?? 0) + 1
      return acc
    }, {})

    const [topPreference] =
      Object.entries(preferences).sort((a, b) => b[1] - a[1])[0] ?? []

    return topPreference
      ? `You save the ${topPreference} option most often.`
      : ''
  }, [records])

  if (!firebaseReady) {
    return (
      <div className="py-5">
        <Container>
          <Alert variant="warning">
            Connect Firebase to enable route history. Populate the{' '}
            <code>VITE_FIREBASE_*</code> variables in <code>.env.local</code>{' '}
            and restart Vite.
          </Alert>
        </Container>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-5">
        <Container>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Sign in to see your records</Card.Title>
              <Card.Text>
                Saved routes and comments are scoped to your Firebase account.
                Log in to sync across devices.
              </Card.Text>
              <NavLink className="btn btn-primary" to="/login">
                Go to login
              </NavLink>
            </Card.Body>
          </Card>
        </Container>
      </div>
    )
  }

  return (
    <div className="py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">Your saved records</h1>
            <p className="text-muted mb-0">
              Every time you save from the planner we capture the route,
              context, and your optional note.
            </p>
          </div>
        </div>

        {error ? (
          <Alert variant="danger">
            {error?.message ??
              'Something went wrong while loading your records.'}
          </Alert>
        ) : null}

        {summary ? <Alert variant="info">{summary}</Alert> : null}

        {isLoading ? (
          <div className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Loading your records…</span>
          </div>
        ) : records.length === 0 ? (
          <Alert variant="secondary">
            No records yet. Visit the planner, pick a route, and use “Save
            route” to build your history.
          </Alert>
        ) : (
          <Row className="g-4">
            {records.map((record) => (
              <Col md={6} key={record.id}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <Card.Title className="h5 mb-0">
                          {record.routeName ?? 'Unnamed route'}
                        </Card.Title>
                        <Card.Subtitle className="text-muted">
                          {record.tripOrigin ?? 'Unknown origin'} →{' '}
                          {record.tripDestination ?? 'unknown destination'}
                        </Card.Subtitle>
                      </div>
                      <Badge bg="primary" className="text-capitalize">
                        {record.preference ?? 'safest'}
                      </Badge>
                    </div>
                    {record.note ? (
                      <p className="mb-2">{record.note}</p>
                    ) : (
                      <p className="text-muted mb-2">
                        No personal note attached.
                      </p>
                    )}
                    <div className="small text-muted d-flex flex-column">
                      <span>{formatDateTime(record.createdAt)}</span>
                      {record.estimatedDuration || record.distanceMiles ? (
                        <span>
                          {record.estimatedDuration
                            ? `Duration: ${record.estimatedDuration} min`
                            : null}
                          {record.estimatedDuration && record.distanceMiles
                            ? ' · '
                            : ''}
                          {record.distanceMiles
                            ? `Distance: ${record.distanceMiles} miles`
                            : null}
                        </span>
                      ) : null}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  )
}

export default RecordsPage
