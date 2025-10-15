import { useState } from 'react';
import './RoutePlannerForm.css';

const travelModes = [
  { value: 'walking', label: 'Walking' },
  { value: 'bike', label: 'Cycling' }
];

const RoutePlannerForm = ({ onSubmit, isLoading, defaultStart, defaultEnd }) => {
  const [start, setStart] = useState(defaultStart ?? '');
  const [end, setEnd] = useState(defaultEnd ?? '');
  const [mode, setMode] = useState('walking');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!start || !end) {
      return;
    }
    onSubmit?.({ start, end, mode });
  };

  const handleSwap = () => {
    setStart(end);
    setEnd(start);
  };

  const isDisabled = isLoading || !start || !end;

  return (
    <form className="route-form" onSubmit={handleSubmit}>
      <div className="route-form__row">
        <label className="route-form__field">
          <span>Start</span>
          <input
            type="text"
            placeholder="123 Main St"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="route-form__swap"
          onClick={handleSwap}
          aria-label="Swap start and destination"
        >
          ⇄
        </button>
        <label className="route-form__field">
          <span>Destination</span>
          <input
            type="text"
            placeholder="City Hall"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
      </div>

      <div className="route-form__row route-form__row--secondary">
        <div className="route-form__field route-form__field--mode">
          <span>Mode</span>
          <div className="route-form__pills">
            {travelModes.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`route-form__pill ${mode === option.value ? 'route-form__pill--active' : ''}`}
                onClick={() => setMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="route-form__submit" disabled={isDisabled}>
          {isLoading ? 'Planning…' : 'Find routes'}
        </button>
      </div>
    </form>
  );
};

export default RoutePlannerForm;
