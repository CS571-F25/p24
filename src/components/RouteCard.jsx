import { Badge, Button, Card } from 'react-bootstrap'
import styles from './RouteCard.module.css'

const formatWeatherSummary = (summary) => {
  if (!summary) {
    return null
  }

  return [
    summary.shortForecast ?? null,
    typeof summary.temperature === 'number'
      ? `${summary.temperature}°${summary.temperatureUnit}`
      : null,
    typeof summary.precipitationChance === 'number'
      ? `${summary.precipitationChance}% precip`
      : null,
    summary.windSpeed ?? null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function RouteCard({ isActive, onSelect, route }) {
  const {
    name,
    distanceMiles,
    estimatedDuration,
    safetyScore,
    confidence,
    incidents = [],
    metrics = {},
    mode,
    communityStats,
    weather,
    weatherSegments = [],
    scorecard,
  } = route

  const durationText =
    typeof estimatedDuration === 'number'
      ? `${estimatedDuration} min`
      : '—'
  const distanceText =
    typeof distanceMiles === 'number' ? `${distanceMiles.toFixed(1)} mi` : '—'

  const primaryWeatherSummary =
    formatWeatherSummary(weatherSegments[0]?.summary ?? weather)
  const fitScore = scorecard?.composite ?? null
  const noteSentiment = scorecard?.noteSentiment ?? null
  const weatherSentiment = scorecard?.weatherSentiment ?? null

  return (
    <Card
      className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
      data-active={isActive}
    >
      <Card.Body>
        <div className={styles.header}>
          <div>
            <Card.Title className={styles.title}>{name}</Card.Title>
            <div className={styles.meta}>
              <span className={styles.metaItem}>{distanceText}</span>
              <span className={styles.metaDivider} />
              <span className={styles.metaItem}>{durationText}</span>
              <span className={styles.metaDivider} />
              <span className={styles.metaItem}>
                Safety score: <strong>{safetyScore}</strong>
              </span>
            </div>
          </div>
          <div className={styles.badges}>
            <Badge bg="light" text="primary">
              {confidence} confidence
            </Badge>
            <Badge bg="info" className="text-white">
              {mode === 'bike' ? 'Bike friendly' : 'Walk friendly'}
            </Badge>
          </div>
        </div>

        <div className={styles.metricsRow}>
          <div>
            <span className={styles.metricLabel}>Safety</span>
            <span className={styles.metricValue}>{metrics.safety ?? '—'}</span>
          </div>
          <div>
            <span className={styles.metricLabel}>Balanced</span>
            <span className={styles.metricValue}>
              {metrics.balance ?? '—'}
            </span>
          </div>
          <div>
            <span className={styles.metricLabel}>Speed</span>
            <span className={styles.metricValue}>{metrics.speed ?? '—'}</span>
          </div>
        </div>

        <div className={styles.scoreBar}>
          <div>
            <span className={styles.metricLabel}>Route fit</span>
            <span className={styles.metricValue}>
              {typeof fitScore === 'number' ? `${fitScore}/100` : '—'}
            </span>
          </div>
          <div className={styles.scoreBadges}>
            {noteSentiment ? (
              <span className={styles.scoreBadge}>
                Notes: {noteSentiment.label}
              </span>
            ) : null}
            {weatherSentiment ? (
              <span className={styles.scoreBadge}>
                Weather: {weatherSentiment.label}
              </span>
            ) : null}
          </div>
        </div>

        {communityStats?.totalReports ? (
          <div className={styles.communityBar}>
            <span className={styles.metricLabel}>Community intel</span>
            <span className={styles.communityValue}>
              {communityStats.totalReports} reports in the last 30 days ·{' '}
              {communityStats.positive} positive / {communityStats.negative}{' '}
              caution
            </span>
          </div>
        ) : null}

        {primaryWeatherSummary ? (
          <div className={styles.weatherBar}>
            <span className={styles.metricLabel}>Weather</span>
            <span className={styles.weatherValue}>
              {primaryWeatherSummary}
            </span>
          </div>
        ) : null}

        {weatherSegments.length > 1 ? (
          <div className={styles.weatherTimeline}>
            <span className={styles.metricLabel}>Checkpoints</span>
            <ul className={styles.weatherList}>
              {weatherSegments.map((segment) => (
                <li key={`${route.id}-${segment.mileMarker}`}>
                  <strong className={styles.weatherListLabel}>
                    Mile {segment.mileMarker}
                  </strong>
                  <span className={styles.weatherListValue}>
                    {formatWeatherSummary(segment.summary)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h3 className={styles.incidentHeader}>Recent highlights</h3>
          {incidents.length > 0 ? (
            <ul className={styles.incidentList}>
              {incidents.map((incident) => (
                <li key={incident.id} className={styles.incidentItem}>
                  <span className={styles.incidentBadge}>
                    {incident.type}
                  </span>
                  <span>{incident.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.incidentEmpty}>
              No updates yet. Submit feedback to help others stay safe.
            </p>
          )}
        </div>

        <Button
          variant={isActive ? 'primary' : 'outline-primary'}
          className={styles.selectButton}
          onClick={onSelect}
        >
          {isActive ? 'Selected route' : 'Preview on map'}
        </Button>
      </Card.Body>
    </Card>
  )
}

export default RouteCard
