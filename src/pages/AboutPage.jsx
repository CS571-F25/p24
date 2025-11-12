import { Card, Col, Container, Row } from 'react-bootstrap'

function AboutPage() {
  return (
    <div className="py-5">
      <Container>
        <Row className="mb-4">
          <Col lg={8}>
            <h1 className="display-5 fw-bold">About SafeCommute</h1>
            <p className="lead text-muted">
              SafeCommute blends community feedback, weather, and transportation
              data so you can evaluate route options with confidence.
            </p>
            <p>
              The experience began as a class project focused on giving walkers
              and cyclists a lightweight way to surface safer routes at night.
              Since then the feature set has expanded to include feedback loops,
              weather overlays, and route storage for authenticated users.
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>Data Driven</Card.Title>
                <Card.Text>
                  Pair official incident feeds with first-hand community reports
                  and weather radar to understand risk in context.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>People First</Card.Title>
                <Card.Text>
                  We prioritize clarity and accessibility so people can act on
                  insights quickly when time matters most.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>Extensible</Card.Title>
                <Card.Text>
                  The modular architecture makes it easy to plug in different
                  backends or expand the UI with new safety signals.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default AboutPage
