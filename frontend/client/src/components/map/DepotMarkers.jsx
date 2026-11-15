import { useEffect, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { haversineMeters, escapeHtml } from '../../utils/geo.js';

// Average city speeds used for the per-depot travel estimates.
const WALK_KMH = 4.8;
const DRIVE_KMH = 24;

function travelHtml(labels, distanceMeters) {
  if (distanceMeters == null) {
    return `
  <div class="travel-options">
    <b>${labels.travel}</b>
    <p class="travel-hint">${labels.travelNeedLocation}</p>
  </div>
`.trim();
  }
  const km = distanceMeters / 1000;
  const walkMinutes = Math.max(1, Math.round((km / WALK_KMH) * 60));
  const driveMinutes = Math.max(1, Math.round((km / DRIVE_KMH) * 60));
  return `
  <div class="travel-options">
    <b>${labels.travel}</b>
    <div class="travel-item"><span class="travel-icon">🚶</span> ${labels.walk}: ${labels.minutes(walkMinutes)}</div>
    <div class="travel-item"><span class="travel-icon">🚗</span> ${labels.taxi}: ${labels.minutes(driveMinutes)}</div>
    <div class="travel-item"><span class="travel-icon">🚌</span> ${labels.transit}: ${labels.transitNote}</div>
  </div>
`.trim();
}

function markerKind(taxiType = '') {
  if (taxiType.includes('&')) return 'mixed';
  if (/petit/i.test(taxiType) && !/grand/i.test(taxiType)) return 'petit';
  return 'grand';
}

/**
 * Depot markers rendered as React-Leaflet `<Marker />` nodes.
 *
 * Marker icons are recomputed only when `depots` changes so we do not
 * recreate divIcons on every parent render and cause marker flicker.
 */
export default function DepotMarkers({ depots, onSelect, onDirections, userPosition, labels = {} }) {
  const map = useMap();

  // Popup bodies are raw HTML, so the in-app Directions button is handled
  // through delegation on the map container instead of React props.
  useEffect(() => {
    if (!map) return undefined;
    const container = map.getContainer();
    const handleClick = (event) => {
      const button = event.target.closest?.('.popup-dir');
      if (!button) return;
      const depot = depots.find((d) => String(d.id) === button.dataset.depotId);
      if (!depot) return;
      map.closePopup();
      onDirections?.(depot);
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [map, depots, onDirections]);

  const icons = useMemo(() => {
    const map = new Map();
    depots.forEach((depot) => {
      const kind = markerKind(depot.taxiType || '');
      const size = 30;
      map.set(
        depot.id,
        L.divIcon({
          className: '',
          html: `<span class="taxi-marker taxi-marker--${kind}">${depot.id}</span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2 - 2],
        }),
      );
    });
    return map;
  }, [depots]);

  return (
    <>
      {depots.map((depot) => {
        const distanceMeters =
          userPosition != null
            ? haversineMeters(userPosition, depot.coordinates)
            : null;

        return (
          <Marker
            key={depot.id}
            position={depot.coordinates}
            icon={icons.get(depot.id)}
            eventHandlers={{
              click: () => onSelect?.(depot.id),
            }}
          >
            <Popup maxWidth={270}>
              <div
                dangerouslySetInnerHTML={{
                  __html: popupHtml(depot, distanceMeters, labels),
                }}
              />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function popupHtml(depot, distanceMeters, labels = {}) {
  const text = {
    destinations: 'Destinations',
    travel: 'Getting there',
    walk: 'Walk',
    walkTime: '15–30 min',
    taxi: 'Taxi',
    taxiTime: '5–15 min',
    transit: 'Bus/tram',
    transitNote: 'available nearby',
    travelNeedLocation: 'Allow location to see travel times.',
    minutes: (n) => `${n} min`,
    ...labels,
  };
  const destinations = (depot.destinations || []).map(escapeHtml).join(' · ');
  const distanceHtml =
    distanceMeters != null && labels.kmFromYou
      ? `<p class="popup-meta">${escapeHtml(labels.kmFromYou((distanceMeters / 1000).toFixed(1)))}</p>`
      : '';
  return `
    <h3 class="popup-title">${escapeHtml(depot.name)}</h3>
    <p class="popup-meta">${escapeHtml(depot.district)} · ${escapeHtml(depot.taxiType)}</p>
    ${distanceHtml}
    <p class="popup-destinations"><b>${text.destinations}</b><br>${destinations}</p>
    <button type="button" class="popup-dir" data-depot-id="${escapeHtml(depot.id)}">${escapeHtml(labels.directions ?? 'Directions')} →</button>
    ${travelHtml(text, distanceMeters)}
  `.trim();
}