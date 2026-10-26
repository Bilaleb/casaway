/**
 * Casaway — Casablanca transit map layout.
 *
 * A single, self-contained React function component covering the full UI:
 *   • Casaway's classic chrome: Space Grotesk / DM Mono, gold-on-navy palette,
 *     teardrop taxi pins, gold-line ghost buttons — dark and light themes
 *     driven by <html data-theme> (same tokens as public/styles.css)
 *   • React-Leaflet map on a high-contrast minimal basemap (keyless Esri
 *     gray canvases; set VITE_CARTO_KEY to use CARTO dark/positron instead)
 *   • colored <Polyline /> transit network overlays between primary depots
 *   • floating search card (one leading magnifier) + scrollable filter pills
 *     including a geolocating "Near Me" pill
 *   • interactive bottom-left legend (animated expand, per-line visibility)
 *   • dismissible PWA install banner animated with <AnimatePresence />
 *   • FR/AR/EN localization switcher at the right edge of the header
 *
 * Z-index blueprint: map layer z-0, floating map controls z-10,
 * header/banner chrome z-20/30. Every overlay is pinned with
 * top-4/left-4/right-4/bottom-4 so nothing overlaps on tight viewports.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Eye, EyeOff, Languages, Layers, Locate, Moon, Search, Sun, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CASA_CENTER = [33.5731, -7.5898];
const THEME_KEY = 'casaway-theme';

/* ------------------------------------------------------- classic UI/UX --
 * The exact tokens and component skins from Casaway's original design
 * system (public/styles.css), scoped under .cw so they travel with this
 * component. [data-theme="light"] restores the warm-paper palette. */

const TOKEN_CSS = `
.cw {
  --ink: #f3f1e9; --ink-soft: #d3d0c5; --muted: #9299a8;
  --gold: #e5c158; --gold-fill: #e5c158; --gold-line: #756231;
  --gold-glow: rgba(229, 193, 88, .55); --gold-wash: rgba(229, 193, 88, .12);
  --base: #0b0f19; --panel: #111722; --surface: #0d121c; --surface-2: #141a26;
  --surface-hover: #1a202b; --float: rgba(11, 15, 25, .95);
  --float-strong: rgba(13, 18, 28, .97);
  --line: #252d3a; --line-2: #333d4e; --chip-on-bg: #171a15;
  --danger: #ef918a; --ok: #9ad0a0;
  --sans: 'Space Grotesk', 'Segoe UI', sans-serif; --mono: 'DM Mono', monospace;
  font-family: var(--sans); background: var(--base); color: var(--ink);
}
[data-theme="light"] .cw {
  --ink: #161a21; --ink-soft: #333a45; --muted: #5b6472;
  --gold: #8a6a12; --gold-fill: #dcb63f; --gold-line: #a8851f;
  --gold-glow: rgba(138, 106, 18, .38); --gold-wash: rgba(138, 106, 18, .10);
  --base: #f6f4ee; --panel: #ffffff; --surface: #f0ede4; --surface-2: #ffffff;
  --surface-hover: #e9e5da; --float: rgba(255, 255, 255, .95);
  --float-strong: rgba(255, 255, 255, .97);
  --line: #ddd8cb; --line-2: #c9c3b4; --chip-on-bg: #f1f4e9;
  --danger: #b23a30; --ok: #2c7a44;
}

/* Header */
.cw-brand-mark { width: 38px; height: 38px; flex: none; display: grid; place-items: center;
  border: 1px solid var(--gold-line); border-radius: 4px; overflow: hidden;
  background: var(--surface); box-shadow: 0 2px 12px #0008; }
.cw-brand-mark img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cw-brand-mark span { font: 600 12px var(--mono); color: var(--gold); }
.cw-brand-copy h1 { font-size: 18px; line-height: 1; margin: 0; font-weight: 600; }
.cw-brand-copy > span { font: 10px var(--mono); color: var(--muted); display: block; margin-top: 5px; }
.cw-meta { font: 11px var(--mono); color: var(--muted); display: flex; align-items: center; gap: 9px; white-space: nowrap; }
.cw-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 12px var(--gold-glow); }
.cw-icon-btn { display: grid; place-items: center; width: 36px; height: 36px; padding: 0;
  background: transparent; border: 1px solid var(--line); border-radius: 2px; color: var(--ink); }
.cw-icon-btn:hover, .cw-icon-btn:focus-visible { color: var(--gold); border-color: var(--gold-line); outline: none; }

/* Locale switcher */
.cw-locale { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px;
  background: transparent; border: 1px solid var(--gold-line); border-radius: 2px;
  color: var(--gold); font: 600 11px var(--mono); letter-spacing: .04em; }
.cw-locale:hover, .cw-locale:focus-visible { background: var(--gold-wash); outline: none; }
.cw-locale-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; min-width: 156px;
  padding: 4px; background: var(--float-strong); border: 1px solid var(--line);
  border-radius: 3px; box-shadow: 0 20px 46px #000c; }
.cw-locale-menu ul { list-style: none; margin: 0; padding: 0; }
.cw-locale-opt { display: flex; width: 100%; justify-content: space-between; align-items: center;
  gap: 10px; padding: 8px 10px; background: transparent; border: 0; border-radius: 2px;
  font-size: 12px; color: var(--ink-soft); }
.cw-locale-opt:hover { background: var(--surface-hover); }
.cw-locale-opt.is-on { color: var(--gold); background: var(--chip-on-bg); }
.cw-locale-opt small { font: 10px var(--mono); color: var(--muted); text-transform: uppercase; }

/* Floating search field */
.cw-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
  background: var(--float); border: 1px solid var(--line); border-radius: 3px;
  box-shadow: 0 10px 30px #0009; transition: border-color .15s ease; }
.cw-search:focus-within { border-color: var(--gold); }
.cw-search svg { flex: none; margin-left: 12px; color: var(--muted); }
.cw-search input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
  color: var(--ink); font-size: 14px; padding: 12px 10px; }
.cw-search input::placeholder { color: var(--muted); }

/* Filter pills (transit-chip language: pill, gold-fill when on) */
.cw-pill { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 13px;
  border: 1px solid var(--line); border-radius: 999px; background: var(--surface);
  color: var(--muted); font-size: 12px; font-weight: 500; white-space: nowrap;
  transition: border-color .15s ease, color .15s ease; }
.cw-pill:hover { color: var(--ink); border-color: var(--gold-line); }
.cw-pill.is-on { background: var(--gold-fill); border-color: var(--gold-fill);
  color: #14120c; font-weight: 700; box-shadow: 0 0 14px var(--gold-glow); }
.cw-pill svg { width: 14px; height: 14px; }

/* Status notice (sr-status / map-toast language) */
.cw-notice { background: var(--float-strong); border: 1px solid var(--line);
  color: var(--ink-soft); font: 11px var(--mono); padding: 7px 10px; border-radius: 2px;
  box-shadow: 0 8px 24px #0009; }

/* Legend */
.cw-legend-btn { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px;
  background: var(--float); border: 1px solid var(--line); border-radius: 3px;
  color: var(--ink-soft); font-size: 12px; box-shadow: 0 10px 30px #0009; }
.cw-legend-btn:hover, .cw-legend-btn:focus-visible { color: var(--gold); border-color: var(--gold-line); outline: none; }
.cw-legend-btn svg { width: 16px; height: 16px; }
.cw-legend-card { width: 258px; padding: 12px; background: var(--float-strong);
  border: 1px solid var(--line); border-radius: 3px; box-shadow: 0 20px 46px #000c; }
.cw-legend-card ul { list-style: none; margin: 0; padding: 0; }
.cw-legend-head { font: 10px var(--mono); color: var(--gold); text-transform: uppercase;
  letter-spacing: .05em; margin: 0 0 4px; }
.cw-legend-head + li { margin-bottom: 2px; }
.cw-legend-lines { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--line); }
.cw-legend-row { display: flex; align-items: center; gap: 9px; padding: 5px 6px;
  border-radius: 2px; font-size: 12px; color: var(--ink-soft); }
.cw-legend-toggle { width: 100%; background: transparent; border: 0; text-align: left; }
.cw-legend-toggle:hover { background: var(--surface-hover); color: var(--gold); }
.cw-legend-toggle.is-off { opacity: .45; }
.cw-legend-row span.name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cw-legend-row svg { width: 14px; height: 14px; color: var(--muted); flex: none; }
.cw-dot { width: 13px; height: 13px; flex: none; border-radius: 50% 50% 50% 2px;
  transform: rotate(-45deg); border: 1px solid #f4d67b; background: #1b1b18; }
.cw-dot--petit { width: 11px; height: 11px; }
.cw-dot--mixed { background: #7b6531; border-color: #c8ab63; }
.cw-dot--you { border-radius: 50%; transform: none; border: 2px solid var(--gold); background: transparent; }
[data-theme="light"] .cw-dot { background: #fff; border-color: var(--gold-line); }
[data-theme="light"] .cw-dot--mixed { background: #7b6531; border-color: #756231; }
.cw-line-swatch { width: 22px; height: 3px; flex: none; border-radius: 999px; }

/* PWA install banner (classic install-banner skin) */
.cw-banner { display: flex; align-items: center; gap: 14px; width: 100%; max-width: 440px;
  background: var(--panel); border: 1px solid var(--gold-line); border-radius: 3px;
  padding: 12px 16px; box-shadow: 0 12px 40px #000a; font-size: 12px; }
.cw-banner strong { display: block; font-size: 13px; font-weight: 600; }
.cw-banner-hint { display: block; margin-top: 2px; color: var(--muted); font-size: 11px; line-height: 1.45; }
.cw-install { flex: none; background: var(--gold-fill); color: #14120c; border: 0;
  border-radius: 2px; padding: 8px 14px; font-weight: 600; font-size: 12px; }
.cw-install:hover { filter: brightness(1.07); }
.cw-dismiss-x { flex: none; display: grid; place-items: center; width: 28px; height: 28px;
  background: transparent; border: 0; border-radius: 2px; color: var(--muted); }
.cw-dismiss-x:hover, .cw-dismiss-x:focus-visible { color: var(--gold); outline: none; }

/* Teardrop taxi pins (exact classic marker geometry) */
.cw-pin { width: 25px; height: 25px; display: grid; place-items: center;
  border: 1px solid #f4d67b; border-radius: 50% 50% 50% 2px; transform: rotate(-45deg);
  background: #1b1b18; color: #f4d67b; font: 9px var(--mono); box-shadow: 0 2px 10px #0009; }
.cw-pin > span { transform: rotate(45deg); }
.cw-pin--petit { width: 21px; height: 21px; font-size: 8px; }
.cw-pin--mixed { background: #7b6531; color: #fff; border-color: #c8ab63; }
[data-theme="light"] .cw-pin { background: #fff; color: #8a6a12; border-color: #a8851f; box-shadow: 0 2px 8px #00000026; }
[data-theme="light"] .cw-pin--mixed { background: #7b6531; color: #fff; border-color: #756231; }

/* User position (gold, pulsing) */
.cw-you { position: relative; display: block; width: 16px; height: 16px; }
.cw-you-ping { position: absolute; inset: 0; border-radius: 50%; background: var(--gold);
  opacity: .7; animation: cw-ping 1.6s cubic-bezier(0, 0, .2, 1) infinite; }
@keyframes cw-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
.cw-you-dot { position: absolute; inset: 3px; border-radius: 50%;
  background: var(--gold-fill); border: 2px solid var(--base); }

/* Leaflet chrome inside the component */
.cw .leaflet-popup-content-wrapper, .cw .leaflet-popup-tip {
  background: var(--panel); color: var(--ink); border: 1px solid var(--line-2);
  box-shadow: 0 8px 30px #0009; }
.cw .leaflet-popup-content { font-family: var(--sans); font-size: 12px; line-height: 1.55; margin: 14px 16px; }
.cw .leaflet-popup-content b, .cw .popup-eyebrow { color: var(--gold); }
.cw .popup-title { font-size: 14px; font-weight: 600; margin: 0 20px 4px 0; }
.cw .popup-meta { color: var(--muted); margin: 0 0 8px; }
.cw .popup-dest { margin: 3px 0; color: var(--ink-soft); }
.cw .leaflet-bar { border: 0; box-shadow: 0 6px 18px #0007; }
.cw .leaflet-bar a { background: var(--float); color: var(--ink); border-color: var(--line);
  border-bottom-width: 1px; width: 34px; height: 34px; line-height: 34px; }
.cw .leaflet-bar a:hover { background: var(--surface-2); color: var(--gold); }
`;

/* ---------------------------------------------------------------- data */

const DEFAULT_DEPOTS = [
  { id: 1, name: 'Place de la Concorde (L-Hammam / Bd Lalla Yacout)', district: 'Centre Ville', coordinates: [33.5912, -7.6134], taxiType: 'Grand Taxi', destinations: ['Oulfa', 'Maarif', 'Ain Diab'] },
  { id: 2, name: 'Station Casa-Port', district: 'Casa-Port', coordinates: [33.6002, -7.6119], taxiType: 'Grand & Petit Taxi', destinations: ['Ain Sebaa', 'Sidi Bernoussi', 'Mohammedia'] },
  { id: 3, name: 'Station Casa-Voyageurs', district: 'Casa-Voyageurs', coordinates: [33.5892, -7.5891], taxiType: 'Grand & Petit Taxi', destinations: ['Centre Ville', 'Hay Mohammadi', 'Derb Sultan'] },
  { id: 4, name: 'Station Garage Allal (Derb Sultan)', district: 'Derb Sultan', coordinates: [33.5715, -7.6045], taxiType: 'Grand Taxi', destinations: ['Mediouna', 'Tit Mellil', 'Bouskoura'] },
  { id: 5, name: 'Station Rond-Point Bachkou', district: 'Bachkou', coordinates: [33.5583, -7.6251], taxiType: 'Grand Taxi', destinations: ['Near University', 'Oulfa', 'Sidi Maalouf'] },
  { id: 6, name: 'Station L-Oulfa (Terminus / Bd Moulay Rachid)', district: 'Oulfa', coordinates: [33.5511, -7.6698], taxiType: 'Grand Taxi', destinations: ['Centre Ville', 'Maarif', 'Errahma'] },
  { id: 7, name: 'Station Sidi Bernoussi (Bd Imam Ali)', district: 'Sidi Bernoussi', coordinates: [33.6085, -7.5214], taxiType: 'Grand Taxi', destinations: ['Mohammedia', 'Tit Mellil', 'Casa-Port'] },
  { id: 8, name: 'Station Ain Sebaa (L-Gara / Near Train Station)', district: 'Ain Sebaa', coordinates: [33.6068, -7.5452], taxiType: 'Grand Taxi', destinations: ['Sidi Bernoussi', 'Centre Ville'] },
  { id: 9, name: 'Station Maarif (Bd Bir Anzarane / Twin Center)', district: 'Maarif', coordinates: [33.5824, -7.6361], taxiType: 'Petit Taxi & Grand Taxi Hub', destinations: ['Grand taxi hub', 'Twin Center', 'Ain Diab'] },
  { id: 10, name: 'Station Hay Hassani (SOUK / Terminus)', district: 'Hay Hassani', coordinates: [33.5602, -7.6582], taxiType: 'Grand Taxi', destinations: ['Oulfa', 'Lissasfa', 'Maarif'] },
  { id: 11, name: 'Station Lissasfa (Route d\'El Jadida / Rond Point)', district: 'Lissasfa', coordinates: [33.5341, -7.6781], taxiType: 'Grand Taxi', destinations: ['Azemmour', 'Had Soualem', 'Errahma'] },
  { id: 12, name: 'Station Derb Omar / Bd Mohammed V', district: 'Derb Omar', coordinates: [33.5938, -7.6087], taxiType: 'Petit Taxi & Regional Grand Taxi', destinations: ['Centre Ville', 'Casa-Voyageurs', 'Regional routes'] },
  { id: 13, name: 'Station Sidi Moumen (Terminus Tramway Anassi)', district: 'Sidi Moumen', coordinates: [33.5871, -7.5023], taxiType: 'Grand Taxi', destinations: ['Bernoussi', 'Tit Mellil'] },
  { id: 14, name: 'Station Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)', district: 'Hay Mohammadi', coordinates: [33.5921, -7.5658], taxiType: 'Grand Taxi', destinations: ['Casa-Voyageurs', 'Sidi Bernoussi'] },
  { id: 15, name: 'Station Sbata (Rond Point Jamila)', district: 'Sbata', coordinates: [33.5542, -7.5681], taxiType: 'Grand Taxi', destinations: ['Garage Allal', 'Derb Sultan', 'Ain Chock'] },
  { id: 16, name: 'Station Ain Chock (Bd Baghdad / Near Faculté)', district: 'Ain Chock', coordinates: [33.5488, -7.6012], taxiType: 'Grand Taxi', destinations: ['Bachkou', 'Derb Sultan', 'Sidi Maalouf'] },
  { id: 17, name: 'Station Errahma (Ville Nouvelle / Main Roundabout)', district: 'Errahma', coordinates: [33.5124, -7.7115], taxiType: 'Grand Taxi', destinations: ['Oulfa', 'Lissasfa'] },
  { id: 18, name: 'Station Tit Mellil (Centre)', district: 'Tit Mellil', coordinates: [33.554, -7.4812], taxiType: 'Regional Grand Taxi', destinations: ['Garage Allal', 'Bernoussi'] },
  { id: 19, name: 'Station Sidi Maalouf (Near Technopark)', district: 'Sidi Maalouf', coordinates: [33.5421, -7.6385], taxiType: 'Grand Taxi', destinations: ['Bachkou', 'Shorex', 'Zenith'] },
  { id: 20, name: 'Station Sidi Bernoussi - Tram Terminus', district: 'Sidi Bernoussi', coordinates: [33.6152, -7.5089], taxiType: 'Grand Taxi', destinations: ['Zone Industrielle', 'Mohammedia'] },
];

/** Transit network overlays: colored lines linking the primary depots.
 *  Colors come from the classic palette (gold / ok-green / danger-soft) with
 *  darker variants for the light theme's pale tiles. */
const TRANSIT_LINES = [
  {
    id: 'coastal',
    nameKey: 'lineCoastal',
    color: '#e5c158',
    colorLight: '#8a6a12',
    path: [[33.5912, -7.6134], [33.6002, -7.6119], [33.6068, -7.5452], [33.6085, -7.5214], [33.6152, -7.5089]],
  },
  {
    id: 'ouifa-port',
    nameKey: 'lineOulfa',
    color: '#9ad0a0',
    colorLight: '#2c7a44',
    path: [[33.5511, -7.6698], [33.5602, -7.6582], [33.5824, -7.6361], [33.5938, -7.6087], [33.6002, -7.6119]],
  },
  {
    id: 'south-loop',
    nameKey: 'lineSouth',
    color: '#ef918a',
    colorLight: '#b23a30',
    path: [[33.5583, -7.6251], [33.5488, -7.6012], [33.5542, -7.5681], [33.5421, -7.6385], [33.5341, -7.6781], [33.5124, -7.7115]],
  },
];

const DOWNTOWN_DISTRICTS = ['Centre Ville', 'Casa-Port', 'Casa-Voyageurs', 'Derb Omar'];

const FILTERS = [
  { id: 'all', labelKey: 'pillAll' },
  { id: 'near', labelKey: 'pillNear', Icon: Locate },
  { id: 'grand', labelKey: 'pillGrand' },
  { id: 'petit', labelKey: 'pillPetit' },
  { id: 'downtown', labelKey: 'pillDowntown' },
];

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

/* ----------------------------------------------------------- localization */

const STRINGS = {
  en: {
    tagline: 'Your Way Through Casablanca',
    depotCount: (n) => `${n} depots mapped`,
    searchLabel: 'Search depots, districts or destinations',
    searchPlaceholder: 'Search depots, districts, destinations',
    pillAll: 'All',
    pillNear: 'Near Me',
    pillGrand: 'Grand taxi',
    pillPetit: 'Petit taxi',
    pillDowntown: 'Downtown',
    legendToggle: 'Toggle map legend',
    legendTitle: 'Map legend',
    legendMarkers: 'Markers',
    legendLines: 'Transit lines',
    markerGrand: 'Grand taxi depot',
    markerPetit: 'Petit taxi depot',
    markerMixed: 'Mixed depot',
    markerYou: 'Your position',
    lineCoastal: 'Coastal line',
    lineOulfa: 'Oulfa – Port link',
    lineSouth: 'Southern loop',
    lineOn: 'Hide line',
    lineOff: 'Show line',
    bannerAria: 'Install Casaway',
    bannerTitle: 'Take Casaway with you',
    bannerBody: 'Install for quick access to taxi depots.',
    install: 'Install',
    dismiss: 'Dismiss install prompt',
    localeLabel: 'Language',
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    locating: 'Finding your nearest depots…',
    locationDenied: 'Location unavailable — allow location access to use Near Me.',
    noResults: 'No depots match this search. Try another district or taxi type.',
  },
  fr: {
    tagline: 'Votre chemin à Casablanca',
    depotCount: (n) => `${n} dépôts cartographiés`,
    searchLabel: 'Rechercher un dépôt, un quartier ou une destination',
    searchPlaceholder: 'Rechercher dépôt, quartier, destination',
    pillAll: 'Tous',
    pillNear: 'Près de moi',
    pillGrand: 'Grand taxi',
    pillPetit: 'Petit taxi',
    pillDowntown: 'Centre-ville',
    legendToggle: 'Afficher ou masquer la légende',
    legendTitle: 'Légende',
    legendMarkers: 'Repères',
    legendLines: 'Lignes de transit',
    markerGrand: 'Dépôt grand taxi',
    markerPetit: 'Dépôt petit taxi',
    markerMixed: 'Dépôt mixte',
    markerYou: 'Votre position',
    lineCoastal: 'Ligne côtière',
    lineOulfa: 'Liaison Oulfa – Port',
    lineSouth: 'Boucle sud',
    lineOn: 'Masquer la ligne',
    lineOff: 'Afficher la ligne',
    bannerAria: 'Installer Casaway',
    bannerTitle: 'Emportez Casaway avec vous',
    bannerBody: 'Installez l’accès rapide aux dépôts de taxi.',
    install: 'Installer',
    dismiss: 'Fermer l’invitation',
    localeLabel: 'Langue',
    themeToLight: 'Passer en mode clair',
    themeToDark: 'Passer en mode sombre',
    locating: 'Recherche des dépôts les plus proches…',
    locationDenied: 'Position indisponible — autorisez la localisation pour « Près de moi ».',
    noResults: 'Aucun dépôt ne correspond. Essayez un autre quartier ou type de taxi.',
  },
  ar: {
    tagline: 'طريقك في الدار البيضاء',
    depotCount: (n) => `${n} محطة على الخريطة`,
    searchLabel: 'ابحث عن محطة أو حي أو وجهة',
    searchPlaceholder: 'ابحث عن محطة، حي، وجهة',
    pillAll: 'الكل',
    pillNear: 'بالقرب مني',
    pillGrand: 'طاكسي كبير',
    pillPetit: 'طاكسي صغير',
    pillDowntown: 'وسط المدينة',
    legendToggle: 'إظهار أو إخفاء مفتاح الخريطة',
    legendTitle: 'مفتاح الخريطة',
    legendMarkers: 'الرموز',
    legendLines: 'خطوط النقل',
    markerGrand: 'محطة طاكسي كبير',
    markerPetit: 'محطة طاكسي صغير',
    markerMixed: 'محطة مختلطة',
    markerYou: 'موقعك',
    lineCoastal: 'الخط الساحلي',
    lineOulfa: 'وصلة أولفا – الميناء',
    lineSouth: 'الحلقة الجنوبية',
    lineOn: 'إخفاء الخط',
    lineOff: 'إظهار الخط',
    bannerAria: 'ثبّت كاساوي',
    bannerTitle: 'خذ كاساوي معك',
    bannerBody: 'ثبّت التطبيق للوصول السريع إلى محطات الطاكسي.',
    install: 'ثبّت',
    dismiss: 'إغلاق الدعوة',
    localeLabel: 'اللغة',
    themeToLight: 'التبديل إلى الوضع الفاتح',
    themeToDark: 'التبديل إلى الوضع الداكن',
    locating: 'جارٍ البحث عن أقرب المحطات…',
    locationDenied: 'تعذّر تحديد الموقع — اسمح بالوصول إلى الموقع لاستخدام «بالقرب مني».',
    noResults: 'لا توجد محطات مطابقة. جرّب حيًا آخر أو نوعًا آخر.',
  },
};

/* -------------------------------------------------------------- helpers */

/** Classic marker classification: bronze fill for mixed "&" depots. */
function markerKind(taxiType = '') {
  if (taxiType.includes('&')) return 'mixed';
  if (/petit/i.test(taxiType) && !/grand/i.test(taxiType)) return 'petit';
  return 'grand';
}

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

function readStoredLocale() {
  try {
    const saved = localStorage.getItem('casaway-locale');
    return LOCALES.some((l) => l.code === saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* private mode */
  }
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** High-contrast minimal basemap per theme. CARTO's raster tiles need a free
 *  key since Sept 2026 (unkeyed = watermark), so the keyless Esri gray
 *  canvases are the default; set VITE_CARTO_KEY for CARTO dark/positron. */
const CARTO_KEY = import.meta.env.VITE_CARTO_KEY || '';
function basemapFor(theme) {
  const osm = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  if (CARTO_KEY) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/${theme === 'light' ? 'light_all' : 'dark_all'}/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
      attribution: `${osm} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    };
  }
  const service =
    theme === 'light' ? 'World_Light_Gray_Base' : 'World_Dark_Gray_Base';
  return {
    url: `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/${service}/MapServer/tile/{z}/{y}/{x}`,
    attribution: `Sources: <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, FAO, NOAA, USGS, ${osm}`,
  };
}

/** Reactive media query (used to keep map controls off the search card).
 *  The initial state already reads matchMedia; the effect only subscribes to
 *  later changes, so no setState runs synchronously inside it. */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Flies the map to a position when it changes (Near Me). */
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 0.6 });
  }, [map, position]);
  return null;
}

/* ------------------------------------------------------------ component */

export default function CasawayApp() {
  const [depots, setDepots] = useState(DEFAULT_DEPOTS);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [userPosition, setUserPosition] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState('');

  const [legendOpen, setLegendOpen] = useState(false);
  const [hiddenLines, setHiddenLines] = useState(() => new Set());
  const [bannerVisible, setBannerVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [locale, setLocale] = useState(readStoredLocale);
  const [theme, setTheme] = useState(readStoredTheme);
  const [logoOk, setLogoOk] = useState(true);

  const deferredPromptRef = useRef(null);
  const localeMenuRef = useRef(null);
  const isWide = useMediaQuery('(min-width: 768px)');

  const tr = STRINGS[locale] ?? STRINGS.en;

  /* classic theme: stamp <html data-theme>, persist, keep theme-color in sync */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* private mode */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f4ee' : '#0b0f19');
  }, [theme]);

  /* follow external theme changes (e.g. the host app's own toggle) */
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const next = root.dataset.theme === 'light' ? 'light' : 'dark';
      setTheme((previous) => (previous === next ? previous : next));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  /* localization: persist choice, drive document language + direction */
  useEffect(() => {
    const root = document.documentElement;
    const previous = { lang: root.lang, dir: root.dir };
    root.lang = locale;
    root.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('casaway-locale', locale);
    } catch {
      /* private mode */
    }
    return () => {
      root.lang = previous.lang;
      root.dir = previous.dir;
    };
  }, [locale]);

  /* fetch live depots from the API, keeping the bundled fallback */
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

  /* PWA install prompt handshake */
  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  /* show the install banner once, unless dismissed or already installed */
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('casaway-install-dismissed') === 'true';
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
      if (dismissed || standalone || installed) return;
    } catch {
      /* private mode */
    }
    const timer = setTimeout(() => setBannerVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [installed]);

  /* auto-clear transient notices */
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  /* close the locale menu on outside click / Escape */
  useEffect(() => {
    if (!localeOpen) return undefined;
    const onPointerDown = (event) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(event.target)) {
        setLocaleOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setLocaleOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [localeOpen]);

  /* --------------------------------------------------------- behaviors */

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setNotice(tr.locationDenied);
      return;
    }
    setNotice(tr.locating);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setNotice('');
      },
      () => {
        setNotice(tr.locationDenied);
        setActiveFilter((current) => (current === 'near' ? 'all' : current));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const handleFilterClick = (id) => {
    setActiveFilter(id);
    if (id === 'near' && !userPosition) requestLocation();
  };

  const toggleLine = (id) =>
    setHiddenLines((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

  /* ------------------------------------------------------------ derived */

  const visibleDepots = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = depots.filter((d) =>
      `${d.name} ${d.district} ${(d.destinations || []).join(' ')}`.toLowerCase().includes(q),
    );

    if (activeFilter === 'grand') list = list.filter((d) => /grand/i.test(d.taxiType));
    else if (activeFilter === 'petit') list = list.filter((d) => /petit/i.test(d.taxiType));
    else if (activeFilter === 'downtown')
      list = list.filter((d) => DOWNTOWN_DISTRICTS.includes(d.district));
    else if (activeFilter === 'near' && userPosition) {
      list = list
        .map((d) => ({ ...d, distanceMeters: haversineMeters(userPosition, d.coordinates) }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 6);
    }

    return list;
  }, [depots, query, activeFilter, userPosition]);

  /* stable marker icons, rebuilt only when the depot list changes
     (recreating divIcons on every render would re-mount the markers) */
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
              html: `<span class="cw-pin cw-pin--${kind}"><span>${depot.id}</span></span>`,
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
        html: '<span class="cw-you"><span class="cw-you-ping"></span><span class="cw-you-dot"></span></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    [],
  );

  const basemap = basemapFor(theme);
  const lineColor = (line) => (theme === 'light' ? line.colorLight : line.color);

  /* ---------------------------------------------------------------- UI */

  return (
    <div className="cw relative flex h-dvh min-h-[420px] flex-col">
      <style>{TOKEN_CSS}</style>

      {/* ---------- top bar: brand, count, theme + localization ---------- */}
      <header className="relative z-20 flex h-16 shrink-0 items-center gap-3.5 border-b border-[var(--line)] bg-[var(--base)] px-4 md:h-[72px] md:px-[22px]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="cw-brand-mark">
            {logoOk ? (
              <img src="/logo.png" alt="Casaway logo" onError={() => setLogoOk(false)} />
            ) : (
              <span>CW</span>
            )}
          </span>
          <div className="cw-brand-copy min-w-0">
            <h1 className="truncate">Casaway</h1>
            <span className="hidden truncate sm:block">{tr.tagline}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="cw-meta hidden md:flex">
            <span className="cw-live-dot" aria-hidden="true" />
            {tr.depotCount(depots.length)}
          </span>

          <button
            type="button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? tr.themeToLight : tr.themeToDark}
            className="cw-icon-btn"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative" ref={localeMenuRef}>
            <button
              type="button"
              onClick={() => setLocaleOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={localeOpen}
              aria-label={tr.localeLabel}
              className="cw-locale"
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              {locale.toUpperCase()}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${localeOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {localeOpen && (
                <motion.div
                  className="cw-locale-menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                >
                  <ul role="listbox" aria-label={tr.localeLabel}>
                    {LOCALES.map((option) => (
                      <li key={option.code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={locale === option.code}
                          onClick={() => {
                            setLocale(option.code);
                            setLocaleOpen(false);
                          }}
                          className={`cw-locale-opt ${locale === option.code ? 'is-on' : ''}`}
                        >
                          <span>{option.label}</span>
                          <small>{option.code}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ---------- map stage ---------- */}
      <main className="relative flex-1 overflow-hidden">
        {/* base layer: high-contrast minimal tiles (z-0) */}
        <div className="absolute inset-0 z-0">
          <MapContainer
            center={CASA_CENTER}
            zoom={12}
            className="h-full w-full"
            zoomControl={false}
            preferCanvas
          >
            <TileLayer
              key={`${theme}:${CARTO_KEY ? 'carto' : 'esri'}`}
              url={basemap.url}
              subdomains="abcd"
              maxZoom={19}
              attribution={basemap.attribution}
            />
            {/* hidden below md so it never sits under the search card */}
            {isWide && <ZoomControl position="topright" />}

            {/* transit network overlays */}
            {TRANSIT_LINES.filter((line) => !hiddenLines.has(line.id)).map((line) => (
              <Polyline
                key={line.id}
                positions={line.path}
                pathOptions={{
                  color: lineColor(line),
                  weight: 4,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            ))}

            {/* depot markers, filtered live by search + pills */}
            {visibleDepots.map((depot) => (
              <Marker
                key={depot.id}
                position={depot.coordinates}
                icon={iconsById.get(depot.id)}
                title={depot.name}
                alt={`${depot.taxiType}: ${depot.name}`}
                eventHandlers={{ click: () => setSelectedId(depot.id) }}
              >
                <Popup maxWidth={280}>
                  <div>
                    <h3 className="popup-title">{depot.name}</h3>
                    <p className="popup-meta">
                      {depot.district} · {depot.taxiType}
                    </p>
                    {selectedId === depot.id && depot.destinations?.length > 0 && (
                      <p className="popup-dest">
                        <span className="popup-eyebrow">Destinations</span>
                        <br />
                        {depot.destinations.join(' · ')}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {userPosition && <Marker position={userPosition} icon={userIcon} alt={tr.markerYou} />}
            <FlyTo position={activeFilter === 'near' ? userPosition : null} />
          </MapContainer>
        </div>

        {/* search card + filter pills (z-10, top-4 inset) */}
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-col gap-3">
          <div className="pointer-events-auto mx-auto flex w-full max-w-xl">
            <label className="cw-search">
              {/* single leading magnifier — no duplicate search icon */}
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tr.searchPlaceholder}
                aria-label={tr.searchLabel}
                autoComplete="off"
                spellCheck="false"
              />
            </label>
          </div>

          <div className="pointer-events-auto mx-auto flex w-full max-w-xl gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.id;
              const Icon = filter.Icon;
              return (
                <motion.button
                  key={filter.id}
                  type="button"
                  onClick={() => handleFilterClick(filter.id)}
                  aria-pressed={active}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`cw-pill shrink-0 ${active ? 'is-on' : ''}`}
                >
                  {Icon && <Icon aria-hidden="true" />}
                  {tr[filter.labelKey]}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {(notice || visibleDepots.length === 0) && (
              <motion.p
                key={notice || 'empty'}
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="cw-notice pointer-events-none mx-auto w-fit max-w-md text-center"
              >
                {notice || tr.noResults}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* floating legend, bottom-left (z-10) */}
        <div
          className={`absolute left-4 z-10 transition-[bottom] duration-300 ${
            bannerVisible ? 'bottom-32 sm:bottom-4' : 'bottom-4'
          }`}
        >
          <button
            type="button"
            onClick={() => setLegendOpen((open) => !open)}
            aria-expanded={legendOpen}
            aria-label={tr.legendToggle}
            className="cw-legend-btn"
          >
            <Layers className="text-[var(--gold)]" aria-hidden="true" />
            {tr.legendTitle}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${legendOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence initial={false}>
            {legendOpen && (
              <motion.div
                layout
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="mt-2 origin-bottom overflow-hidden"
              >
                <div className="cw-legend-card">
                  <ul>
                    <li className="cw-legend-head">{tr.legendMarkers}</li>
                    <li className="cw-legend-row">
                      <span className="cw-dot" aria-hidden="true" />
                      {tr.markerGrand}
                    </li>
                    <li className="cw-legend-row">
                      <span className="cw-dot cw-dot--petit" aria-hidden="true" />
                      {tr.markerPetit}
                    </li>
                    <li className="cw-legend-row">
                      <span className="cw-dot cw-dot--mixed" aria-hidden="true" />
                      {tr.markerMixed}
                    </li>
                    <li className="cw-legend-row">
                      <span className="cw-dot cw-dot--you" aria-hidden="true" />
                      {tr.markerYou}
                    </li>

                    <li className="cw-legend-head cw-legend-lines">{tr.legendLines}</li>
                    {TRANSIT_LINES.map((line) => {
                      const hidden = hiddenLines.has(line.id);
                      return (
                        <li key={line.id}>
                          <button
                            type="button"
                            onClick={() => toggleLine(line.id)}
                            aria-pressed={!hidden}
                            aria-label={hidden ? tr.lineOff : tr.lineOn}
                            title={hidden ? tr.lineOff : tr.lineOn}
                            className={`cw-legend-row cw-legend-toggle ${hidden ? 'is-off' : ''}`}
                          >
                            <span
                              className="cw-line-swatch"
                              style={{ backgroundColor: lineColor(line) }}
                              aria-hidden="true"
                            />
                            <span className="name">{tr[line.nameKey]}</span>
                            {hidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PWA install banner (z-20, dismissible) */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex justify-center">
          <AnimatePresence>
            {bannerVisible && (
              <motion.div
                role="dialog"
                aria-label={tr.bannerAria}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="cw-banner pointer-events-auto"
              >
                <div className="min-w-0 flex-1">
                  <strong>{tr.bannerTitle}</strong>
                  <span className="cw-banner-hint">{tr.bannerBody}</span>
                </div>
                <button type="button" onClick={confirmInstall} className="cw-install">
                  {tr.install}
                </button>
                <button
                  type="button"
                  onClick={dismissBanner}
                  aria-label={tr.dismiss}
                  className="cw-dismiss-x"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
