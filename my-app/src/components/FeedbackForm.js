import { useState } from 'react';
import { submitFeedback } from '../services/api';
import { mockFeedbackCategories } from '../data/mockRoutes';
import './FeedbackForm.css';

const initialState = {
  location: '',
  category: 'well-lit',
  notes: ''
};

const FeedbackForm = () => {
  const [formState, setFormState] = useState(initialState);
  const [status, setStatus] = useState({ sending: false, message: null, tone: 'neutral' });

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setFormState(initialState);

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ sending: true, message: null, tone: 'neutral' });

    try {
      const payload = {
        ...formState,
        submittedAt: new Date().toISOString()
      };
      const response = await submitFeedback(payload);
      const isMocked = response.source === 'mock';

      setStatus({
        sending: false,
        tone: 'success',
        message: isMocked
          ? 'Feedback captured locally. Connect a backend to persist reports.'
          : 'Thanks! Your safety note is now live for the community.'
      });
      resetForm();
    } catch (error) {
      console.error('Feedback submission failed', error);
      setStatus({
        sending: false,
        tone: 'error',
        message: 'Could not submit feedback. Please try again in a moment.'
      });
    }
  };

  return (
    <form className="feedback-form" onSubmit={onSubmit}>
      <header>
        <h2>Contribute to the safety map</h2>
        <p>Share lighting, patrols, or areas to avoid. Your note helps neighbors walk smarter.</p>
      </header>

      <label className="feedback-form__field">
        <span>Where is this?</span>
        <input
          name="location"
          value={formState.location}
          onChange={handleChange}
          placeholder="e.g. Mission &amp; 16th Street"
          required
        />
      </label>

      <label className="feedback-form__field">
        <span>Category</span>
        <select name="category" value={formState.category} onChange={handleChange}>
          {mockFeedbackCategories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="feedback-form__field">
        <span>Details</span>
        <textarea
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          placeholder="Tell others what to expect…"
          rows={3}
        />
      </label>

      <button type="submit" disabled={status.sending}>
        {status.sending ? 'Sending…' : 'Submit safety note'}
      </button>

      {status.message && (
        <div className={`feedback-form__status feedback-form__status--${status.tone}`}>
          {status.message}
        </div>
      )}
    </form>
  );
};

export default FeedbackForm;
