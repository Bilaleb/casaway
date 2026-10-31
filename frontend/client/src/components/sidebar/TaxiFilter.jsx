import { memo, useCallback } from 'react';
import { STRINGS } from '../../data/depots.js';

/**
 * Horizontal filter bar for taxi type, district, and Near Me.
 * "Near Me" triggers the geolocation hook from the parent app so the
 * hook can handle permissions, notices, and fallback filter state.
 */
function FilterPill({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`filter-pill ${active ? 'is-active' : ''}`}
      onClick={() => onClick(id)}
      aria-pressed={active}
    >
      {id === 'near' && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      )}
      {id === 'grand' && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="4" y="10" width="16" height="8" rx="2" />
          <path d="M8 14h8M12 10v4" />
        </svg>
      )}
      {id === 'petit' && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      )}
      {id === 'downtown' && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M3 9l9-7 9 7v12a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path d="M9 14l3 3 3-3" />
        </svg>
      )}
      {label}
    </button>
  );
}

export default memo(function TaxiFilter({
  filters,
  value,
  onFilterChange,
  onNear,
  nearAvailable = false,
  _nearLoading = false,
}) {
  const handleFilter = useCallback(
    (id) => {
      if (id === 'near' && !nearAvailable) {
        onNear?.();
        return;
      }
      onFilterChange?.(id);
    },
    [nearAvailable, onNear, onFilterChange],
  );

  return (
    <div className="filter-row" role="group" aria-label="Taxi filters">
      {filters.map((f) => (
        <FilterPill
          key={f.id}
          id={f.id}
          label={STRINGS.en[f.labelKey] ?? f.label}
          active={value === f.id}
          onClick={handleFilter}
        />
      ))}
    </div>
  );
});