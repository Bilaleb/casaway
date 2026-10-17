# Casaway — UI/UX & Frontend Implementation Strategy

*A senior-designer walkthrough of the PWA: component code layout, the mobile-first
interaction model, and the performance / offline / accessibility rules the
codebase follows — plus the React/Next.js reference structure the same design
maps to (Tailwind CSS, Lucide icons, Shadcn UI primitives).*

---

## 1. Product anatomy (mobile-first)

The app is three overlapping planes, ordered by how close they are to the thumb:

```
┌──────────────────────────────────────────────┐
│ Topbar: menu · brand · live depot count         │  64px
├──────────────────────────────────────────────┤
│                                                │
│   ┌─────────────── MAP HERO ───────────────┐   │
│   │  [ 🔍 Floating search · autocomplete ] [📍]│  ← always reachable
│   │                                         │   │
│   │              Leaflet map                │   │
│   │          (markers + gold trace)         │   │
│   │  ┌────── Bottom sheet (drag/swipe) ───┐ │   │
│   │  │ route · duration · transit chips    │ │   │
│   │  └────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│ Footer · "Report a route or station issue"      │
└──────────────────────────────────────────────┘
```

Breakpoints and what wins where:

| Width  | Sidebar list      | Map                     | Detail panel            | Feedback              |
| ------ | ----------------- | ----------------------- | ----------------------- | --------------------- |
| < 560  | drawer (hamburger)| full width              | bottom sheet (46% snap) | full-width dialog     |
| 560–760| drawer            | full width              | bottom sheet            | phone-width dialog    |
| > 760  | persistent 365px  | remaining               | sheet docked bottom-right + sidebar route panel | centered dialog |

The golden rule: **the floating search bar and the geolocation button live on
top of the map at every width**, because "where am I / where can I go" is the
primary job — burying it in a drawer would fail on mobile.

---

## 2. Component code layout

### 2.1 Shipped implementation (vanilla ES modules, Vite-bundled)

```
frontend/client/
├── index.html                 # static shell: topbar, map hero, dialog, sheet
├── app.js                     # bootstrap + state (single source of truth)
├── public/
│   ├── styles.css             # design tokens + component styles (mobile-first)
│   ├── sw.js                  # service worker (offline strategies)
│   └── manifest.json          # PWA manifest
└── js/
    ├── dom.js                 # XSS-safe element builder (textContent only)
    ├── constants.js           # tokens: colors, zooms, tile URL, filters
    ├── map.js                 # map lifecycle, camera helpers
    ├── markers.js             # station icons + popups
    ├── stations.js            # station data + pure filter/distance helpers
    ├── routes.js              # route view helpers + popup builders
    ├── sidebar.js             # station list view (render on change)
    ├── routePanel.js          # sidebar route detail rows
    ├── floatingSearch.js      # ✦ combobox + autocomplete suggester
    ├── bottomSheet.js         # ✦ draggable snap-point detail panel
    ├── transit.js             # ✦ transit chips + duration estimator
    ├── feedbackForm.js        # ✦ dialog form, validation, offline queue
    ├── pwa.js                 # SW registration, install prompt, connectivity
    └── offline.js             # IndexedDB snapshot read/write
```

Each `js/*.js` view module follows the same contract: **pure construction +
private DOM state, driven by the controller** (`app.js`). No module reaches
into another module's DOM; `app.js` wires them through callbacks. This is the
vanilla equivalent of React's unidirectional data flow and keeps every panel
independently testable.

**Acceptance-verified behaviors (this iteration)**

1. **Floating search bar** — `role="combobox"` input with `aria-expanded`,
   `aria-activedescendant`, arrow-key navigation over a `role="listbox"`,
   `<mark>`-based match highlighting built with `textContent` (no HTML
   concatenation anywhere), debounced at 300 ms through the *same* pipeline as
   the sidebar field so only one query can be in flight at a time.
2. **Find Near Me** — visible crosshair button in the search bar with
   `aria-busy` + `.is-loading` pulse, one geolocation fix per session, and a
   map toast announcing the nearest depot (the sidebar status alone would be
   invisible on mobile, since the sidebar is a closed drawer there).
3. **Bottom sheet** — snap points expressed as *visible heights*
   (peek 84px → half 46% → full 86%), pointer drag with velocity-based
   snapping, `prefers-reduced-motion` kills the transition, and the grab
   handle is a real `<button aria-expanded>` with ArrowUp/ArrowDown/Enter.
   Content: origin/destination/distance/**estimated duration** plus
   **transit chips** for Large Taxi, Small Taxi and Bus.
4. **Transit honesty** — chips are derived from the stored `taxiType`;
   Bus renders `aria-disabled` as "soon" because Casa bus lines are not in the
   dataset yet. Duration is `distance ÷ 22 km/h` and is always labelled as an
   estimate — no invented precision, and no fares anywhere in the product.
5. **Feedback drawer** — native `<dialog>` (free focus trap + Esc), HTML5
   constraints plus server-side re-validation at `POST /api/feedback`
   (kind whitelist, 10–2000 char details, optional email). If the API is down
   the report is queued in `localStorage` and flushed on the `online` event —
   a reporter never loses their write, which matters because Atlas
   reachability from the field is not guaranteed.

### 2.2 React / Next.js reference structure (target architecture)

The same design as a React tree. This is the migration map — the shipped
modules above map 1:1 onto these components, so a future port swaps the
transport, not the design.

```
app/                            # Next.js App Router (static shell + CSR map)
├── layout.tsx                  # <html>, fonts (self-hosted), theme, SW register
├── page.tsx                    # server shell → <AppShell/>, map is client-only
└── api/
    └── feedback/route.ts       # edge-friendly POST handler (same rules)
src/
├── components/
│   ├── map/
│   │   ├── MapHero.tsx         # 'use client'; Mapbox/Leaflet <Map Container>
│   │   ├── StationMarker.tsx      memoized per-station marker
│   │   └── RouteTrace.tsx         gold polyline, fits bounds on mount
│   ├── search/
│   │   ├── FloatingSearch.tsx     WAI-ARIA combobox (command-style)
│   │   └── SuggestionList.tsx     listbox rows, <mark> highlighting
│   │   └── FindNearMe.tsx         button + useGeolocation() state machine
│   ├── sheet/
│   │   └── DetailSheet.tsx        Shadcn Sheet (draggable) + snap points
│   │       ├── RouteStats.tsx       origin · destination · distance · duration
│   │       └── TransitChips.tsx     Large Taxi · Small Taxi · Bus
│   ├── feedback/
│   │   ├── ReportDialog.tsx        Shadcn Dialog / Drawer (Sheet on phones)
│   │   └── useFeedbackQueue.ts     localStorage queue + online flush
│   └── ui/                      # shadcn/ui primitives (button, input, dialog…)
├── hooks/
│   ├── useDebouncedValue.ts     generic 300 ms debounce (single instance)
│   ├── useGeolocation.ts        permission / success / error / timeout
│   └── useRouteCatalogue.ts     API → IndexedDB snapshot → bundled fallback
└── lib/
    ├── transit.ts               estimateDurationMin(), transitOptions()
    └── api.ts                   fetch + AbortController timeout helpers
```

Key mapping table:

| Shipped module        | React target                       | State owner                     |
| --------------------- | ---------------------------------- | ------------------------------- |
| `app.js`              | `useRouteCatalogue()` + Zustand/Context | catalogue, active id, query |
| `floatingSearch.js`   | `FloatingSearch` + `useDebouncedValue` | combobox open/active index |
| `bottomSheet.js`      | `DetailSheet` (Shadcn `Sheet`)     | snap state in component         |
| `feedbackForm.js`     | `ReportDialog` + `useFeedbackQueue`| form state (react-hook-form)    |
| `sidebar.js`          | `StationList` (`React.memo` rows)  | active id from store            |

Performance idioms in the React target:

- **Memoize at the marker boundary**: `StationMarker` is `React.memo`'d on
  station id + active flag, so panning/typing re-renders the list, not 20
  Leaflet markers.
- **One debounced write**: a single `useDebouncedValue(query, 300)` feeds the
  server search; the local filter still runs synchronously on every keystroke
  for instant feedback (never debounce the cheap path).
- **Server components where possible**: the shell, footer and dialog markup are
  static — only the map hero and its panels are `'use client'`, keeping the
  hydration payload small on mobile.
- **Icons**: Lucide (`Search`, `Crosshair`, `Bus`, `CarFront`, `Flag`,
  `GripHorizontal`) — the vanilla build uses equivalent inline SVG geometry,
  zero icon-font bytes.

---

## 3. Interaction & design system

**Tokens** (`styles.css :root`, mirrored by Tailwind theme vars in the React
target): night palette `#0b0f19` base, `#111722` panels, gold `#e5c158`
accent, DM Mono for meta/labels, Space Grotesk for copy.

**Motion**: 0.15–0.24 s, `cubic-bezier(.22,.8,.3,1)`; disabled entirely under
`prefers-reduced-motion: reduce`. The sheet drags 1:1 with the finger and only
animates on release.

**Feedback ladder** (every async action answers in < 1 s):
1. optimistic local render (list filter, sheet content),
2. in-place status (`route-state`, `aria-live`),
3. toast only for geolocation, which moves the camera and needs a non-dismissed
   confirmation visible above the sheet.

**Accessibility checklist** (all enforced in this iteration):
- combobox/listbox pattern with `aria-activedescendant` for search;
- every icon-only button has `aria-label` (`reset view`, `find near me`,
  `close panel`);
- sheet handle exposes `aria-expanded` and is keyboard-operable;
- native `<dialog>` gives modal focus trap + Escape;
- `role="status"`/`aria-live` on toast, suggestion empty state, route status;
- 44 px-ish touch targets (38 px buttons + padding), visible gold focus rings.

---

## 4. Performance & offline strategy

**Rendering**
- One `requestAnimationFrame`-free render path: `replaceChildren()` on the
  filtered list only — no virtual DOM, no layout thrash; markers are mounted
  only when the *station set* changes, not on keystroke.
- Search: local substring filter on every input (pure, ~20 items) + server
  search debounced 300 ms with a request token so stale responses are dropped.
- Map: `preferCanvas: true`, `flyTo` with fixed durations, `invalidateSize()`
  on drawer toggles and window resize.

**Service worker (`public/sw.js`)**

| Request                | Strategy                    | Why                                            |
| ---------------------- | --------------------------- | ---------------------------------------------- |
| navigations            | network-first → shell cache | fresh deploys, offline boot guaranteed         |
| same-origin static     | stale-while-revalidate      | instant paint, unhashed `/styles.css` still updates |
| OSM tiles              | stale-while-revalidate      | repeat pans paint offline, tiles refresh        |
| `/api/*`               | pass-through (never cached) | live data is not a shell concern               |

Cache name `casaway-v3`; activation purges any older `casaway-*` entry, and
`app.js` additionally pre-warms `/`, `/styles.css` and its own hashed bundle
URL after a successful network load so a first-visit-then-offline reload still
boots. Data plane: API → IndexedDB snapshot → bundled station list, in that
order, so the app is *never* a white screen.

**Payload**: single Vite bundle, tree-shaken modules, no icon fonts, fonts
preconnected, Leaflet from CDN with SRI (persistently cached by the SW).

---

## 5. Data integrity note

No pricing or fare fields exist anywhere in client, schema or seed data —
transit information shows duration (derived) and service type (declared) only.
Community reports land in a dedicated `Feedback` collection and are validated
before storage.