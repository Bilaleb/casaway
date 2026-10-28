import { ArrowRight, FileCode2, Loader2 } from 'lucide-react';

/** One shimmering placeholder row while the catalogue loads. */
function SkeletonRow() {
  return (
    <li
      className="animate-pulse rounded-xl border border-[#ddd8cb] bg-[#f6f4ee] p-3 dark:border-[#252d3a] dark:bg-[#0d121c]"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-[#ddd8cb] dark:bg-[#252d3a]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-2/3 rounded-full bg-[#ddd8cb] dark:bg-[#252d3a]" />
          <div className="h-3 w-1/3 rounded-full bg-[#e7e2d6] dark:bg-[#1a202b]" />
        </div>
      </div>
    </li>
  );
}

/**
 * Route catalogue: the list of GPX / GeoJSON trace files shipped with the app.
 * Shows an elegant `animate-pulse` skeleton while the manifest is loading, an
 * empty/error note when nothing is available, and 44px-tall selectable rows
 * once the data lands.
 */
export default function RouteCatalogue({ status, routes, selectedId, onSelect }) {
  if (status === 'loading') {
    return (
      <div aria-busy="true" aria-live="polite">
        <p className="mb-2 flex items-center gap-2 text-xs text-[#5b6472] dark:text-[#9299a8]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Loading route catalogue…
        </p>
        <ul className="grid gap-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </ul>
      </div>
    );
  }

  if (status !== 'ready' || routes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#ddd8cb] p-3 text-xs text-[#5b6472] dark:border-[#252d3a] dark:text-[#9299a8]">
        {status === 'error'
          ? 'The route catalogue could not be loaded. Depôt info and fares still work offline.'
          : 'No route traces are published yet.'}
      </p>
    );
  }

  return (
    <ul className="grid gap-2" aria-label="Available route traces">
      {routes.map((route) => {
        const active = route.id === selectedId;
        const isGeoJson = /geojson$/i.test(route.geojson || '') || route.format === 'geojson';
        return (
          <li key={route.id}>
            <button
              type="button"
              onClick={() => onSelect(route.id)}
              aria-pressed={active}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 active:scale-[0.99] ${
                active
                  ? 'border-[#a8851f] bg-[#dcb63f]/15 dark:border-[#756231] dark:bg-[#e5c158]/10'
                  : 'border-[#ddd8cb] bg-white hover:border-[#c9c3b4] dark:border-[#252d3a] dark:bg-[#0d121c] dark:hover:border-[#333d4e]'
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                  active
                    ? 'border-[#a8851f] text-[#8a6a12] dark:border-[#756231] dark:text-[#e5c158]'
                    : 'border-[#ddd8cb] text-[#5b6472] dark:border-[#252d3a] dark:text-[#9299a8]'
                }`}
              >
                <FileCode2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#161a21] dark:text-[#f3f1e9]">
                  {route.title}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] tracking-wide text-[#5b6472] uppercase dark:text-[#9299a8]">
                  {isGeoJson ? 'GeoJSON' : 'GPX'} · {route.origin} → {route.destination}
                </span>
              </span>
              <ArrowRight
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                  active
                    ? 'translate-x-0.5 text-[#8a6a12] dark:text-[#e5c158]'
                    : 'text-[#9299a8]'
                }`}
                aria-hidden="true"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
