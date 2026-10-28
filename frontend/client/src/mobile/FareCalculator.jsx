import { useMemo, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import {
  FARES,
  NIGHT_START_HOUR,
  SEATS_PER_TAXI,
  defaultFareMode,
  formatMAD,
} from '../../js/fares.js';

/** Lowercase, accent-stripped, "depot/station" tokens dropped (see js/fares.js). */
function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/depots|stations|depot|station/g, '');
}

/** Picks the regulated fare matching the departure/destination inputs. */
function findFare(from, to) {
  const f = normalize(from);
  const t = normalize(to);
  if (!f && !t) return null;

  let candidates = FARES;
  if (f) {
    candidates = candidates.filter((fare) => {
      const origin = normalize(fare.origin);
      const depot = normalize(fare.depotName);
      return origin.includes(f) || f.includes(origin) || depot.includes(f) || f.includes(depot);
    });
  }
  if (t) {
    const withDestination = candidates.filter((fare) => normalize(fare.destination).includes(t));
    if (withDestination.length) candidates = withDestination;
  }
  return candidates[0] || null;
}

/**
 * Interactive fare calculator: departure/destination inputs, a DAY RATE /
 * NIGHT RATE switch that recomputes the regulated per-seat price live, and a
 * prominent "Find Near Me" button whose icon keeps pulsing while geolocation
 * tracking is active.
 */
export default function FareCalculator({ onLocate, tracking, locating, notice }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState(defaultFareMode); // 'day' | 'night'

  const fare = useMemo(() => findFare(from, to), [from, to]);
  const price = fare ? (mode === 'night' ? fare.baseNightPriceMAD : fare.baseDayPriceMAD) : null;

  const originOptions = useMemo(() => [...new Set(FARES.map((f) => f.origin))], []);
  const destinationOptions = useMemo(
    () => [...new Set(FARES.flatMap((f) => f.destination.split('/').map((d) => d.trim())))],
    [],
  );

  return (
    <section aria-label="Fare calculator">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#161a21] dark:text-[#f3f1e9]">Fare calculator</h3>
        <span className="rounded-md border border-[#a8851f] px-2 py-1 font-mono text-[10px] tracking-wider text-[#8a6a12] uppercase dark:border-[#756231] dark:text-[#e5c158]">
          {mode === 'night' ? 'Night rate' : 'Day rate'}
        </span>
      </div>

      {/* DAY / NIGHT switch — recomputes the calculation */}
      <div
        role="group"
        aria-label="Day or night rate"
        className="mt-3 grid grid-cols-2 overflow-hidden rounded-xl border border-[#ddd8cb] dark:border-[#252d3a]"
      >
        {[
          { id: 'day', label: 'Day rate' },
          { id: 'night', label: 'Night rate' },
        ].map((option) => {
          const active = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              aria-pressed={active}
              className={`h-11 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                active
                  ? 'bg-[#dcb63f] text-[#14120c] dark:bg-[#e5c158]'
                  : 'bg-transparent text-[#5b6472] hover:bg-[#f0ede4] dark:text-[#9299a8] dark:hover:bg-[#141a26]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 font-mono text-[10px] tracking-wide text-[#5b6472] uppercase dark:text-[#9299a8]">
        Night rates apply after {NIGHT_START_HOUR}:00 (+~50%) · per seat
      </p>

      {/* Departure / destination */}
      <div className="mt-3 grid gap-2">
        <label className="block text-xs font-medium text-[#5b6472] dark:text-[#9299a8]">
          Departure
          <input
            list="fare-origins"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            placeholder="e.g. Dépôt Casa-Port"
            autoComplete="off"
            className="mt-1.5 h-11 w-full rounded-xl border border-[#ddd8cb] bg-white px-3 text-sm text-[#161a21] transition-all duration-300 placeholder:text-[#9299a8] focus:border-[#a8851f] dark:border-[#252d3a] dark:bg-[#0d121c] dark:text-[#f3f1e9] dark:focus:border-[#756231]"
          />
        </label>
        <label className="block text-xs font-medium text-[#5b6472] dark:text-[#9299a8]">
          Destination
          <input
            list="fare-destinations"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="e.g. Maarif"
            autoComplete="off"
            className="mt-1.5 h-11 w-full rounded-xl border border-[#ddd8cb] bg-white px-3 text-sm text-[#161a21] transition-all duration-300 placeholder:text-[#9299a8] focus:border-[#a8851f] dark:border-[#252d3a] dark:bg-[#0d121c] dark:text-[#f3f1e9] dark:focus:border-[#756231]"
          />
        </label>
        <datalist id="fare-origins">
          {originOptions.map((origin) => (
            <option key={origin} value={origin} />
          ))}
        </datalist>
        <datalist id="fare-destinations">
          {destinationOptions.map((destination) => (
            <option key={destination} value={destination} />
          ))}
        </datalist>
      </div>

      {/* Live result */}
      <div
        aria-live="polite"
        className="mt-3 rounded-xl border border-[#ddd8cb] bg-[#f6f4ee] p-3 transition-all duration-300 dark:border-[#252d3a] dark:bg-[#0d121c]"
      >
        {fare ? (
          <div className="grid gap-1.5">
            <p className="text-xs text-[#5b6472] dark:text-[#9299a8]">
              {fare.origin} → {fare.destination}
            </p>
            <p className="text-2xl font-semibold text-[#8a6a12] dark:text-[#e5c158]">
              {formatMAD(price)}
              <span className="ml-1 text-xs font-normal text-[#5b6472] dark:text-[#9299a8]">
                / seat
              </span>
            </p>
            <p className="text-xs text-[#5b6472] dark:text-[#9299a8]">
              Whole taxi ({SEATS_PER_TAXI} seats){' '}
              <b className="font-semibold text-[#161a21] dark:text-[#f3f1e9]">
                {formatMAD(Math.round(price * SEATS_PER_TAXI * 100) / 100)}
              </b>{' '}
              · ~{fare.estimatedDistanceKM} km · ~{fare.estimatedTimeMins} min
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#5b6472] dark:text-[#9299a8]">
            {from || to
              ? 'No regulated fare is listed for this pair yet — pick a departure from the suggestions.'
              : 'Enter a departure to see the regulated per-seat fare.'}
          </p>
        )}
      </div>

      {/* Prominent geolocation action */}
      <button
        type="button"
        onClick={onLocate}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#dcb63f] text-sm font-semibold text-[#14120c] transition-all duration-300 hover:brightness-105 active:scale-[0.98] dark:bg-[#e5c158]"
      >
        <span className="relative grid h-5 w-5 place-items-center">
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          {(tracking || locating) && (
            <span
              className="absolute h-5 w-5 animate-ping rounded-full bg-[#14120c]/40 motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
        </span>
        {locating ? 'Locating…' : tracking ? 'Tracking your position' : 'Find Near Me'}
      </button>
      {notice && (
        <p role="status" className="mt-1.5 text-xs text-[#5b6472] dark:text-[#9299a8]">
          {notice}
        </p>
      )}
    </section>
  );
}
