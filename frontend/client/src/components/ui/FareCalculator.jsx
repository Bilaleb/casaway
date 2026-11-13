import { useState } from 'react';

/**
 * Illustrative Casablanca grand-taxi fare estimate.
 * Regulated rates: day 8 MAD base + 1 MAD/km, night 9 MAD base + 1.2 MAD/km.
 */
const RATES = {
  day: { base: 8, perKm: 1 },
  night: { base: 9, perKm: 1.2 },
};

const DISTANCES = [2, 5, 10, 15, 20, 30];

export default function FareCalculator({ seats: initialSeats = 1 }) {
  const [mode, setMode] = useState('day');
  const [distanceKm, setDistanceKm] = useState(5);
  const [seats, setSeats] = useState(initialSeats);

  const { base, perKm } = RATES[mode];
  const fare = base + perKm * distanceKm;
  const total = fare * seats;

  return (
    <section className="fare-panel" aria-label="Fare calculator">
      <div className="route-heading">
        <h3 className="fare-title">Fare calculator</h3>
        <span>{mode === 'day' ? 'Day rate' : 'Night rate'}</span>
      </div>

      <div className="fare-controls">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          aria-label="Fare period"
        >
          <option value="day">Day (06:00–20:00)</option>
          <option value="night">Night (20:00–06:00)</option>
        </select>

        <select
          value={distanceKm}
          onChange={(e) => setDistanceKm(Number(e.target.value))}
          aria-label="Distance in kilometres"
        >
          {DISTANCES.map((km) => (
            <option key={km} value={km}>
              {km} km
            </option>
          ))}
        </select>

        <select
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          aria-label="Passengers"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'seat' : 'seats'}
            </option>
          ))}
        </select>
      </div>

      <div className="fare-grid">
        <div className="fare-cell">
          <span className="fare-label">Base rate</span>
          <span className="fare-value">{base.toFixed(2)} MAD</span>
        </div>
        <div className="fare-cell">
          <span className="fare-label">Per km</span>
          <span className="fare-value">{perKm.toFixed(2)} MAD</span>
        </div>
        <div className="fare-cell">
          <span className="fare-label">{distanceKm} km ride</span>
          <span className="fare-value">{fare.toFixed(2)} MAD</span>
        </div>
        <div className="fare-cell fare-total">
          <span className="fare-label">Total</span>
          <span className="fare-value">{total.toFixed(2)} MAD</span>
        </div>
      </div>

      <p className="fare-note">
        Estimates only — official meters may differ.
      </p>
    </section>
  );
}
