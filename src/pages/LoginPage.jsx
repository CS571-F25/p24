import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { user, signIn, register, firebaseReady } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/records', { replace: true })
    }
  }, [user, navigate])

  if (!firebaseReady) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Add your Firebase client credentials to <code>.env.local</code> to
          enable authentication.
        </Alert>
      </Container>
    )
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus(null)
    try {
      const action = mode === 'login' ? signIn : register
      await action(form.email, form.password)
      setStatus({
        type: 'success',
        message:
          mode === 'login'
            ? 'Welcome back! Redirecting to your records.'
            : 'Account created. You are now signed in.',
      })
      navigate('/records')
    } catch (error) {
      setStatus({
        type: 'danger',
        message: error?.message ?? 'Unable to process your request right now.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h1 className="h3 mb-1">
                      {mode === 'login' ? 'Log in' : 'Create account'}
                    </h1>
                    <p className="text-muted mb-0">
                      Use email + password authentication via Firebase.
                    </p>
                  </div>
                  <Button
                    variant="link"
                    onClick={() =>
                      setMode((prev) => (prev === 'login' ? 'register' : 'login'))
                    }
                  >
                    {mode === 'login'
                      ? 'Need an account?'
                      : 'Already have an account?'}
                  </Button>
                </div>

                {status ? (
                  <Alert variant={status.type}>{status.message}</Alert>
                ) : null}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="authEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="authPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      minLength={6}
                      required
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? 'Please wait…'
                        : mode === 'login'
                          ? 'Log in'
                          : 'Create account'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default LoginPage
