/**
 * Sidebar chrome for the Casaway depot explorer.
 *
 * Keeps the glassmorphism layout from the existing App.css and exposes
 * the search, filter, depot list, and route details as a single
 * responsive panel.
 */
export default function Sidebar({
  heading = 'Find your next taxi.',
  subheading,
  description,
  children,
  className,
}) {
  return (
    <aside
      className={`sidebar ${className ?? ''}`}
      aria-label="Taxi station explorer"
    >
      <div className="side-head">
        <p className="eyebrow">Casa / Mobility atlas</p>
        <h2>{heading}</h2>
        {subheading && <p className="side-sub">{subheading}</p>}
        {description && <p>{description}</p>}
      </div>

      {children}
    </aside>
  );
}

export function SidebarSearch({
  query,
  onQueryChange,
  placeholder,
  label,
  showClear = false,
  onClear,
}) {
  return (
    <div className="search-wrap">
      <label className="search-box">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="m13.2 13.2 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder={placeholder ?? 'Filter depots, districts, destinations'}
          autoComplete="off"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label={label ?? 'Filter depots'}
        />
        {showClear && query && (
          <button
            type="button"
            className="search-clear"
            onClick={onClear}
            aria-label="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </label>
    </div>
  );
}

export function SidebarFilter({ options, value, onChange }) {
  return (
    <div className="filter-row">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 10l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function SidebarRoutePanel({ route, routes, value, onChange, state }) {
  return (
    <section className="route-panel" aria-label="Route details">
      <div className="route-heading">
        <h3>Route trace</h3>
        <span>GPX · {String(routes.length).padStart(2, '0')}</span>
      </div>

      <select
        className="route-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select a route"
      >
        {routes.map((r) => (
          <option key={r.id} value={r.id}>{r.title}</option>
        ))}
      </select>

      {route && (
        <div className="route-info">
          <div>
            <span className="route-stat-label">Origin</span>
            <span className="route-stat-value">{route.origin}</span>
          </div>
          <div>
            <span className="route-stat-label">Destination</span>
            <span className="route-stat-value">{route.destination}</span>
          </div>
          <div className="route-stops">
            <span className="route-stat-label">Major stops</span>
            <span className="route-stat-value">
              {(route.majorStops || []).join(' · ') || 'Not available'}
            </span>
          </div>
        </div>
      )}

      <p className={`route-state ${state?.startsWith('Could not') ? 'error' : ''}`} role="status">
        {state ?? ''}
      </p>
    </section>
  );
}
