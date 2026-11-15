import { useMemo, useState } from 'react';
import {
  FARES,
  NIGHT_START_HOUR,
  SEATS_PER_TAXI,
  defaultFareMode,
  formatMAD,
} from '../../../js/fares.js';

/**
 * Regulated Casablanca grand-taxi fare estimate.
 *
 * Restored from the removed `src/mobile/FareCalculator.jsx`: it keeps the
 * departure/destination lookup against the shared `js/fares.js` dataset, the
 * day/night switch and the per-seat / whole-taxi maths, but renders through the
 * Ocean panel classes instead of Tailwind utilities.
 */
export default function EstimatedFare({
  onLocate,
  locating = false,
  notice,
  labels = {},
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState(defaultFareMode);

  const text = {
    title: 'Estimated fare',
    day: 'Day rate',
    night: 'Night rate',
    from: 'Departure',
    to: 'Destination',
    perSeat: 'per seat',
    whole: 'Whole taxi',
    noMatch: 'Pick a departure and a destination to see the fare.',
    hint: `Night rates apply after ${NIGHT_START_HOUR}:00 (+~50%) · charged per seat`,
    locate: 'Find near me',
    locating: 'Locating…',
    estimate: 'Estimates only — official meters may differ.',
    ...labels,
  };

  const originOptions = useMemo(() => [...new Set(FARES.map((f) => f.origin))], []);
  const destinationOptions = useMemo(
    () => [...new Set(FARES.flatMap((f) => f.destination.split('/').map((d) => d.trim())))],
    [],
  );

  const fare = useMemo(() => {
    if (!from) return null;
    return (
      FARES.find((f) => f.origin === from && (to ? f.destination.includes(to) : true)) ||
      FARES.find((f) => f.origin === from) ||
      null
    );
  }, [from, to]);

  const price = fare
    ? mode === 'night'
      ? fare.baseNightPriceMAD
      : fare.baseDayPriceMAD
    : null;

  return (
    <section className="fare-panel" aria-label={text.title}>
      <div className="route-heading">
        <h3 className="fare-title">{text.title}</h3>
        <span>{mode === 'night' ? text.night : text.day}</span>
      </div>

      <div className="fare-controls">
        <button
          type="button"
          className={`fare-mode ${mode === 'day' ? 'is-active' : ''}`}
          onClick={() => setMode('day')}
          aria-pressed={mode === 'day'}
        >
          {text.day}
        </button>
        <button
          type="button"
          className={`fare-mode ${mode === 'night' ? 'is-active' : ''}`}
          onClick={() => setMode('night')}
          aria-pressed={mode === 'night'}
        >
          {text.night}
        </button>
      </div>

      <div className="fare-controls">
        <select
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label={text.from}
        >
          <option value="">{text.from}</option>
          {originOptions.map((origin) => (
            <option key={origin} value={origin}>
              {origin}
            </option>
          ))}
        </select>

        <select
          value={to}
          onChange={(event) => setTo(event.target.value)}
          aria-label={text.to}
        >
          <option value="">{text.to}</option>
          {destinationOptions.map((destination) => (
            <option key={destination} value={destination}>
              {destination}
            </option>
          ))}
        </select>
      </div>

      <div className="fare-grid" aria-live="polite">
        {fare ? (
          <>
            <div className="fare-cell">
              <span className="fare-label">{text.perSeat}</span>
              <span className="fare-value">{formatMAD(price)}</span>
            </div>
            <div className="fare-cell">
              <span className="fare-label">
                {text.whole} · {SEATS_PER_TAXI}
              </span>
              <span className="fare-value">
                {formatMAD(Math.round(price * SEATS_PER_TAXI * 100) / 100)}
              </span>
            </div>
            <div className="fare-cell">
              <span className="fare-label">≈</span>
              <span className="fare-value">
                {fare.estimatedDistanceKM} km · {fare.estimatedTimeMins} min
              </span>
            </div>
            <div className="fare-cell fare-total">
              <span className="fare-label">{fare.destination}</span>
              <span className="fare-value">{formatMAD(price)}</span>
            </div>
          </>
        ) : (
          <p className="fare-note">{text.noMatch}</p>
        )}
      </div>

      <p className="fare-note">{text.hint}</p>

      <button type="button" className="btn-gold fare-locate" onClick={onLocate}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
        {locating ? text.locating : text.locate}
      </button>

      {notice && <p className="fare-note">{notice}</p>}
      <p className="fare-note">{text.estimate}</p>
    </section>
  );
}
