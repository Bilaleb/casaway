/**
 * CasawayMobile — the mobile-first PWA screen.
 *
 * Layout:
 *   • phone  → full-bleed map with a collapsible bottom sheet of controls
 *   • desktop→ split screen: left control sidebar, right map panel
 *
 * Built from modular Tailwind components (./ControlPanel, ./FareCalculator,
 * ./RouteCatalogue, ./OfflineBanner, ./ReportModal) using Casaway's classic
 * palette — light values first, the dark palette applied through Tailwind's
 * native `dark:` variant (wired to <html data-theme> in src/index.css).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Flag } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_DEPOTS, basemapFor } from '../casawayData.js';
import ControlPanel from './ControlPanel.jsx';
import OfflineBanner from './OfflineBanner.jsx';
import ReportModal from './ReportModal.jsx';

const CASA_CENTER = [33.5731, -7.5898];

/* Classic Casaway chrome scoped to this screen: teardrop taxi pins, pulsing
   user dot and the gold-on-navy popup skin (same geometry as the main app). */
const CM_CSS = `
.cm-root { font-family: 'Space Grotesk', 'DM Sans', sans-serif; }
.cm-root .cm-mono { font-family: 'DM Mono', monospace; }
.cm-pin { width: 25px; height: 25px; display: grid; place-items: center;
  border: 1px solid #f4d67b; border-radius: 50% 50% 50% 2px; transform: rotate(-45deg);
  background: #1b1b18; color: #f4d67b; font: 9px 'DM Mono', monospace; box-shadow: 0 2px 10px #0009; }
.cm-pin > span { transform: rotate(45deg); }
.cm-pin--petit { width: 21px; height: 21px; font-size: 8px; }
.cm-pin--mixed { background: #7b6531; color: #fff; border-color: #c8ab63; }
[data-theme="light"] .cm-pin { background: #fff; color: #8a6a12; border-color: #a8851f; box-shadow: 0 2px 8px #00000026; }
[data-theme="light"] .cm-pin--mixed { background: #7b6531; color: #fff; border-color: #756231; }
.cm-you { position: relative; display: block; width: 16px; height: 16px; }
.cm-you-ping { position: absolute; inset: 0; border-radius: 50%; background: #e5c158;
  opacity: .7; animation: cm-ping 1.6s cubic-bezier(0, 0, .2, 1) infinite; }
@keyframes cm-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
.cm-you-dot { position: absolute; inset: 3px; border-radius: 50%; background: #e5c158; border: 2px solid #0b0f19; }
.cm-root .leaflet-popup-content-wrapper, .cm-root .leaflet-popup-tip {
  background: #fff; color: #161a21; border: 1px solid #ddd8cb; box-shadow: 0 8px 30px #0009; }
.cm-root .leaflet-popup-content { font-family: 'Space Grotesk', sans-serif; font-size: 12px; line-height: 1.55; margin: 14px 16px; }
.cm-root .cm-popup-title { font-size: 14px; font-weight: 600; margin: 0 0 4px; }
.cm-root .cm-popup-meta { color: #5b6472; margin: 0 0 8px; }
.cm-root .cm-popup-eyebrow { color: #8a6a12; font: 10px 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .05em; }
[data-theme="dark"] .cm-root .leaflet-popup-content-wrapper,
[data-theme="dark"] .cm-root .leaflet-popup-tip { background: #111722; color: #f3f1e9; border-color: #333d4e; }
[data-theme="dark"] .cm-root .cm-popup-meta { color: #9299a8; }
[data-theme="dark"] .cm-root .cm-popup-eyebrow { color: #e5c158; }
`;

function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function markerKind(taxiType = '') {
  if (taxiType.includes('&')) return 'mixed';
  if (/petit/i.test(taxiType) && !/grand/i.test(taxiType)) return 'petit';
  return 'grand';
}

/** Flies the map whenever the target changes (locate / depot selection). */
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.position, target.zoom, { duration: 0.6 });
  }, [map, target]);
  return null;
}

const FALLBACK_ROUTES = [
  {
    id: 'casa-port-maarif',
    title: 'Casa-Port → Maarif',
    origin: 'Casa-Port',
    destination: 'Maarif',
    majorStops: ['Casa-Voyageurs', 'Derb Omar', 'Place de la Concorde'],
    gpx: '/routes/casa-port-to-maarif.gpx',
  },
];

export default function CasawayMobile() {
  const [depots, setDepots] = useState(DEFAULT_DEPOTS);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateNotice, setLocateNotice] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);

  const [theme, setTheme] = useState(
    () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'),
  );
  const [routeStatus, setRouteStatus] = useState('loading');
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');

  const watchIdRef = useRef(null);
  const markerRefs = useRef(new Map());

  /* keep the basemap in sync with the app-wide theme switch */
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    sync();
    return () => observer.disconnect();
  }, []);

  /* live depôts from the API, bundled list as the offline-first fallback */
  useEffect(() => {
    let cancelled = false;
    fetch('/api/stations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length) setDepots(data);
      })
      .catch(() => {
        /* offline: bundled dataset stays */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* route catalogue: skeleton stays up briefly so the swap never flashes */
  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const settle = (list) => {
      const wait = Math.max(0, 500 - (Date.now() - startedAt));
      setTimeout(() => {
        if (cancelled) return;
        setRoutes(list);
        setSelectedRouteId(list[0]?.id || '');
        setRouteStatus(list.length ? 'ready' : 'error');
      }, wait);
    };
    fetch('/routes/manifest.json', { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no manifest'))))
      .then((manifest) => {
        const list = Array.isArray(manifest) ? manifest : manifest?.routes || [];
        settle(list.length ? list : FALLBACK_ROUTES);
      })
      .catch(() => settle(FALLBACK_ROUTES));
    return () => {
      cancelled = true;
    };
  }, []);

  /* continuous geolocation while "Find Near Me" is active */
  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  }, []);

  const stopLocate = (message = '') => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    setLocating(false);
    setLocateNotice(message);
  };

  const handleLocate = () => {
    if (tracking || locating) {
      stopLocate('Position tracking stopped.');
      return;
    }
    if (!navigator.geolocation) {
      setLocateNotice('Location is not supported on this device.');
      return;
    }
    setLocating(true);
    setLocateNotice('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const position = [pos.coords.latitude, pos.coords.longitude];
        setLocating(false);
        setTracking(true);
        setUserPosition(position);
        setLocateNotice('Following your position — nearest depôts first.');
        setFlyTarget({ position, zoom: 14 });
      },
      () => {
        watchIdRef.current = null;
        setLocating(false);
        setTracking(false);
        setLocateNotice('Location unavailable — allow location access to use Find Near Me.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  };

  const handleSelect = (id) => {
    const depot = depots.find((d) => d.id === id);
    setSelectedId(id);
    if (depot) {
      setFlyTarget({ position: depot.coordinates, zoom: 15 });
      markerRefs.current.get(id)?.openPopup();
    }
  };

  const visibleDepots = useMemo(() => {
    let list = depots;
    if (filter === 'grand') list = list.filter((d) => /grand/i.test(d.taxiType));
    else if (filter === 'petit') list = list.filter((d) => /petit/i.test(d.taxiType));
    if (userPosition) {
      list = list
        .map((d) => ({ ...d, distanceMeters: haversineMeters(userPosition, d.coordinates) }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
    return list;
  }, [depots, filter, userPosition]);

  /* stable marker icons — rebuilt only when the depot list changes */
  const iconsById = useMemo(
    () =>
      new Map(
        depots.map((depot) => {
          const kind = markerKind(depot.taxiType);
          const size = kind === 'petit' ? 21 : 25;
          return [
            depot.id,
            L.divIcon({
              className: '',
              html: `<span class="cm-pin cm-pin--${kind}"><span>${depot.id}</span></span>`,
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
              popupAnchor: [0, -size / 2 - 2],
            }),
          ];
        }),
      ),
    [depots],
  );

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<span class="cm-you"><span class="cm-you-ping"></span><span class="cm-you-dot"></span></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    [],
  );

  const basemap = basemapFor(theme);

  const panelProps = {
    visibleDepots,
    filter,
    onFilter: setFilter,
    selectedId,
    onSelect: handleSelect,
    onLocate: handleLocate,
    tracking,
    locating,
    locateNotice,
    routeStatus,
    routes,
    selectedRouteId,
    onRouteSelect: setSelectedRouteId,
  };

  return (
    <div className="cm-root flex h-dvh min-h-[420px] flex-col overflow-hidden bg-[#f6f4ee] text-[#161a21] transition-colors duration-300 dark:bg-[#0b0f19] dark:text-[#f3f1e9]">
      <style>{CM_CSS}</style>

      <OfflineBanner />

      {/* ---------------- top bar ---------------- */}
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[#ddd8cb] bg-white px-4 transition-colors duration-300 lg:h-16 lg:px-6 dark:border-[#252d3a] dark:bg-[#111722]">
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#a8851f] bg-[#f6f4ee] dark:border-[#756231] dark:bg-[#0d121c]">
          {logoOk ? (
            <img
              src="/logo.png"
              alt="Casaway logo"
              className="h-full w-full object-cover"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="cm-mono text-xs font-semibold text-[#8a6a12] dark:text-[#e5c158]">
              CW
            </span>
          )}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-base leading-tight font-semibold lg:text-lg">Casaway</h1>
          <span className="cm-mono hidden truncate text-[10px] tracking-wide text-[#5b6472] uppercase sm:block dark:text-[#9299a8]">
            Your way through Casablanca
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="cm-mono hidden items-center gap-2 text-[10px] tracking-wide text-[#5b6472] uppercase md:flex dark:text-[#9299a8]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#2c7a44] shadow-[0_0_10px_rgba(44,122,68,0.7)] dark:bg-[#86c8a0]"
              aria-hidden="true"
            />
            {depots.length} depôts mapped
          </span>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            aria-label="Report an issue"
            className="flex h-11 items-center gap-2 rounded-xl border border-[#a8851f] px-3 text-xs font-semibold text-[#8a6a12] transition-all duration-300 hover:bg-[#dcb63f]/15 active:scale-[0.97] sm:px-4 dark:border-[#756231] dark:text-[#e5c158] dark:hover:bg-[#e5c158]/10"
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Report an issue</span>
          </button>
        </div>
      </header>

      {/* ---------------- split layout ---------------- */}
      <div className="relative flex min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(320px,380px)_1fr]">
        {/* desktop: left sidebar with the controls */}
        <aside className="hidden min-h-0 lg:block">
          <ControlPanel variant="sidebar" {...panelProps} />
        </aside>

        {/* map panel (right on desktop, full-bleed on phones) */}
        <section
          aria-label="Map of Casablanca taxi depots"
          className="relative min-h-0 flex-1 lg:h-full"
        >
          <div className="absolute inset-0 z-0">
            <MapContainer
              center={CASA_CENTER}
              zoom={12}
              className="h-full w-full"
              zoomControl={false}
              preferCanvas
            >
              <TileLayer
                key={`${theme}:${basemap.url}`}
                url={basemap.url}
                subdomains="abcd"
                maxZoom={19}
                attribution={basemap.attribution}
              />

              {visibleDepots.map((depot) => (
                <Marker
                  key={depot.id}
                  position={depot.coordinates}
                  icon={iconsById.get(depot.id)}
                  title={depot.name}
                  alt={`${depot.taxiType}: ${depot.name}`}
                  ref={(ref) => {
                    if (ref) markerRefs.current.set(depot.id, ref);
                    else markerRefs.current.delete(depot.id);
                  }}
                  eventHandlers={{ click: () => setSelectedId(depot.id) }}
                >
                  <Popup maxWidth={260}>
                    <div>
                      <h3 className="cm-popup-title">{depot.name}</h3>
                      <p className="cm-popup-meta">
                        {depot.district} · {depot.taxiType}
                      </p>
                      {depot.destinations?.length > 0 && (
                        <p>
                          <span className="cm-popup-eyebrow">Destinations</span>
                          <br />
                          {depot.destinations.join(' · ')}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {userPosition && <Marker position={userPosition} icon={userIcon} alt="Your position" />}
              <FlyTo target={flyTarget} />
            </MapContainer>
          </div>

          {/* phone: collapsible bottom sheet over the map */}
          <div className="absolute inset-x-0 bottom-0 z-20 lg:hidden">
            <ControlPanel variant="sheet" open={sheetOpen} onToggle={() => setSheetOpen((v) => !v)} {...panelProps} />
          </div>
        </section>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
