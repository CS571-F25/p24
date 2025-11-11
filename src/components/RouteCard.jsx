import { Badge, Button, Card } from 'react-bootstrap'
import styles from './RouteCard.module.css'

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
  } = route

  const durationText =
    typeof estimatedDuration === 'number'
      ? `${estimatedDuration} min`
      : '—'
  const distanceText =
    typeof distanceMiles === 'number' ? `${distanceMiles.toFixed(1)} mi` : '—'

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
