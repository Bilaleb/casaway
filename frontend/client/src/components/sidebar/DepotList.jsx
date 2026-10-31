import { formatDistance, haversineMeters } from '../../utils/geo.js';
import DepotCard from './DepotCard.jsx';

/**
 * Scrollable depot list bound to the sidebar filters and search.
 *
 * If `userPosition` is available, distances are recomputed and the list is
 * sorted nearest-first when the `near` filter is active.
 */
export default function DepotList({
  depots,
  selectedId,
  onSelect,
  userPosition,
  activeFilter = 'all',
  noResultsMessage,
}) {
  const list = [...depots];

  if (activeFilter === 'near' && userPosition) {
    list.sort((a, b) => {
      const da = haversineMeters(userPosition, a.coordinates);
      const db = haversineMeters(userPosition, b.coordinates);
      return da - db;
    });
  }

  if (list.length === 0) {
    return (
      <div className="no-results">
        {noResultsMessage ?? 'No depots match this search. Try another district or taxi type.'}
      </div>
    );
  }

  return (
    <div className="station-list" aria-live="polite">
      {list.map((depot) => (
        <DepotCard
          key={depot.id}
          depot={depot}
          selected={depot.id === selectedId}
          userPosition={userPosition}
          onSelect={() => onSelect(depot.id)}
        />
      ))}
    </div>
  );
}

/** Nearest-station chip used in the geosearch banner. */
export function NearestChip({ station, userPosition }) {
  const distanceMeters =
    userPosition != null
      ? haversineMeters(userPosition, station.coordinates)
      : station.distanceMeters;

  if (distanceMeters == null) return null;

  return (
    <div className="geosearch-nearest">
      <span>Nearest station:</span>
      <b>{station.name}</b>
      <span className="distance-badge">
        {formatDistance(distanceMeters)} away
      </span>
    </div>
  );
}
