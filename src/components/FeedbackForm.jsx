import { useState } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import styles from './FeedbackForm.module.css'

const INITIAL_FORM = {
  name: '',
  email: '',
  category: '',
  notes: '',
  locationHint: '',
}

function FeedbackForm({ activeRoute, categories, onSubmit, status }) {
  const [formState, setFormState] = useState(() => ({
    ...INITIAL_FORM,
    category: categories[0]?.value ?? '',
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localStatus, setLocalStatus] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await onSubmit(formState)
      setLocalStatus(result)
      if (result?.success) {
        setFormState({
          ...INITIAL_FORM,
          category: categories[0]?.value ?? '',
        })
      }
    } catch (error) {
      setLocalStatus({
        success: false,
        type: 'danger',
        message:
          error?.message ??
          'We could not save your feedback right now. Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const banner = status ?? localStatus

  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title className={styles.title}>Share street intel</Card.Title>
        <Card.Subtitle className={styles.subtitle}>
          Residents help keep the map current. Let us know what you see out
          there.
        </Card.Subtitle>

        <div className={styles.routeBadge} data-has-route={!!activeRoute}>
          <span className={styles.routeBadgeLabel}>This note tags:</span>
          <strong className={styles.routeBadgeValue}>
            {activeRoute?.name ?? 'Select a route to attach your feedback'}
          </strong>
        </div>

        {banner?.message ? (
          <Alert
            variant={banner.type ?? (banner.success ? 'success' : 'danger')}
            className={styles.alert}
          >
            {banner.message}
          </Alert>
        ) : null}

        <Form className="mt-3" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="feedback-name">
            <Form.Label className={styles.label}>Name</Form.Label>
            <Form.Control
              name="name"
              placeholder="Optional"
              value={formState.name}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="feedback-email">
            <Form.Label className={styles.label}>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Optional"
              value={formState.email}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="feedback-category">
            <Form.Label className={styles.label}>Category</Form.Label>
            <Form.Select
              name="category"
              value={formState.category}
              onChange={handleChange}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="feedback-location">
            <Form.Label className={styles.label}>Where is this?</Form.Label>
            <Form.Control
              name="locationHint"
              placeholder="Cross streets or landmarks (optional)"
              value={formState.locationHint}
              onChange={handleChange}
            />
            <Form.Text muted>
              Include a nearby landmark so future travelers can benefit.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="feedback-notes">
            <Form.Label className={styles.label}>Notes</Form.Label>
            <Form.Control
              as="textarea"
              name="notes"
              rows={3}
              placeholder="Tell the community what you noticed…"
              value={formState.notes}
              onChange={handleChange}
              required
            />
          </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className={styles.submitButton}
          disabled={isSubmitting || !formState.notes.trim()}
        >
            {isSubmitting ? 'Sending…' : 'Submit feedback'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  )
}

export default FeedbackForm
