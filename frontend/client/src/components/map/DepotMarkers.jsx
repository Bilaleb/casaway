import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { haversineMeters, escapeHtml } from '../../utils/geo.js';

const TRAVEL_HTML = `
  <div class="travel-options">
    <b>Getting there</b>
    <div class="travel-item"><span class="travel-icon">🚶</span> Walk: ~15–30 min</div>
    <div class="travel-item"><span class="travel-icon">🚗</span> Taxi: ~5–15 min</div>
    <div class="travel-item"><span class="travel-icon">🚌</span> Bus/tram: available nearby</div>
  </div>
`.trim();

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
export default function DepotMarkers({ depots, _selectedId, onSelect, userPosition }) {
  const icons = useMemo(() => {
    const map = new Map();
    depots.forEach((depot) => {
      const kind = markerKind(depot.taxiType || '');
      const size = kind === 'petit' ? 21 : 25;
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
              <div dangerouslySetInnerHTML={{ __html: popupHtml(depot, distanceMeters) }} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function popupHtml(depot, distanceMeters) {
  const destinations = (depot.destinations || []).map(escapeHtml).join(' · ');
  const distanceHtml = distanceMeters != null
    ? `<p class="popup-meta">${(distanceMeters / 1000).toFixed(1)} km from you</p>`
    : '';
  return `
    <h3 class="popup-title">${escapeHtml(depot.name)}</h3>
    <p class="popup-meta">${escapeHtml(depot.district)} · ${escapeHtml(depot.taxiType)}</p>
    ${distanceHtml}
    <p class="popup-destinations"><b>Destinations</b><br>${destinations}</p>
    ${TRAVEL_HTML}
  `.trim();
}