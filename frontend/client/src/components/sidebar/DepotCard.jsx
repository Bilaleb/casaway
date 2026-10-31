import { memo } from 'react';
import { formatDistance, haversineMeters } from '../../utils/geo.js';

/**
 * Individual depot row for the sidebar list.
 *
 * Active selection, hover state, and distance pill all use the existing
 * glassmorphism token classes from App.css.
 */
const DepotCard = memo(function DepotCard({
  depot,
  selected = false,
  userPosition,
  onSelect,
}) {
  const distanceMeters =
    userPosition != null
      ? haversineMeters(userPosition, depot.coordinates)
      : null;

  return (
    <button
      type="button"
      className={`station-button ${selected ? 'is-active' : ''}`}
      onClick={() => onSelect?.(depot.id)}
      aria-pressed={selected}
    >
      <span className="station-number">{String(depot.id).padStart(2, '0')}</span>

      <span className="station-main">
        <span className="station-name">{depot.name}</span>
        <span className="station-sub">
          {depot.district} · {depot.taxiType}
        </span>
      </span>

      <span className="station-meta-right">
        {distanceMeters != null && (
          <span className="station-dist-pill">
            {formatDistance(distanceMeters)}
          </span>
        )}
        <span className="station-dot" aria-hidden="true" />
      </span>
    </button>
  );
});

export default DepotCard;
