import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { AnimatePresence, motion } from 'framer-motion';

import MapContainer, { FitBounds, FlyTo, UserMarker } from './components/map/MapContainer.jsx';
import DepotMarkers from './components/map/DepotMarkers.jsx';

import {
  Sidebar,
  SidebarSearch,
} from './components/sidebar/Sidebar.jsx';
import TaxiFilter from './components/sidebar/TaxiFilter.jsx';
import DepotList from './components/sidebar/DepotList.jsx';
import EstimatedFare from './components/ui/EstimatedFare.jsx';

import Navbar from './components/header/Navbar.jsx';

import {
  DEFAULT_DEPOTS,
  STRINGS,
  CASA_CENTER,
  basemapFor,
} from './data/depots.js';
import { Polyline, TileLayer } from 'react-leaflet';
import { formatDistance, haversineMeters } from './utils/geo.js';
import { useTheme } from './hooks/useTheme.js';
import { useGeolocation, readStoredLocale } from './hooks/useGeolocation.js';

const CITY_CHIP = 'CASABLANCA · 33.5731° N / 7.5898° W';

export default function App() {
  const { theme } = useTheme();
  const { position, notice, requestLocation } = useGeolocation();
  const [depots, setDepots] = useState(DEFAULT_DEPOTS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [locale, setLocale] = useState(readStoredLocale());
  const [bannerVisible, setBannerVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [fareOpen, setFareOpen] = useState(false);
  const [routeTarget, setRouteTarget] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  // The depot list starts hidden on phones: the map is the entry point and
  // the menu button reveals the list on demand.
  const [panelOpen, setPanelOpen] = useState(
    () => !window.matchMedia?.('(max-width: 900px)').matches,
  );
  const [dismissedBanner, _setDismissedBanner] = useState(false);
  const deferredPromptRef = useRef(null);
  const mapRef = useRef(null);

  const tr = STRINGS[locale] ?? STRINGS.en;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('casaway-locale', locale);
    } catch {
      /* private mode */
    }
    return () => {
      root.lang = '';
      root.dir = '';
    };
  }, [locale]);

  useEffect(() => {
    fetch('/api/stations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length) setDepots(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    try {
      if (dismissedBanner || installed) return;
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone;
      // Once per browsing session, so the reminder reappears on a new visit
      // instead of being silenced forever after the first dismissal.
      const prompted = sessionStorage.getItem('casaway-install-prompted') === 'true';
      if (prompted || standalone) return;
    } catch {
      /* private mode */
    }
    const timer = setTimeout(() => setBannerVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [installed, dismissedBanner]);

  const confirmInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        await promptEvent.userChoice;
      } catch {
        /* prompt already consumed */
      }
      deferredPromptRef.current = null;
    }
    setBannerVisible(false);
    setInstalled(true);
    try {
      sessionStorage.setItem('casaway-install-prompted', 'true');
    } catch {
      /* private mode */
    }
  };

  const dismissBanner = () => {
    setBannerVisible(false);
    setInstalled(true);
    try {
      sessionStorage.setItem('casaway-install-prompted', 'true');
    } catch {
      /* private mode */
    }
  };

  const visibleDepots = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = depots.filter(
      (d) =>
        `${d.name} ${d.district} ${(d.destinations || []).join(' ')}`.toLowerCase().includes(q),
    );

    if (filter === 'grand') list = list.filter((d) => /grand/i.test(d.taxiType));
    else if (filter === 'petit') list = list.filter((d) => /petit/i.test(d.taxiType));
    else if (filter === 'downtown')
      list = list.filter((d) => ['Centre Ville', 'Casa-Port', 'Casa-Voyageurs', 'Derb Omar'].includes(d.district));
    else if (filter === 'near' && position) {
      list = list
        .map((d) => ({ ...d, distanceMeters: haversineMeters(position, d.coordinates) }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 6);
    }

    return list;
  }, [depots, query, filter, position]);

  const basemap = useMemo(() => basemapFor(theme), [theme]);

  const handleFilter = useCallback(
    (id) => {
      setFilter(id);
      if (id === 'near' && !position) requestLocation();
    },
    [position, requestLocation],
  );

  const handleSelected = useCallback((id) => {
    setSelectedId(id);
  }, []);

  /** Draw the route to a depot inside the app map — no external redirect. */
  const handleDirections = useCallback(
    (depot) => {
      setSelectedId(depot.id);
      setRouteTarget(depot);
      if (!position) requestLocation();
      if (window.matchMedia?.('(max-width: 900px)').matches) setPanelOpen(false);
    },
    [position, requestLocation],
  );

  // Road geometry comes from OSRM when reachable; a direct line is drawn as a
  // fallback so the route is always visible inside the app.
  useEffect(() => {
    if (!routeTarget || !position) {
      setRouteInfo(null);
      return undefined;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const [lat, lng] = position;
    const [toLat, toLng] = routeTarget.coordinates;

    const fallback = () => {
      if (cancelled) return;
      const meters = haversineMeters(position, routeTarget.coordinates);
      setRouteInfo({
        path: [position, routeTarget.coordinates],
        meters,
        minutes: Math.max(1, Math.round((meters / 1000 / 24) * 60)),
        direct: true,
      });
    };

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${toLng},${toLat}?overview=full&geometries=geojson`,
      { signal: controller.signal },
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('route unavailable'))))
      .then((data) => {
        const route = data?.routes?.[0];
        if (!route?.geometry?.coordinates?.length) {
          fallback();
          return;
        }
        if (cancelled) return;
        setRouteInfo({
          path: route.geometry.coordinates.map(([lon, la]) => [la, lon]),
          meters: route.distance,
          minutes: Math.max(1, Math.round(route.duration / 60)),
          direct: false,
        });
      })
      .catch(fallback)
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [routeTarget, position]);

  const openSearch = useCallback(() => {
    setPanelOpen(true);
    requestAnimationFrame(() => {
      document.querySelector('.search-box input')?.focus();
    });
  }, []);

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.fitBounds(
      depots.map((d) => d.coordinates),
      { padding: [35, 35], maxZoom: 12, duration: 0.65 },
    );
  };

  /** Geolocation button: reveal and centre the user's own position. */
  const locateMe = () => {
    requestLocation();
    if (position && mapRef.current) {
      mapRef.current.flyTo(position, 15, { duration: 0.7 });
    }
  };

  return (
    <div className={`casaway-app ${panelOpen ? '' : 'panel-closed'}`}>
      <Navbar
        brandMark="CW"
        depotCount={depots.length}
        locale={locale}
        onLocaleChange={setLocale}
        tagline={tr.tagline}
        labels={tr}
        menuOpen={panelOpen}
        onMenuToggle={() => setPanelOpen(true)}
        onSearchOpen={openSearch}
      />

      <div className="main-layout">
        <Sidebar
          eyebrow={tr.atlasLabel}
          heading={tr.heroTitle}
          description={position ? tr.locating : tr.heroBody}
          onClose={() => setPanelOpen(false)}
          closeLabel={tr.closePanel}
        >
          <SidebarSearch
            query={query}
            onQueryChange={setQuery}
            placeholder={tr.searchPlaceholder}
            label={tr.searchLabel}
            showClear={true}
            onClear={() => setQuery('')}
          />

          <TaxiFilter
            filters={[
              { id: 'all', label: tr.pillAll },
              { id: 'near', label: tr.pillNear },
              { id: 'grand', label: tr.pillGrand },
              { id: 'petit', label: tr.pillPetit },
              { id: 'downtown', label: tr.pillDowntown },
            ]}
            value={filter}
            onFilterChange={handleFilter}
            onNear={() => {
              setFilter('near');
              requestLocation();
            }}
            nearAvailable={!!position}
          />

          <div className="list-tools">
            <button
              type="button"
              className={`dest-toggle ${showDestinations ? 'is-on' : ''}`}
              onClick={() => setShowDestinations((on) => !on)}
              aria-pressed={showDestinations}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
              {showDestinations ? tr.hideDestinations : tr.showDestinations}
            </button>

            <button
              type="button"
              className={`dest-toggle ${fareOpen ? 'is-on' : ''}`}
              onClick={() => setFareOpen((open) => !open)}
              aria-expanded={fareOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="3" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              {tr.fareTitle}
            </button>
          </div>

          <DepotList
            depots={visibleDepots}
            selectedId={selectedId}
            onSelect={handleSelected}
            userPosition={position}
            activeFilter={filter}
            noResultsMessage={tr.noResults}
            showDestinations={showDestinations}
            destinationsLabel={tr.destinationsLabel}
            directionsLabel={tr.directions}
            onDirections={handleDirections}
          />
        </Sidebar>

        <section className="map-wrap" aria-label={tr.mapLabel}>
          <MapContainer
            center={CASA_CENTER}
            zoom={14}
            mapRef={mapRef}
            zoomControl={false}
            preferCanvas={true}
          >
            <TileLayer
              key={theme}
              url={basemap.url}
              attribution={basemap.attribution}
              maxZoom={19}
            />
            {basemap.labelUrl && (
              <TileLayer
                key={`${theme}-labels`}
                url={basemap.labelUrl}
                maxZoom={19}
                opacity={1}
              />
            )}
            <FlyTo position={position} />
            <UserMarker position={position} />
            <DepotMarkers
              depots={depots}
              _selectedId={selectedId}
              onSelect={handleSelected}
              onDirections={handleDirections}
              userPosition={position}
              labels={{
                destinations: tr.destinationsLabel,
                directions: tr.directions,
                travel: tr.travelOptions,
                walk: tr.travelWalking,
                walkTime: tr.travelWalkingTime,
                taxi: tr.travelDriving,
                taxiTime: tr.travelDrivingTime,
                transit: tr.travelTransit,
                transitNote: tr.travelTransitNote,
                travelNeedLocation: tr.travelNeedLocation,
                minutes: tr.minutes,
                kmFromYou: tr.kmFromYou,
              }}
            />

            {routeInfo && (
              <>
                <Polyline
                  positions={routeInfo.path}
                  pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.9 }}
                />
                <Polyline
                  positions={routeInfo.path}
                  pathOptions={{ color: '#2f93c8', weight: 5 }}
                />
                <FitBounds positions={routeInfo.path} />
              </>
            )}
          </MapContainer>

          {routeTarget && (
            <div className="route-card" role="status">
              <span className="route-icon" aria-hidden="true">➤</span>
              <div className="route-copy">
                <strong>{routeTarget.name}</strong>
                <span>
                  {routeInfo
                    ? `${formatDistance(routeInfo.meters)} · ~${routeInfo.minutes} min${routeInfo.direct ? ` · ${tr.routeDirect}` : ''}`
                    : position
                      ? tr.routeLoading
                      : tr.routeNeedLocation}
                </span>
              </div>
              {!position && (
                <button type="button" className="route-locate" onClick={requestLocation}>
                  {tr.fareLocate}
                </button>
              )}
              <button
                type="button"
                className="route-close"
                onClick={() => setRouteTarget(null)}
                aria-label={tr.routeClear}
              >
                ×
              </button>
            </div>
          )}
        </section>

        <div className="map-chip">{CITY_CHIP}</div>

        <div className="map-actions">
          <button type="button" onClick={resetView} title={tr.mapReset} aria-label={tr.mapReset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M20 11a8 8 0 1 0 1 4M20 4v7h-7" />
              <path d="M12 8v4l3 2" />
            </svg>
          </button>
          <button type="button" onClick={locateMe} title={tr.mapLocate} aria-label={tr.mapLocate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          </button>
        </div>

        {/* The header is hidden, so the panel toggle and search live on the map. */}
        <div className="map-quick">
          <button
            type="button"
            className={panelOpen ? 'is-on' : ''}
            onClick={() => setPanelOpen((open) => !open)}
            aria-label={tr.menuLabel}
            aria-expanded={panelOpen}
            title={tr.menuLabel}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <button type="button" onClick={openSearch} aria-label={tr.searchToggle} title={tr.searchToggle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <footer className="app-footer">{tr.footer}</footer>

      {fareOpen && (
        <div
          className="fare-modal"
          role="dialog"
          aria-modal="true"
          aria-label={tr.fareTitle}
          onClick={() => setFareOpen(false)}
        >
          <div
            className="fare-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setFareOpen(false)}
              aria-label={tr.closePanel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <EstimatedFare
              onLocate={requestLocation}
              locating={notice === tr.locating}
              notice={notice && notice !== tr.locating ? notice : ''}
              labels={{
                title: tr.fareTitle,
                day: tr.fareDay,
                night: tr.fareNight,
                from: tr.fareFrom,
                to: tr.fareTo,
                perSeat: tr.farePerSeat,
                whole: tr.fareWhole,
                noMatch: tr.fareNoMatch,
                hint: tr.fareHint,
                locate: tr.fareLocate,
                locating: tr.fareLocating,
                estimate: tr.fareEstimate,
              }}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            className="install-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismissBanner}
          >
            <motion.div
              className="install-banner"
              role="dialog"
              aria-modal="true"
              aria-label={tr.bannerAria}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="install-copy">
                <strong>{tr.bannerTitle}</strong>
                <span>{tr.bannerBody}</span>
                <p className="install-hint">{tr.bannerHint}</p>
              </div>
              <div className="install-actions">
                <button type="button" className="btn-gold" onClick={confirmInstall}>
                  {tr.install}
                </button>
                <button type="button" className="btn-quiet" onClick={dismissBanner}>
                  {tr.dismiss}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}