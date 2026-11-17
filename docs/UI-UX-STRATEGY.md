# Casaway — UI/UX & Frontend Implementation Strategy

*A walkthrough of the shipped PWA as it exists in the repository: the React 19
component tree, the mobile-first interaction model, the Ocean design layer, and
the offline / accessibility rules the code actually follows. This document
describes the implementation, not an aspirational one — anything not yet
wired up is listed explicitly in §7.*

Stack: Vite 8 + React 19 + react-leaflet 5 / Leaflet 1.9, Tailwind v4
(imported in `index.css`, used sparingly), Framer Motion for the locale menu
and install modal, Express + MongoDB API in `backend/`.

---

## 1. Product anatomy

The app is a single full-screen map with one floating station panel:

```
┌──────────────────────────────────────────────────────┐
│ (header rendered by Navbar, currently hidden by CSS)  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌ Sidebar / bottom panel ─┐   ┌──── map ─────────┐  │
│  │ eyebrow + heading       │   │   [route card]   │  │
│  │ search field            │   │       [⟲] [◎]   │  │
│  │ All · Near me · Grand … │   │                  │  │
│  │ Show destinations | fare│   │  OSM tiles + 20  │  │
│  │ 01 Station …            │   │  numbered depot  │  │
│  │ 02 Station …            │   │  markers + blue  │  │
│  │ …  [Directions]         │   │  user radar dot  │  │
│  └─────────────────────────┘   └──────────────────┘  │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Footer · independent open-source project disclaimer  │
└──────────────────────────────────────────────────────┘
```

Shell: `.casaway-app` is a CSS grid of `auto / minmax(0, 1fr) / auto` rows —
`Navbar`, `.main-layout`, `.app-footer` — at `100dvh` with `overflow: hidden`,
so the map never scrolls the page.

Breakpoints actually implemented in `App.css`:

| Width      | Station panel                                     | Map                        | Overlays                         |
| ---------- | ------------------------------------------------- | -------------------------- | -------------------------------- |
| ≥ 1180 px  | fixed 380 px column inside the grid               | remaining column, 16 px inset | route card top-left, map actions top-right |
| 1024–1180  | 340 px column                                     | remaining                  | same                             |
| 900–1024   | 310 px column                                     | remaining                  | same                             |
| < 900 px   | bottom panel, `left/right/bottom: 10px`, `max-height: min(68dvh, 640px)`, closed by default (`panel-closed` fades/translates it out, `visibility: hidden`) | absolutely positioned, full bleed | route card and actions float on top; attribution moved below the top-right buttons |

The panel starts open on desktop and closed on phones (`panelOpen` initialised
from `matchMedia('(max-width: 900px)')`), so the map is the entry point on a
phone.

**Current header state:** the `Navbar` component is still mounted and
functional, but the last rule in `App.css` hides it (`.topbar { display: none }`)
so the map owns the screen. Consequence to keep in mind: the menu button that
reopens the phone panel lives in that hidden header — see §7.

---

## 2. Component map

```
frontend/client/
├── index.html                 # fonts, PWA meta, #root, light theme bootstrap
├── public/
│   ├── manifest.json          # standalone PWA, theme #2f93c8, "Find Nearest Depot" shortcut
│   ├── sw.js                  # service worker (casaway-v9 + tile cache)
│   ├── casaway.JPEG           # brand mark used by the Navbar
│   └── icons/                 # 192/512 PNG, svg + maskable svg
└── src/
    ├── main.jsx               # createRoot + service-worker registration on load
    ├── App.jsx                # all app state and composition (single source of truth)
    ├── index.css              # Tailwind import, base reset, focus ring, glass util
    ├── App.css                # "Ocean Vibes" design layer (tokens + every component rule)
    ├── data/depots.js         # 20-depot fallback dataset, basemaps, STRINGS (en/fr/ar)
    ├── hooks/
    │   ├── useGeolocation.js  # position / notice / requestLocation
    │   └── useTheme.js        # light-only theme lock (+ theme-color meta)
    ├── utils/geo.js           # haversineMeters, formatDistance, escapeHtml
    ├── components/
    │   ├── header/Navbar.jsx          # brand, live count, search/menu buttons, locale menu
    │   ├── sidebar/Sidebar.jsx        # Sidebar shell + SidebarSearch field
    │   ├── sidebar/TaxiFilter.jsx     # filter pills (All / Near Me / Grand / Petit / Downtown)
    │   ├── sidebar/DepotList.jsx      # list + empty state (+ unused NearestChip export)
    │   ├── sidebar/DepotCard.jsx      # memoised row: number, name, meta, distance, Directions
    │   ├── map/MapContainer.jsx       # Leaflet shell, AutoResize, FitBounds, FlyTo,
    │   │                              #   UserMarker (radar dot), LocateButton
    │   ├── map/DepotMarkers.jsx       # numbered divIcon markers + HTML popups
    │   ├── map/RouteLayer.jsx         # transit polylines — implemented, not mounted
    │   └── ui/EstimatedFare.jsx       # regulated fare estimator panel (fare modal body)
    │       ui/FareCalculator.jsx      # illustrative calculator — implemented, not mounted
    └── js/fares.js                    # regulated fare dataset + fare math (mirrors backend)
```

`App.jsx` owns every piece of state: geolocation position/notice, depot list,
query, filter, selected depot, locale, install banner, destinations toggle,
fare modal, route target and route info. Components below it are presentational
and receive callbacks; `DepotCard` and `TaxiFilter` are `memo`ised.

---

## 3. Interaction flows

### 3.1 Search and filter
- `SidebarSearch` is a plain `type="search"` input (no combobox/listbox
  popup): filtering is synchronous and local, `aria-label` from `STRINGS`.
- `App` filters `depots` by a single lowercase substring over
  `name + district + destinations`, then narrows by pill:
  - `grand` / `petit` — regex on `taxiType`;
  - `downtown` — district in `['Centre Ville', 'Casa-Port', 'Casa-Voyageurs', 'Derb Omar']`;
  - `near` — sorts by haversine distance and keeps the 6 closest, only when a
    position exists; `handleFilter` requests location if it is still missing.
- Selecting a depot only highlights it (`selectedId`); the popup/list row do not
  move the camera. Directions is the action that changes the view.
- The list announces changes with `aria-live="polite"`; an empty result renders
  `.no-results` with the localised message.

### 3.2 Geolocation and the user radar
- `useGeolocation` calls `getCurrentPosition` once per request
  (`enableHighAccuracy`, 8 s timeout, 60 s `maximumAge`). It does **not** watch
  the position — the dot moves only after another explicit request.
- `UserMarker` renders a 72 × 72 `L.divIcon` anchored at its centre: a 22 px
  `#1d6fff` dot with a 3 px white ring and shadow, plus a halo that scales
  from 0.85 → 3.2 and fades over 2.4 s. The pulse is disabled under
  `prefers-reduced-motion: reduce`. The marker is non-interactive.
- `FlyTo` re-centres on every new position (zoom 14 by default); the map action
  button flies to the fix at zoom 15, and the other button fits all depot
  positions (`padding 35`, `maxZoom 12`).
- Location is requested from four places: the Near Me pill, the fare panel's
  "Find near me" button, the route card when it lacks a position, and the map's
  crosshair button. Errors surface as localised text in the panel description,
  the fare panel and the route card — there is no toast.

### 3.3 Directions and the route card
- `handleDirections(depot)` sets `routeTarget`, requests location if needed and
  closes the phone panel so the map is visible.
- `App` fetches OSRM driving geometry
  (`router.project-osrm.org`, aborted after 4.5 s). On failure or empty
  geometry it falls back to a straight `[user, depot]` line with haversine
  distance and `24 km/h` duration, flagged `direct: true`.
- The route draws as two polylines (9 px white halo under a 5 px `#2f93c8`
  line) and `FitBounds` frames it.
- The floating `.route-card` (top-left, `role="status"`) shows the depot name,
  `distance · ~minutes` (plus "direct line" for the fallback), a locate button
  when no position is known, and a close button. It stacks under the hidden
  header's space at the top of the map.

### 3.4 Popups and travel estimates
- Markers are 30 px divIcons with the depot id, classed
  `taxi-marker--grand | --petit | --mixed` (`&` in `taxiType` ⇒ mixed).
- Popup HTML is generated as a string with `escapeHtml` on every interpolated
  value. It carries name, `district · taxiType`, distance from the user,
  destinations, a Directions button and travel estimates: walking at 4.8 km/h,
  driving/taxi at 24 km/h, bus/tram as "available nearby" (no live transit
  data).
- The Directions button inside the popup is handled by a delegated click
  listener on the map container (`.popup-dir` → `data-depot-id`), because the
  popup body is raw HTML rather than React children.

### 3.5 Estimated fare modal
- The "Estimated fare" toggle in `.list-tools` opens `.fare-modal`
  (`role="dialog"`, `aria-modal`, backdrop click closes, inner click stopped).
- `EstimatedFare` reads `FARES` from `js/fares.js`: Day/Night switch (night
  default after `NIGHT_START_HOUR = 20`), Departure select (unique `origin`s),
  Destination select (unique destination tokens), per-seat price, whole-taxi
  price (`× SEATS_PER_TAXI = 6`), corridor distance/time and the disclaimer.
- Fare lookup is by origin first, then destination inclusion — a destination
  that does not belong to the chosen origin still shows that origin's fare. No
  price is invented: every number comes from the regulated dataset, which
  mirrors `backend/config/fares.js`.

### 3.6 Locale, install banner, footer
- EN / FR / AR strings live in `data/depots.js`. `App` sets
  `document.documentElement.lang` and `dir` (`rtl` for `ar`) and persists the
  choice in `localStorage` (`casaway-locale`). The locale switcher is the globe
  button in the Navbar (Framer Motion dropdown, outside-click and Escape close).
- The install banner is a Framer Motion modal shown 1.5 s after load unless the
  app is standalone, was already dismissed this session
  (`sessionStorage: casaway-install-prompted`) or was installed. `Install` uses
  the captured `beforeinstallprompt`; `Not now` dismisses for the session.
  The modal also documents the iOS "Add to Home Screen" path.
- The footer always renders LTR, whatever the locale: it is an English legal
  sentence about independence from Casa Transport.

### 3.7 Theme
`useTheme` is a light-only lock: it forces `data-theme="light"`, rewrites any
legacy `casaway-theme` value and keeps the `theme-color` meta at `#f2f9fd`.
Dark tokens still exist in `App.css` for rules that key off
`html:not([data-theme='dark'])`, but no UI can reach dark mode.

---

## 4. Design system

**Tokens** (`App.css §1`, "Ocean Vibes"):

| Token | Value | Use |
| ----- | ----- | --- |
| `--base` / body background | `#f2f9fd` + two radial washes | app shell |
| `--panel` / `--surface` | `#ffffff` | cards, sheets |
| `--accent` / `--gold` (legacy alias) | `#2f93c8` | pills, CTA, route line |
| `--accent-deep` | `#1f7aa6` | active labels |
| `--ink` / `--ink-soft` / `--muted` | `#14324a` / `#2f5670` / `#66859b` | type |
| `--line` / `--line-2` | `#e0eef7` / `#cde3f1` | hairlines |
| `--glass-surface` | `rgba(255,255,255,.72)` + blur | header, footer, map chrome |
| radii | `16 / 20 / 24 / 999` px | controls → panels → map/panels → pills |
| radar blue | `#1d6fff` | user dot |

Type: Plus Jakarta Sans for copy, Inter for meta/mono-ish labels, loaded from
Google Fonts with `preconnect`. Everything is rounded, soft-shadowed and
glass-tinted; the map is the only saturated surface.

**Motion**: 0.15–0.24 s eases on hover/press, Framer Motion 0.16–0.22 s for the
locale menu and install modal, 0.65–0.7 s `flyTo`/`fitBounds`. Leaflet's
`preferCanvas` keeps marker/polyline work cheap. `prefers-reduced-motion`
removes the radar pulse; there is no global transition kill switch.

**Feedback ladder**: local filtering is instant; async work (geolocation,
OSRM) always has an in-place text state (`locating`, `routeLoading`,
`routeDirect`, `routeNeedLocation`); errors replace that text rather than firing
a dialog.

---

## 5. Accessibility

- Every icon-only button has `aria-label` (reset view, show my location, close
  route, close panel, clear search, Directions — depot name), and interactive
  pills/cards expose `aria-pressed`.
- The station list and the fare grid are `aria-live="polite"`; the route card is
  `role="status"`; the fare dialog is `role="dialog" aria-modal="true"`.
- Focus is styled globally in `index.css` (`2px solid #2f93c8`, 3 px offset).
- Touch targets are bumped under `(pointer: coarse)` (pills and cards ≥ 44 px,
  map buttons 46 px).
- The locale menu supports Escape and outside-click dismissal; the install and
  fare overlays close on backdrop click.
- Known gaps: no focus trap in the fare/install overlays, the filter pills are
  labelled from `STRINGS.en` only, and default `aria-label`s in `Sidebar` and
  `SidebarSearch` are hard-coded English fallbacks.

---

## 6. Data, performance and offline

**Data path**
1. `DEFAULT_DEPOTS` (20 depots) is rendered immediately.
2. `fetch('/api/stations')` on mount replaces the list when it returns a
   non-empty array; any failure is silent.
3. `basemapFor(theme)` returns OSM standard tiles (labels in local names),
   switching to CARTO light/dark when `VITE_CARTO_KEY` is set.
Position and fares are purely client-side; `/api/routes` and `/api/feedback`
exist server-side but are not called by this client build.

API surface served by Express (`backend/app.js`): `GET /api/health`,
`GET /api/stations`, `GET /api/stations/:id`, `/api/routes`
(list/search/nearby + token-protected writes) and `POST /api/feedback`
(kind whitelist, 10–2000 char details, optional email; 503 on storage failure).

**Rendering**
- Depot marker icons are memoised on the depot array; only popups and the
  `UserMarker` are rebuilt on position changes.
- `AutoResize` observes the map container with `ResizeObserver`, listens for
  `orientationchange`, and invalidates size once after mount, so iOS chrome
  collapse and panel reflow do not leave tiles painted into a corner.
- Bundle: one Vite chunk (~544 kB / ~167 kB gzip) — code splitting is not
  enabled; that is the main payload debt.

**Service worker (`public/sw.js`, `casaway-v9`)**

| Request | Strategy | Why |
| ------- | -------- | --- |
| navigations | network-first → cached shell | fresh deploy, offline boot |
| same-origin/static assets | stale-while-revalidate | instant paint, deploys still land |
| `tile.openstreetmap.org` tiles | dedicated cache, SWR (`casaway-tiles-v1`) | repeat pans work offline |
| `/api/*` | not intercepted | live data is never cached |

The install step precaches `/`, `manifest.json`, `casaway.JPEG`, the route GPX
manifest and sample, and the SVG icons; activation deletes older `casaway-*`
caches. Missing offline assets resolve to a 503 response rather than a broken
page. Registration happens on `window.load` in `main.jsx` and is allowed to
fail silently.

---

## 7. Status vs. documentation

Implemented and mounted: map shell, depot markers/popups, radar user marker,
directions + route card, search/filter/list, destinations toggle, fare modal,
locale switching, install banner, footer, light-only theme.

Wired but currently hidden: `Navbar` (`.topbar` is `display: none`), which also
hides the only phone menu/search buttons — the panel cannot be reopened below
900 px until a floating trigger is added.

Present in code, not part of the UI: `RouteLayer` (transit polylines),
`FareCalculator`, `NearestChip`, `LocateButton`, the `TRANSIT_LINES` /
`LEGEND_*` / `TAXI_FILTERS` strings, and the whole feedback form (backend
endpoint and validation exist, no client surface calls it).

Empty or listed for future work: `locales` beyond the three shipped,
watch-based geolocation, live transit data, per-depot fare pinning on the map,
and code-splitting the bundle.
