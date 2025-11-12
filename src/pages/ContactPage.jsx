import { Card, Col, Container, Form, Row } from 'react-bootstrap'

function ContactPage() {
  return (
    <div className="py-5">
      <Container>
        <Row className="mb-4">
          <Col lg={8}>
            <h1 className="display-6 fw-bold">Contact the Team</h1>
            <p className="text-muted">
              Have a data source you would like to integrate or feedback on the
              planner experience? Reach out and we will follow up quickly.
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Send a note</Card.Title>
                <Form>
                  <Form.Group className="mb-3" controlId="contactName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Safe Streets Coalition"
                      disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="contactEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="hello@safewalk.app"
                      disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="contactMessage">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Hook this form up to a backend to send real mail."
                      disabled
                    />
                  </Form.Group>
                </Form>
                <p className="small text-muted mb-0">
                  The demo does not send messages yet, but the UI mirrors the
                  fields your API would expect.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Quick links</Card.Title>
                <ul className="list-unstyled">
                  <li>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:safecommute@example.com">
                      safecommute@example.com
                    </a>
                  </li>
                  <li>
                    <strong>Community:</strong> #safecommute in the CS571 Slack
                  </li>
                  <li>
                    <strong>Office hours:</strong> Tuesdays 3-5pm (virtual)
                  </li>
                </ul>
                <p className="text-muted mb-0">
                  Drop a line if you would like to contribute or partner with
                  the project.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default ContactPage
