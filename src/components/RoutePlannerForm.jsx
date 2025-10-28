import { useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
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

    onPlanRoute({
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
          >
            Swap
          </Button>
        </div>

        <Form className="mt-3" onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label className={styles.label}>Starting point</Form.Label>
              <Form.Control
                placeholder="e.g. Madison Public Library"
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
              />
            </Col>
            <Col xs={12}>
              <Form.Label className={styles.label}>Destination</Form.Label>
              <Form.Control
                placeholder="e.g. Capitol Square"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              />
            </Col>
            <Col xs={12}>
              <Form.Label className={styles.label}>Travel mode</Form.Label>
              <div className={styles.modeButtons}>
                {MODE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      mode === option.value ? 'primary' : 'outline-primary'
                    }
                    className={styles.modeButton}
                    onClick={() => setMode(option.value)}
                    type="button"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
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
