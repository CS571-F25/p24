import './RoutePreferenceToggle.css';

const options = [
  { value: 'safest', label: 'Safest' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'fastest', label: 'Fastest' }
];

const RoutePreferenceToggle = ({ value, onChange }) => (
  <div className="preference-toggle" role="radiogroup" aria-label="Route preference">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={value === option.value}
        className={`preference-toggle__button ${value === option.value ? 'preference-toggle__button--active' : ''}`}
        onClick={() => onChange?.(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default RoutePreferenceToggle;
