import { useState } from 'react'
import { Button, ButtonGroup, Card, Col, Form, Row, ToggleButton } from 'react-bootstrap'
import styles from './RoutePlannerForm.module.css'

const DEFAULT_MODE = 'walk'

const MODE_OPTIONS = [
  { value: 'walk', label: 'Walking' },
  { value: 'bike', label: 'Cycling' },
  { value: 'scooter', label: 'Micromobility' },
]

function RoutePlannerForm({ isLoading, onPlanRoute }) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [mode, setMode] = useState(DEFAULT_MODE)

  const isSubmitDisabled =
    !origin.trim() || !destination.trim() || origin === destination

  const handleSwap = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (isSubmitDisabled) {
      return
    }

    onPlanRoute?.({
      origin: origin.trim(),
      destination: destination.trim(),
      mode,
    })
  }

  return (
    <Card className={styles.card}>
      <Card.Body>
        <div className={styles.header}>
          <div>
            <Card.Title className={styles.title}>Plan a safer trip</Card.Title>
            <Card.Subtitle className={styles.subtitle}>
              Swap between walking and cycling to compare route risk and time.
            </Card.Subtitle>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            className={styles.swapButton}
            onClick={handleSwap}
            disabled={!origin && !destination}
            aria-label="Swap origin and destination"
          >
            Swap
          </Button>
        </div>

        <Form className="mt-3" onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group controlId="trip-origin">
                <Form.Label className={styles.label}>Starting point</Form.Label>
                <Form.Control
                  placeholder="e.g. Madison Public Library"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  aria-label="Trip origin"
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="trip-destination">
                <Form.Label className={styles.label}>Destination</Form.Label>
                <Form.Control
                  placeholder="e.g. Capitol Square"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  aria-label="Trip destination"
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="travel-mode">
                <Form.Label className={styles.label}>Travel mode</Form.Label>
                <div
                  role="radiogroup"
                  aria-label="Select travel mode"
                  className={styles.modeButtons}
                >
                  <ButtonGroup>
                    {MODE_OPTIONS.map((option) => (
                      <ToggleButton
                        key={option.value}
                        id={`travel-mode-${option.value}`}
                        type="radio"
                        name="travel-mode"
                        value={option.value}
                        checked={mode === option.value}
                        variant={
                          mode === option.value ? 'primary' : 'outline-primary'
                        }
                        className={styles.modeButton}
                        onChange={(event) =>
                          setMode(event.currentTarget.value)
                        }
                        aria-label={option.label}
                      >
                        {option.label}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                </div>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Button
                type="submit"
                variant="primary"
                className={styles.submitButton}
                disabled={isSubmitDisabled || isLoading}
              >
                {isLoading ? 'Generating safer options…' : 'Find safer routes'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  )
}

export default RoutePlannerForm
