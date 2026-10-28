import { ChevronDown } from 'lucide-react';
import FareCalculator from './FareCalculator.jsx';
import RouteCatalogue from './RouteCatalogue.jsx';

const FILTERS = [
  { id: 'all', label: 'All Dépôts' },
  { id: 'grand', label: 'Grand Taxi' },
  { id: 'petit', label: 'Petit Taxi' },
];

function SectionHeading({ children, meta }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h3 className="text-sm font-semibold text-[#161a21] dark:text-[#f3f1e9]">{children}</h3>
      {meta && (
        <span className="font-mono text-[10px] tracking-wider text-[#5b6472] uppercase dark:text-[#9299a8]">
          {meta}
        </span>
      )}
    </div>
  );
}

/**
 * The single control surface of the mobile-first layout:
 *  - variant="sidebar" on desktop (left column of the split screen)
 *  - variant="sheet" on mobile (collapsible bottom sheet over the map)
 * It hosts the view-state filter pills, the depot list, the fare calculator
 * and the route catalogue. The filter pills stay visible even when the sheet
 * is collapsed, so the thumb never has to reach.
 */
export default function ControlPanel({
  variant = 'sidebar',
  open = true,
  onToggle,
  visibleDepots,
  filter,
  onFilter,
  selectedId,
  onSelect,
  onLocate,
  tracking,
  locating,
  locateNotice,
  routeStatus,
  routes,
  selectedRouteId,
  onRouteSelect,
}) {
  const isSheet = variant === 'sheet';
  const bodyId = isSheet ? 'mobile-sheet-body' : 'mobile-sidebar-body';

  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-white transition-all duration-300 dark:bg-[#111722] ${
        isSheet
          ? 'max-h-[85dvh] rounded-t-2xl border-t border-[#ddd8cb] shadow-[0_-12px_40px_rgba(0,0,0,0.25)] dark:border-[#252d3a]'
          : 'border-r border-[#ddd8cb] dark:border-[#252d3a]'
      }`}
    >
      {isSheet && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex h-11 shrink-0 items-center justify-center gap-2 text-xs font-medium text-[#5b6472] transition-all duration-300 hover:text-[#8a6a12] dark:text-[#9299a8] dark:hover:text-[#e5c158]"
        >
          <span
            className={`h-1.5 w-10 rounded-full bg-[#ddd8cb] transition-all duration-300 dark:bg-[#333d4e] ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          {open ? 'Hide controls' : 'Show controls'}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Filter pills — always visible (sheet) / top of the sidebar */}
      <div className="shrink-0 border-b border-[#ddd8cb] px-4 py-3 dark:border-[#252d3a]">
        <div
          role="group"
          aria-label="Filter depôts by taxi type"
          className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onFilter(option.id)}
                aria-pressed={active}
                className={`h-11 shrink-0 rounded-full border px-4 text-xs font-semibold whitespace-nowrap transition-all duration-300 active:scale-[0.97] ${
                  active
                    ? 'border-[#dcb63f] bg-[#dcb63f] text-[#14120c] shadow-[0_0_14px_rgba(229,193,88,0.45)] dark:border-[#e5c158] dark:bg-[#e5c158]'
                    : 'border-[#ddd8cb] bg-white text-[#5b6472] hover:border-[#a8851f] hover:text-[#8a6a12] dark:border-[#252d3a] dark:bg-[#0d121c] dark:text-[#9299a8] dark:hover:border-[#756231] dark:hover:text-[#e5c158]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible body */}
      {/* collapsed content leaves the layout AND the accessibility tree */}
      <div
        id={bodyId}
        className={`min-h-0 transition-all duration-300 ${
          isSheet
            ? open
              ? 'flex-1 overflow-y-auto visible'
              : 'invisible max-h-0 overflow-hidden'
            : 'flex-1 overflow-y-auto'
        }`}
      >
        <div className="grid gap-5 p-4">
          {!isSheet && (
            <div>
              <p className="font-mono text-[10px] tracking-[0.14em] text-[#8a6a12] uppercase dark:text-[#e5c158]">
                Casa / Mobility atlas
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[#161a21] dark:text-[#f3f1e9]">
                Find your next taxi.
              </h2>
              <p className="mt-1 text-xs text-[#5b6472] dark:text-[#9299a8]">
                Dépôts, destinations, fares and route traces across Casablanca.
              </p>
            </div>
          )}

          <section aria-label="Dépôt list">
            <SectionHeading meta={`${visibleDepots.length} shown`}>Dépôts</SectionHeading>
            <ul className="grid gap-2" aria-live="polite">
              {visibleDepots.length > 0 ? (
                visibleDepots.map((depot) => {
                  const active = depot.id === selectedId;
                  return (
                    <li key={depot.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(depot.id)}
                        aria-pressed={active}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 active:scale-[0.99] ${
                          active
                            ? 'border-[#a8851f] bg-[#dcb63f]/15 dark:border-[#756231] dark:bg-[#e5c158]/10'
                            : 'border-[#ddd8cb] bg-white hover:border-[#c9c3b4] dark:border-[#252d3a] dark:bg-[#0d121c] dark:hover:border-[#333d4e]'
                        }`}
                      >
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[10px] ${
                            active
                              ? 'border-[#a8851f] text-[#8a6a12] dark:border-[#756231] dark:text-[#e5c158]'
                              : 'border-[#ddd8cb] text-[#5b6472] dark:border-[#252d3a] dark:text-[#9299a8]'
                          }`}
                        >
                          {String(depot.id).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[#161a21] dark:text-[#f3f1e9]">
                            {depot.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#5b6472] dark:text-[#9299a8]">
                            {depot.district} · {depot.taxiType}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-xl border border-dashed border-[#ddd8cb] p-3 text-xs text-[#5b6472] dark:border-[#252d3a] dark:text-[#9299a8]">
                  No depôts match this filter. Try “All Dépôts”.
                </li>
              )}
            </ul>
          </section>

          <section className="border-t border-[#ddd8cb] pt-4 dark:border-[#252d3a]">
            <FareCalculator
              onLocate={onLocate}
              tracking={tracking}
              locating={locating}
              notice={locateNotice}
            />
          </section>

          <section className="border-t border-[#ddd8cb] pt-4 dark:border-[#252d3a]">
            <SectionHeading meta="GPX / GeoJSON">Route catalogue</SectionHeading>
            <RouteCatalogue
              status={routeStatus}
              routes={routes}
              selectedId={selectedRouteId}
              onSelect={onRouteSelect}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
