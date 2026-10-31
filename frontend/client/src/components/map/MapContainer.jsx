import { useEffect, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { CASA_CENTER, basemapFor } from '../../data/depots.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';

/**
 * Real Leaflet map shell for Casaway.
 *
 * Owns the tile layer bound to the active theme, keeps the native zoom
 * control hidden so the custom controls stay consistent, and exposes
 * FlyTo / UserMarker / LocateButton helpers that other components can
 * render inside the map.
 */
function currentTheme() {
  try {
    const stored = localStorage.getItem('casaway-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* private mode */
  }
  const root = document.documentElement;
  if (root.dataset.theme === 'light') return 'light';
  return 'dark';
}

/**
 * Fly-to helper rendered inside the map.
 * Animates the map when `position` changes (used by Near Me and depot
 * selection).
 */
export function FlyTo({ position, zoom = 14, duration = 0.6 }) {
  const map = useMap();
  useEffect(() => {
    if (position && map) {
      map.flyTo(position, zoom, { duration });
    }
  }, [map, position, zoom, duration]);
  return null;
}

/**
 * User position marker rendered inside the map.
 * Re-created only when the geolocation changes so marker lifecycles stay
 * stable.
 */
export function UserMarker({ className = '' }) {
  const map = useMap();
  const markerRef = useRef(null);
  const { position } = useGeolocation();

  useEffect(() => {
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (!position) return;

    const L = window.L;
    if (!L) return;

    const icon = L.divIcon({
      className,
      html: `
        <span class="user-marker">
          <span class="user-marker-ring"></span>
          <span class="user-marker-dot"></span>
        </span>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marker = L.marker(position, { icon, interactive: false }).addTo(map);
    markerRef.current = marker;
    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, position, className]);

  return null;
}

/**
 * Locator control rendered outside the map but wired to the same
 * geolocation hook.
 */
export function LocateButton({ onClick }) {
  const { requestLocation } = useGeolocation();
  return (
    <button
      type="button"
      className="locate-btn"
      onClick={() => {
        requestLocation();
        onClick?.();
      }}
      aria-label="Find my position"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 16, height: 16 }}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </svg>
    </button>
  );
}

export default function MapContainer({ children, className }) {
  const mapRef = useRef(null);

  return (
    <LeafletMap
      className={className || 'map-shell'}
      center={CASA_CENTER}
      zoom={12}
      zoomControl={false}
      preferCanvas={true}
      ref={mapRef}
    >
      <TileLayer
        url={basemapFor(currentTheme()).url}
        attribution={basemapFor(currentTheme()).attribution}
        subdomains="abcd"
        maxZoom={20}
      />
      <ZoomControl position="bottomright" />
      {children}
    </LeafletMap>
  );
}
