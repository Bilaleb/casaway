/**
 * Sidebar chrome for the Casaway depot explorer.
 *
 * Keeps the glassmorphism layout from the existing App.css and exposes
 * the search, filter, depot list, and route details as a single
 * responsive panel.
 */
export function Sidebar({
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

export default Sidebar;

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

