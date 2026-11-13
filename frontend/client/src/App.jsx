import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { AnimatePresence, motion } from 'framer-motion';

import MapContainer, { FlyTo, UserMarker } from './components/map/MapContainer.jsx';
import DepotMarkers from './components/map/DepotMarkers.jsx';
import RouteLayer from './components/map/RouteLayer.jsx';

import {
  Sidebar,
  SidebarSearch,
} from './components/sidebar/Sidebar.jsx';
import TaxiFilter from './components/sidebar/TaxiFilter.jsx';
import DepotList from './components/sidebar/DepotList.jsx';

import Navbar from './components/header/Navbar.jsx';

import {
  DEFAULT_DEPOTS,
  STRINGS,
  CASA_CENTER,
} from './data/depots.js';
import { haversineMeters } from './utils/geo.js';
import { useTheme } from './hooks/useTheme.js';
import { useGeolocation, readStoredLocale } from './hooks/useGeolocation.js';

const CITY_CHIP = 'CASABLANCA · 33.5731° N / 7.5898° W';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { position, requestLocation } = useGeolocation();
  const [depots, setDepots] = useState(DEFAULT_DEPOTS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [locale, setLocale] = useState(readStoredLocale());
  const [bannerVisible, setBannerVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissedBanner, _setDismissedBanner] = useState(false);
  const deferredPromptRef = useRef(null);

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
      const dismissed = localStorage.getItem('casaway-install-dismissed') === 'true';
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone;
      if (dismissed || standalone) return;
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
  };

  const dismissBanner = () => {
    setBannerVisible(false);
    setInstalled(true);
    try {
      localStorage.setItem('casaway-install-dismissed', 'true');
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

  const hiddenLines = useMemo(() => new Set(), []);
  const lineColor = (line) => (theme === 'light' ? line.colorLight : line.color);

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

  const resetView = () => {
    const map = document.querySelector('.leaflet-container')?.__map;
    if (!map) return;
    const L = window.L;
    if (!L) return;
    const bounds = L.latLngBounds
      ? L.latLngBounds(depots.map((d) => d.coordinates))
      : null;
    if (bounds?.isValid()) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 12, duration: 0.65 });
  };

  const locateCity = () => {
    const map = document.querySelector('.leaflet-container')?.__map;
    if (!map) return;
    const L = window.L;
    if (!L) return;
    map.flyTo(CASA_CENTER, 12, { duration: 0.65 });
  };

  return (
    <div className="casaway-app">
      <Navbar
        brandMark="CW"
        depotCount={depots.length}
        theme={theme}
        onThemeToggle={toggleTheme}
        locale={locale}
        onLocaleChange={setLocale}
        tagline={tr.tagline}
      />

      <div className="main-layout">
        <Sidebar
          description={
            position
              ? tr.locating
              : 'Use the search box or station list to locate taxi hubs across Casablanca.'
          }
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

          <DepotList
            depots={visibleDepots}
            selectedId={selectedId}
            onSelect={handleSelected}
            userPosition={position}
            activeFilter={filter}
            noResultsMessage={tr.noResults}
          />
        </Sidebar>

        <section className="map-wrap" aria-label="Map of Casablanca taxi stations">
          <MapContainer
            center={CASA_CENTER}
            zoom={12}
            zoomControl={false}
            preferCanvas={true}
          >
            <FlyTo position={position} />
            <UserMarker />
            <DepotMarkers
              depots={depots}
              _selectedId={selectedId}
              onSelect={handleSelected}
              userPosition={position}
            />
            <RouteLayer hiddenLines={hiddenLines} lineColor={lineColor} />
          </MapContainer>
        </section>

        <div className="map-chip">{CITY_CHIP}</div>

        <div className="map-actions">
          <button type="button" onClick={resetView} title="Reset map view" aria-label="Reset map view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M20 11a8 8 0 1 0 1 4M20 4v7h-7" />
              <path d="M12 8v4l3 2" />
            </svg>
          </button>
          <button type="button" onClick={locateCity} title="Center on Casablanca" aria-label="Center map on Casablanca">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          </button>
        </div>
      </div>

      <footer className="app-footer">
        Casaway is an independent open-source project and is not affiliated with Casa Transport or local transit authorities.
      </footer>

      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            className="install-banner"
            role="dialog"
            aria-label={tr.bannerAria}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <strong>{tr.bannerTitle}</strong>
              <span id="install-hint">{tr.bannerBody}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={confirmInstall} className="btn-gold">{tr.install}</button>
              <button onClick={dismissBanner} aria-label={tr.dismiss}>×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}