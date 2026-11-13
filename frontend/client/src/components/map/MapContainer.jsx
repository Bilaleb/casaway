import { useEffect, useRef } from 'react';
import { MapContainer as LeafletMap, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CASA_CENTER } from '../../data/depots.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';

/**
 * Leaflet shell for Casaway.
 *
 * Renders only the map surface: tiles, zoom controls and layers are passed
 * in as children by App so they stay reactive to the theme and filters.
 */
/**
 * Leaflet caches its pixel size at init. On iOS the viewport changes when the
 * browser chrome collapses, on rotation, and when the sheet reflows the
 * column — without this the map paints tiles over only part of its box.
 */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    if (!map) return undefined;
    const el = map.getContainer();
    const refresh = () => map.invalidateSize({ animate: false });
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
    observer?.observe(el);
    window.addEventListener('orientationchange', refresh);
    const timer = setTimeout(refresh, 220);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener('orientationchange', refresh);
    };
  }, [map]);
  return null;
}

export function FlyTo({ position, zoom = 14, duration = 0.6 }) {
  const map = useMap();
  useEffect(() => {
    if (position && map) map.flyTo(position, zoom, { duration });
  }, [map, position, zoom, duration]);
  return null;
}

/** User position marker, created imperatively so it survives re-renders. */
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

    const icon = L.divIcon({
      className,
      html: '<span class="user-marker"><span class="user-marker-ring"></span><span class="user-marker-dot"></span></span>',
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

/** Locator button wired to the same geolocation hook. */
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

export default function MapContainer({
  children,
  center = CASA_CENTER,
  zoom = 12,
  className,
  mapRef,
}) {
  return (
    <LeafletMap
      ref={mapRef}
      className={className || 'map-shell'}
      center={center}
      zoom={zoom}
      zoomControl={false}
      preferCanvas
    >
      <AutoResize />
      {children}
    </LeafletMap>
  );
}
