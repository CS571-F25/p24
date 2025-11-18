import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from 'react-bootstrap'
import emailjs from 'emailjs-com'
import { contactConfig } from '../data/contactConfig'

const INITIAL_FORM = {
  name: '',
  email: '',
  message: '',
}

function ContactPage() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const sanitizedPhone = contactConfig.phone.replace(/\D/g, '')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus({
        type: 'danger',
        message: 'Please fill out every field before sending.',
      })
      return
    }

    setIsSubmitting(true)
    setStatus(null)
    try {
      await emailjs.send(
        contactConfig.serviceId,
        contactConfig.templateId,
        {
          from_name: formData.name,
          reply_to: formData.email,
          message: formData.message,
        },
        contactConfig.userId,
      )
      setStatus({
        type: 'success',
        message: 'Thanks! Your message is on its way.',
      })
      setFormData(INITIAL_FORM)
    } catch (error) {
      setStatus({
        type: 'danger',
        message:
          error?.message ??
          'We could not send that message right now. Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
                {status ? (
                  <Alert variant={status.type} className="mb-3">
                    {status.message}
                  </Alert>
                ) : null}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="contactName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Safe Streets Coalition"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="contactEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="hello@safewalk.app"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="contactMessage">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="message"
                      placeholder="How can we collaborate?"
                      value={formData.message}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-100"
                  >
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </Button>
                </Form>
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
                    <a href={`mailto:${contactConfig.email}`}>
                      {contactConfig.email}
                    </a>
                  </li>
                </ul>
                <p className="text-muted mb-0">
                  {contactConfig.description}
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
