import { useEffect, useRef, useState, useMemo } from 'react';
import './App.css';

const DEFAULT_STATIONS = [
  { id: 1, name: "Place de la Concorde (L-Hammam / Bd Lalla Yacout)", district: "Centre Ville", coordinates: [33.5912, -7.6134], taxiType: "Grand Taxi", destinations: ["Oulfa", "Maarif", "Ain Diab"] },
  { id: 2, name: "Station Casa-Port", district: "Casa-Port", coordinates: [33.6002, -7.6119], taxiType: "Grand & Petit Taxi", destinations: ["Ain Sebaa", "Sidi Bernoussi", "Mohammedia"] },
  { id: 3, name: "Station Casa-Voyageurs", district: "Casa-Voyageurs", coordinates: [33.5892, -7.5891], taxiType: "Grand & Petit Taxi", destinations: ["Centre Ville", "Hay Mohammadi", "Derb Sultan"] },
  { id: 4, name: "Station Garage Allal (Derb Sultan)", district: "Derb Sultan", coordinates: [33.5715, -7.6045], taxiType: "Grand Taxi", destinations: ["Mediouna", "Tit Mellil", "Bouskoura"] },
  { id: 5, name: "Station Rond-Point Bachkou", district: "Bachkou", coordinates: [33.5583, -7.6251], taxiType: "Grand Taxi", destinations: ["Near University", "Oulfa", "Sidi Maalouf"] },
  { id: 6, name: "Station L-Oulfa (Terminus / Bd Moulay Rachid)", district: "Oulfa", coordinates: [33.5511, -7.6698], taxiType: "Grand Taxi", destinations: ["Centre Ville", "Maarif", "Errahma"] },
  { id: 7, name: "Station Sidi Bernoussi (Bd Imam Ali)", district: "Sidi Bernoussi", coordinates: [33.6085, -7.5214], taxiType: "Grand Taxi", destinations: ["Mohammedia", "Tit Mellil", "Casa-Port"] },
  { id: 8, name: "Station Ain Sebaa (L-Gara / Near Train Station)", district: "Ain Sebaa", coordinates: [33.6068, -7.5452], taxiType: "Grand Taxi", destinations: ["Sidi Bernoussi", "Centre Ville"] },
  { id: 9, name: "Station Maarif (Bd Bir Anzarane / Twin Center)", district: "Maarif", coordinates: [33.5824, -7.6361], taxiType: "Petit Taxi & Grand Taxi Hub", destinations: ["Grand taxi hub", "Twin Center", "Ain Diab"] },
  { id: 10, name: "Station Hay Hassani (SOUK / Terminus)", district: "Hay Hassani", coordinates: [33.5602, -7.6582], taxiType: "Grand Taxi", destinations: ["Oulfa", "Lissasfa", "Maarif"] },
  { id: 11, name: "Station Lissasfa (Route d'El Jadida / Rond Point)", district: "Lissasfa", coordinates: [33.5341, -7.6781], taxiType: "Grand Taxi", destinations: ["Azemmour", "Had Soualem", "Errahma"] },
  { id: 12, name: "Station Derb Omar / Bd Mohammed V", district: "Derb Omar", coordinates: [33.5938, -7.6087], taxiType: "Petit Taxi & Regional Grand Taxi", destinations: ["Centre Ville", "Casa-Voyageurs", "Regional routes"] },
  { id: 13, name: "Station Sidi Moumen (Terminus Tramway Anassi)", district: "Sidi Moumen", coordinates: [33.5871, -7.5023], taxiType: "Grand Taxi", destinations: ["Bernoussi", "Tit Mellil"] },
  { id: 14, name: "Station Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)", district: "Hay Mohammadi", coordinates: [33.5921, -7.5658], taxiType: "Grand Taxi", destinations: ["Casa-Voyageurs", "Sidi Bernoussi"] },
  { id: 15, name: "Station Sbata (Rond Point Jamila)", district: "Sbata", coordinates: [33.5542, -7.5681], taxiType: "Grand Taxi", destinations: ["Garage Allal", "Derb Sultan", "Ain Chock"] },
  { id: 16, name: "Station Ain Chock (Bd Baghdad / Near Faculté)", district: "Ain Chock", coordinates: [33.5488, -7.6012], taxiType: "Grand Taxi", destinations: ["Bachkou", "Derb Sultan", "Sidi Maalouf"] },
  { id: 17, name: "Station Errahma (Ville Nouvelle / Main Roundabout)", district: "Errahma", coordinates: [33.5124, -7.7115], taxiType: "Grand Taxi", destinations: ["Oulfa", "Lissasfa"] },
  { id: 18, name: "Station Tit Mellil (Centre)", district: "Tit Mellil", coordinates: [33.5540, -7.4812], taxiType: "Regional Grand Taxi", destinations: ["Garage Allal", "Bernoussi"] },
  { id: 19, name: "Station Sidi Maalouf (Near Technopark)", district: "Sidi Maalouf", coordinates: [33.5421, -7.6385], taxiType: "Grand Taxi", destinations: ["Bachkou", "Shorex", "Zenith"] },
  { id: 20, name: "Station Sidi Bernoussi - Tram Terminus", district: "Sidi Bernoussi", coordinates: [33.6152, -7.5089], taxiType: "Grand Taxi", destinations: ["Zone Industrielle", "Mohammedia"] }
];

const CASA_CENTER = [33.5731, -7.5898];

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDistance(meters) {
  if (meters == null) return '';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function App() {
  const [stations, setStations] = useState(DEFAULT_STATIONS);
  const [search, setSearch] = useState('');
  const [taxiFilter, setTaxiFilter] = useState('all');
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeState, setRouteState] = useState('Loading route catalogue...');
  const [geosearchResult, setGeosearchResult] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);
  const markersByIdRef = useRef(new Map());
  const routeLayerRef = useRef(null);
  const geosearchLayerRef = useRef(null);
  const geosearchControlRef = useRef(null);

  // Fetch stations from backend API if available, fallback to default
  useEffect(() => {
    fetch('/api/stations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setStations(data);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize Leaflet map and Leaflet-geosearch
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = window.L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { zoomControl: false, preferCanvas: true }).setView(CASA_CENTER, 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const markerLayer = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
      markerLayerRef.current = markerLayer;

      // Integrate Leaflet-geosearch location search bar
      if (window.GeoSearch && !geosearchControlRef.current) {
        const provider = new window.GeoSearch.OpenStreetMapProvider({
          params: {
            'accept-language': 'fr,ar,en',
            countrycodes: 'ma',
            viewbox: '-7.80,33.45,-7.42,33.68', // Bounding box focused on Greater Casablanca
            bounded: 1,
          },
        });

        const searchControl = new window.GeoSearch.GeoSearchControl({
          provider,
          style: 'bar',
          position: 'topleft',
          showMarker: false, // We render our custom interactive marker & connection line
          showPopup: false,
          autoClose: true,
          retainZoomLevel: false,
          animateZoom: true,
          keepResult: true,
          searchLabel: 'Search address or neighborhood (e.g. Maarif, Gauthier, Ain Diab...)',
        });

        map.addControl(searchControl);
        geosearchControlRef.current = searchControl;

        map.on('geosearch/showlocation', (event) => {
          if (!event || !event.location) return;
          const { x: lng, y: lat, label } = event.location;

          // Find nearest taxi station
          let closestStation = null;
          let minDistance = Infinity;

          stations.forEach((station) => {
            const dist = calculateDistanceMeters(lat, lng, station.coordinates[0], station.coordinates[1]);
            if (dist < minDistance) {
              minDistance = dist;
              closestStation = { ...station, distanceMeters: dist };
            }
          });

          setGeosearchResult({
            label,
            lat,
            lng,
            nearestStation: closestStation,
          });

          if (closestStation) {
            setSelectedStationId(closestStation.id);
          }

          // Update map visuals: searched location pin + dashed connection line to nearest station
          if (geosearchLayerRef.current) {
            map.removeLayer(geosearchLayerRef.current);
            geosearchLayerRef.current = null;
          }

          const group = L.featureGroup();

          const searchedMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: '',
              html: `<div class="searched-pin"><span class="pin-halo"></span><span class="pin-icon">📍</span></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 26],
              popupAnchor: [0, -22],
            }),
            title: label,
            alt: `Searched location: ${label}`,
          }).bindPopup(
            `<h3 class="popup-title">📍 Searched Address</h3>` +
            `<p class="popup-meta">${escapeHtml(label)}</p>` +
            (closestStation
              ? `<p class="popup-destinations"><b>Closest Taxi Station</b><br>${escapeHtml(closestStation.name)} · <b>${formatDistance(closestStation.distanceMeters)} away</b></p>`
              : '')
          );
          group.addLayer(searchedMarker);

          if (closestStation) {
            const line = L.polyline([[lat, lng], closestStation.coordinates], {
              color: '#e5c158',
              weight: 2.5,
              dashArray: '6, 8',
              opacity: 0.9,
            });
            group.addLayer(line);

            const bounds = L.latLngBounds([[lat, lng], closestStation.coordinates]);
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, duration: 0.7 });
          } else {
            map.flyTo([lat, lng], 15, { duration: 0.6 });
          }

          group.addTo(map);
          geosearchLayerRef.current = group;
          searchedMarker.openPopup();
        });
      }
    }

    const markerLayer = markerLayerRef.current;
    markerLayer.clearLayers();
    markersByIdRef.current.clear();

    const markerIcon = (station) =>
      L.divIcon({
        className: '',
        html: `<span class="taxi-marker ${station.taxiType.includes('&') ? 'mixed' : ''}">${station.id}</span>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        popupAnchor: [0, -13],
      });

    const popupMarkup = (station) =>
      `<h3 class="popup-title">${escapeHtml(station.name)}</h3>` +
      `<p class="popup-meta">${escapeHtml(station.district)} · ${escapeHtml(station.taxiType)}</p>` +
      `<p class="popup-destinations"><b>Destinations</b><br>${(station.destinations || []).map(escapeHtml).join(' · ')}</p>`;

    stations.forEach((station) => {
      const marker = L.marker(station.coordinates, {
        icon: markerIcon(station),
        title: station.name,
        alt: `${station.taxiType}: ${station.name}`,
      })
        .bindPopup(popupMarkup(station), { maxWidth: 270 })
        .on('click', () => {
          setSelectedStationId(station.id);
        })
        .addTo(markerLayer);

      markersByIdRef.current.set(station.id, marker);
    });
  }, [stations]);

  // Load routes manifest
  useEffect(() => {
    fetch('/routes/manifest.json', { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((manifest) => {
        const list = Array.isArray(manifest) ? manifest : manifest?.routes || [];
        if (list.length) {
          setRoutes(list);
          setSelectedRouteId(list[0].id);
        } else {
          setRouteState('No routes listed in the route manifest.');
        }
      })
      .catch(() => {
        const fallback = [
          {
            id: 'casa-port-maarif',
            title: 'Casa-Port → Maarif',
            origin: 'Casa-Port',
            destination: 'Maarif',
            fareEstimate: 'MAD 18–35*',
            majorStops: ['Casa-Voyageurs', 'Derb Omar', 'Place de la Concorde'],
            gpx: '/routes/casa-port-to-maarif.gpx',
          },
        ];
        setRoutes(fallback);
        setSelectedRouteId(fallback[0].id);
      });
  }, []);

  // Handle route GPX drawing
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const currentRoute = routes.find((r) => r.id === selectedRouteId);
    if (!currentRoute) return;

    if (L.GPX) {
      const routePopupMarkup = (r) =>
        `<h3 class="popup-title">${escapeHtml(r.title)}</h3><p class="popup-meta">Illustrative taxi route</p>` +
        `<p class="popup-destinations"><b>Origin</b> ${escapeHtml(r.origin)}<br><b>Destination</b> ${escapeHtml(r.destination)}<br>` +
        `<b>Fare estimate</b> ${escapeHtml(r.fareEstimate || 'Not available')}<br>` +
        `<b>Major stops</b> ${(r.majorStops || []).map(escapeHtml).join(' · ') || 'Not available'}</p>`;

      const layer = new L.GPX(currentRoute.gpx, {
        async: true,
        polyline_options: {
          color: '#e5c158',
          opacity: 0.95,
          weight: 5,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'route-line',
        },
        marker_options: { startIconUrl: '', endIconUrl: '', shadowUrl: '', wptIconUrls: {} },
      })
        .bindPopup(routePopupMarkup(currentRoute))
        .on('click', (event) => {
          layer.openPopup(event.latlng);
        })
        .on('loaded', (event) => {
          if (routeLayerRef.current === event.target && event.target.getBounds().isValid()) {
            map.fitBounds(event.target.getBounds(), { padding: [56, 56], maxZoom: 14, duration: 0.7 });
          }
          setRouteState('Illustrative trace · verify route and fare locally.');
        })
        .on('error', () => {
          setRouteState(`Could not load ${currentRoute.gpx}. Check the route file path.`);
        })
        .addTo(map);

      routeLayerRef.current = layer;
    }
  }, [routes, selectedRouteId]);

  // Select station and fly
  const handleSelectStation = (id) => {
    setSelectedStationId(id);
    const marker = markersByIdRef.current.get(id);
    const map = mapInstanceRef.current;
    if (marker && map) {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.55 });
      marker.openPopup();
    }
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    const markerLayer = markerLayerRef.current;
    if (map && markerLayer && markerLayer.getBounds().isValid()) {
      map.fitBounds(markerLayer.getBounds(), { padding: [35, 35], maxZoom: 12, duration: 0.65 });
    }
  };

  const handleLocateCasa = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(CASA_CENTER, 12, { duration: 0.65 });
    }
  };

  const handleClearGeosearch = () => {
    setGeosearchResult(null);
    const map = mapInstanceRef.current;
    if (geosearchLayerRef.current && map) {
      map.removeLayer(geosearchLayerRef.current);
      geosearchLayerRef.current = null;
    }
    handleResetView();
  };

  const filteredStations = useMemo(() => {
    const q = search.trim().toLowerCase();

    // Calculate proximity distance if a location has been searched
    const list = stations.map((st) => {
      let distanceMeters = null;
      if (geosearchResult) {
        distanceMeters = calculateDistanceMeters(
          geosearchResult.lat,
          geosearchResult.lng,
          st.coordinates[0],
          st.coordinates[1]
        );
      }
      return { ...st, distanceMeters };
    });

    // If geosearch result active, sort stations by proximity
    if (geosearchResult) {
      list.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    }

    return list.filter((st) => {
      const matchText = `${st.name} ${st.district} ${(st.destinations || []).join(' ')}`.toLowerCase().includes(q);
      const matchType =
        taxiFilter === 'all' ||
        (taxiFilter === 'grand' && /grand/i.test(st.taxiType)) ||
        (taxiFilter === 'petit' && /petit/i.test(st.taxiType));
      return matchText && matchType;
    });
  }, [stations, search, taxiFilter, geosearchResult]);

  const activeRoute = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="casaway-app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">CW</div>
          <div className="brand-copy">
            <h1>Casaway</h1>
            <span>Casablanca Taxi Navigator</span>
          </div>
        </div>
        <div className="top-actions">
          <a href="/admin" className="admin-nav-link" title="Open Admin Dashboard">Admin</a>
          <div className="top-meta">
            <span className="live-dot" aria-hidden="true"></span>
            <span>{stations.length} stations mapped</span>
          </div>
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar" aria-label="Taxi station explorer">
          <div className="side-head">
            <p className="eyebrow">Casa / Mobility atlas</p>
            <h2>Find your next taxi.</h2>
            <p>Use the map search bar or station list to locate taxi hubs across Casablanca.</p>
          </div>

          {geosearchResult && (
            <div className="geosearch-banner">
              <div className="geosearch-banner-header">
                <span className="eyebrow">LOCATION SEARCHED</span>
                <button
                  type="button"
                  onClick={handleClearGeosearch}
                  className="clear-search-btn"
                  title="Clear location search"
                  aria-label="Clear location search"
                >
                  ✕ Clear
                </button>
              </div>
              <div className="geosearch-target">
                <span className="target-icon">📍</span>
                <span className="target-label" title={geosearchResult.label}>
                  {geosearchResult.label.split(',')[0]}
                </span>
              </div>
              {geosearchResult.nearestStation && (
                <div className="geosearch-nearest">
                  <span>Nearest station:</span>
                  <b>{geosearchResult.nearestStation.name}</b>
                  <span className="distance-badge">
                    {formatDistance(geosearchResult.nearestStation.distanceMeters)} away
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="search-wrap">
            <label className="search-box">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
                <path d="m13.2 13.2 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                id="station-search"
                type="search"
                placeholder="Filter by station name, district..."
                autoComplete="off"
                aria-label="Filter stations by name or district"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="filter-row">
            <label htmlFor="taxi-filter">Taxi type</label>
            <select
              id="taxi-filter"
              value={taxiFilter}
              onChange={(e) => setTaxiFilter(e.target.value)}
            >
              <option value="all">All stations</option>
              <option value="grand">Grand taxi</option>
              <option value="petit">Petit taxi</option>
            </select>
          </div>

          <div className="station-list" aria-live="polite">
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <button
                  key={station.id}
                  className={`station-button ${station.id === selectedStationId ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handleSelectStation(station.id)}
                  aria-pressed={station.id === selectedStationId}
                >
                  <span className="station-number">{String(station.id).padStart(2, '0')}</span>
                  <span className="station-main">
                    <span className="station-name">{station.name}</span>
                    <span className="station-sub">{station.district} · {station.taxiType}</span>
                  </span>
                  <div className="station-meta-right">
                    {station.distanceMeters != null && (
                      <span className="station-dist-pill">{formatDistance(station.distanceMeters)}</span>
                    )}
                    <span className="station-dot" aria-hidden="true"></span>
                  </div>
                </button>
              ))
            ) : (
              <p className="no-results">No stations match this search. Try another district or taxi type.</p>
            )}
          </div>

          <section className="route-panel" aria-label="Route details">
            <div className="route-heading">
              <h3>Route trace</h3>
              <span>GPX / {String(routes.length).padStart(2, '0')}</span>
            </div>
            <select
              className="route-select"
              value={selectedRouteId}
              onChange={(e) => {
                setSelectedRouteId(e.target.value);
                const found = routes.find((r) => r.id === e.target.value);
                if (found) setRouteState(`Loading ${found.title}...`);
              }}
              aria-label="Select a route"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.title}
                </option>
              ))}
            </select>

            {activeRoute && (
              <div className="route-info">
                <div>
                  <span className="route-stat-label">Origin</span>
                  <span className="route-stat-value">{activeRoute.origin}</span>
                </div>
                <div>
                  <span className="route-stat-label">Destination</span>
                  <span className="route-stat-value">{activeRoute.destination}</span>
                </div>
                <div>
                  <span className="route-stat-label">Fare estimate</span>
                  <span className="route-stat-value">{activeRoute.fareEstimate || 'Not available'}</span>
                </div>
                <div className="route-stops">
                  <span className="route-stat-label">Major stops</span>
                  <span className="route-stat-value">{(activeRoute.majorStops || []).join(' · ') || 'Not available'}</span>
                </div>
              </div>
            )}

            <p className={`route-state ${routeState.includes('Could not') ? 'error' : ''}`} role="status">
              {routeState}
            </p>
          </section>
        </aside>

        <section className="map-wrap" aria-label="Map of Casablanca taxi stations">
          <div className="map-container" ref={mapContainerRef}></div>
          <div className="map-chip">CASABLANCA · 33.5731° N / 7.5898° W</div>
          <div className="map-actions">
            <button type="button" onClick={handleResetView} title="Reset map view" aria-label="Reset map view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M20 11a8 8 0 1 0 1 4M20 4v7h-7" />
                <path d="M12 8v4l3 2" />
              </svg>
            </button>
            <button type="button" onClick={handleLocateCasa} title="Center on Casablanca" aria-label="Center map on Casablanca">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            </button>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        Casaway is an independent open-source project and is not affiliated with Casa Transport or local transit authorities.
      </footer>
    </div>
  );
}
