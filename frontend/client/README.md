# Casaway — client

Casablanca grand & petit taxi depot map. React + Vite + Leaflet, styled with a
light "Ocean Vibes" design system.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run lint
```

Deployed on Vercel (project `casaway-omega`): root directory `frontend/client`,
build `npm run build`, output `dist`.

## Structure

```
src/
  App.jsx                  app shell: state, filters, banners
  main.jsx                 React root + service-worker registration
  App.css                  Ocean design system (tokens, glass, layout)
  index.css                Tailwind entry + base tokens
  data/depots.js           20 depots, basemaps, transit lines, locales, strings
  utils/geo.js             haversine, distance formatting, HTML escaping
  hooks/useTheme.js        light/dark theme with localStorage
  hooks/useGeolocation.js  position + permission notices
  components/
    header/Navbar.jsx      brand, live status, theme toggle, locale menu
    map/MapContainer.jsx   Leaflet shell + FlyTo / UserMarker helpers
    map/DepotMarkers.jsx   depot pins and popups
    map/RouteLayer.jsx     transit polylines
    sidebar/Sidebar.jsx    panel chrome + search field
    sidebar/DepotList.jsx  filterable list
    sidebar/DepotCard.jsx  single depot row
    sidebar/TaxiFilter.jsx filter pills (All / Near Me / Grand / Petit / Downtown)
    ui/FareCalculator.jsx  illustrative fare estimate
public/                    manifest, icons, service worker, logo
```

## Design tokens

`App.css` holds the palette and geometry: `--accent` (ocean blue), `--base`,
`--panel`, `--ink`, radii `--r-sm|md|lg|xl` (12/16/20/24px), and soft shadows.
Glassmorphism uses a translucent white tint plus `backdrop-filter` with the
`-webkit-` twin for iOS Safari. The `.glass-container` utility is the shared
frosted recipe.

## Data

Depots are bundled in `data/depots.js` and replaced at runtime by `GET
/api/stations` when that endpoint is reachable. The service worker caches the
app shell so the list and map chrome still work offline.
