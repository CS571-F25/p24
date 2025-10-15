import './RouteCard.css';

const formatDistance = (value) => `${value.toFixed(1)} mi`;
const formatDuration = (value) => `${Math.round(value)} min`;

const RouteCard = ({ route, isActive, onSelect }) => {
  const { id, label, distanceMi, durationMin, safetyScore, confidence, summary, incidents } = route;

  return (
    <button
      type="button"
      className={`route-card ${isActive ? 'route-card--active' : ''}`}
      onClick={() => onSelect?.(id)}
    >
      <div className="route-card__header">
        <div>
          <h3>{label}</h3>
          <p>{summary}</p>
        </div>
        <div className="route-card__score">
          <span className="route-card__score-value">{safetyScore.toFixed(1)}</span>
          <span className="route-card__score-label">safety</span>
        </div>
      </div>

      <div className="route-card__metrics">
        <div>
          <span className="route-card__metric-label">Distance</span>
          <span>{formatDistance(distanceMi)}</span>
        </div>
        <div>
          <span className="route-card__metric-label">Duration</span>
          <span>{formatDuration(durationMin)}</span>
        </div>
        <div>
          <span className="route-card__metric-label">Confidence</span>
          <span className={`route-card__confidence route-card__confidence--${confidence}`}>
            {confidence}
          </span>
        </div>
      </div>

      <div className="route-card__incidents">
        {incidents.slice(0, 2).map((incident) => (
          <span key={incident}>{incident}</span>
        ))}
      </div>
    </button>
  );
};

export default RouteCard;
