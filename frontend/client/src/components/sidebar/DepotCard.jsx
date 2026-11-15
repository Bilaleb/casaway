import { memo } from 'react';
import { formatDistance, haversineMeters } from '../../utils/geo.js';

/**
 * Individual depot row for the sidebar list.
 *
 * The row is a tinted card with no divider or border; a separate Directions
 * action draws the route to this depot inside the app's own map.
 */
const DepotCard = memo(function DepotCard({
  depot,
  selected = false,
  userPosition,
  onSelect,
  onDirections,
  showDestinations = false,
  destinationsLabel = 'Destinations',
  directionsLabel = 'Directions',
}) {
  const distanceMeters =
    userPosition != null
      ? haversineMeters(userPosition, depot.coordinates)
      : null;

  return (
    <div className={`station-item ${selected ? 'is-active' : ''}`}>
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
          {showDestinations && depot.destinations?.length > 0 && (
            <span className="station-destinations">
              <b>{destinationsLabel}</b> {depot.destinations.join(' · ')}
            </span>
          )}
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

      <button
        type="button"
        className="station-dir"
        onClick={() => onDirections?.(depot)}
        aria-label={`${directionsLabel} — ${depot.name}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M9 20V9l6-4 6 3v9l-6 4-6-3z" />
          <path d="M9 9l6 3v9" />
          <path d="M3 12h4" />
        </svg>
        {directionsLabel}
      </button>
    </div>
  );
});

export default DepotCard;
