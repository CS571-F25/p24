import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'

function SaveRecordPanel({
  activeRoute,
  isSaving,
  onSave,
  status,
  user,
}) {
  const [note, setNote] = useState('')

  useEffect(() => {
    setNote('')
  }, [activeRoute?.id])

  useEffect(() => {
    if (status?.type === 'success') {
      setNote('')
    }
  }, [status])

  if (!user) {
    return (
      <Card className="shadow-sm mt-4">
        <Card.Body>
          <Card.Title>Save your intel</Card.Title>
          <Card.Text>
            Log in to bookmark favorite routes and keep track of the comments
            you submit.
          </Card.Text>
          <Button as={NavLink} to="/login" variant="primary" size="sm">
            Log in to start saving
          </Button>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm mt-4">
      <Card.Body>
        <Card.Title>Save to records</Card.Title>
        <Card.Text className="text-muted">
          Capture the currently selected route along with any personal note.
        </Card.Text>

        {status ? (
          <Alert variant={status.type} aria-live="polite" role="status">
            {status.message}
          </Alert>
        ) : null}

        {activeRoute ? (
          <Form
            onSubmit={(event) => {
              event.preventDefault()
              onSave(note)
            }}
          >
            <Form.Group className="mb-3" controlId="saveRecordNote">
              <Form.Label>Note (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Why is this route worth keeping?"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Form.Group>
            <div className="d-grid">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save route'}
              </Button>
            </div>
          </Form>
        ) : (
          <Alert variant="info" className="mb-0">
            Plan and select a route to enable saving.
          </Alert>
        )}
      </Card.Body>
    </Card>
  )
}

export default SaveRecordPanel
