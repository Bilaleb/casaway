/**
 * Simple fare breakdown card for Casaway.
 *
 * Casablanca taxi fares are regulated, so this is an illustrative helper
 * for the depot sheet. It is not a live fare engine.
 */
const BASE_DAY = 8;
const BASE_NIGHT = 9;
const PER_KM_DAY = 1;
const PER_KM_NIGHT = 1.2;

export default function FareCalculator({ distanceKm = 0, night = false, adultSeats = 1 }) {
  const base = night ? BASE_NIGHT : BASE_DAY;
  const perKm = night ? PER_KM_NIGHT : PER_KM_DAY;
  const fare = base + perKm * Math.max(0, distanceKm);
  const total = fare * Math.max(1, adultSeats);

  return (
    <div className="fare-panel">
      <h3 className="fare-title">Estimated fare</h3>

      <div className="fare-grid">
        <div className="fare-cell">
          <span className="fare-label">Base rate</span>
          <span className="fare-value">{fare.toFixed(2)} MAD</span>
        </div>
        <div className="fare-cell">
          <span className="fare-label">Per km</span>
          <span className="fare-value">{perKm.toFixed(2)} MAD</span>
        </div>
        <div className="fare-cell">
          <span className="fare-label">Seats</span>
          <span className="fare-value">{adultSeats}</span>
        </div>
        <div className="fare-cell fare-total">
          <span className="fare-label">Total</span>
          <span className="fare-value">{total.toFixed(2)} MAD</span>
        </div>
      </div>

      {night && (
        <p className="fare-note">Night rate applied</p>
      )}
    </div>
  );
}
