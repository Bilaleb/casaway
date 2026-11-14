/**
 * Centralized Casaway dataset.
 *
 * Canonical bundled fallback used when /api/stations is unreachable.
 * Kept in its own module so map, sidebar, and hooks import the same
 * source of truth without duplicating the 20-depot list.
 */

export const DEFAULT_DEPOTS = [
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

/** High-contrast minimal basemap per theme. CARTO raster tiles need a free
 *  key since Sept 2026 (unkeyed = watermark), so the keyless Esri gray
 *  canvases are the default; set VITE_CARTO_KEY for CARTO dark/positron. */
export const CARTO_KEY = import.meta.env.VITE_CARTO_KEY || '';
export function basemapFor(theme) {
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

export const CASA_CENTER = [33.5731, -7.5898];

export const TRANSIT_LINES = [
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

export const DOWNTOWN_DISTRICTS = ['Centre Ville', 'Casa-Port', 'Casa-Voyageurs', 'Derb Omar'];

export const TAXI_FILTERS = [
  { id: 'all', labelKey: 'pillAll' },
  { id: 'grand', labelKey: 'pillGrand' },
  { id: 'petit', labelKey: 'pillPetit' },
  { id: 'downtown', labelKey: 'pillDowntown' },
];

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

export const STRINGS = {
  en: {
    tagline: 'Your Casa, your way',
    depotCount: (n) => `${n} stations mapped`,
    atlasLabel: 'Casa / Mobility atlas',
    heroTitle: 'Find your next taxi.',
    heroBody:
      'Use the search box or station list to locate taxi hubs across Casablanca.',
    menuLabel: 'Show or hide the station panel',
    searchToggle: 'Search stations',
    mapLabel: 'Map of Casablanca taxi stations',
    mapReset: 'Reset map view',
    mapLocate: 'Center map on Casablanca',
    destinationsLabel: 'Destinations',
    showDestinations: 'Show destinations',
    hideDestinations: 'Hide destinations',
    travelWalkingTime: '15–30 min',
    travelDrivingTime: '5–15 min',
    travelTransitNote: 'available nearby',
    kmFromYou: (km) => `${km} km from you`,
    footer:
      'Casaway is an independent open-source project and is not affiliated with Casa Transport or local transit authorities.',
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
    travelOptions: 'Getting there',
    travelWalking: 'Walk',
    travelDriving: 'Drive/taxi',
    travelTransit: 'Bus/tram',
    travelTime: 'Est. time',
    travelNote: 'How to get there',
  },
  fr: {
    tagline: 'Votre Casa, à votre façon',
    depotCount: (n) => `${n} stations cartographiées`,
    atlasLabel: 'Casa / Atlas de la mobilité',
    heroTitle: 'Trouvez votre prochain taxi.',
    heroBody:
      'Utilisez la recherche ou la liste des stations pour trouver les dépôts de taxis de Casablanca.',
    menuLabel: 'Afficher ou masquer le panneau des stations',
    searchToggle: 'Rechercher une station',
    mapLabel: 'Carte des stations de taxi de Casablanca',
    mapReset: 'Réinitialiser la carte',
    mapLocate: 'Centrer sur Casablanca',
    destinationsLabel: 'Destinations',
    showDestinations: 'Afficher les destinations',
    hideDestinations: 'Masquer les destinations',
    travelWalkingTime: '15–30 min',
    travelDrivingTime: '5–15 min',
    travelTransitNote: 'à proximité',
    kmFromYou: (km) => `${km} km de vous`,
    footer:
      'Casaway est un projet open source indépendant, sans affiliation avec Casa Transport ni les autorités de transport locales.',
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
    legendLines: 'Lignes de transport',
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
    bannerTitle: 'Prenez Casaway avec vous',
    bannerBody: 'Installez-vous pour un accès rapide aux dépôts.',
    install: 'Installer',
    dismiss: "Fermer l'invitation",
    localeLabel: 'Langue',
    themeToLight: 'Passer en mode clair',
    themeToDark: 'Passer en mode sombre',
    locating: 'Trouver vos dépôts les plus proches…',
    locationDenied: "Emplacement indisponible — autorisez l'accès localisation pour utiliser Near Me.",
    noResults: "Aucun dépôt ne correspond à cette recherche. Essayez un autre quartier ou type de taxi.",
    travelOptions: "Comment s'y rendre",
    travelWalking: 'Marche',
    travelDriving: 'Voiture/taxi',
    travelTransit: 'Bus/tram',
    travelTime: 'Temps estimé',
    travelNote: "Comment s'y rendre",
  },
  ar: {
    tagline: 'كازا بطريقتك',
    depotCount: (n) => `${n} محطة على الخريطة`,
    atlasLabel: 'كازا / أطلس التنقل',
    heroTitle: 'اعثر على أقرب طاكسي.',
    heroBody:
      'استعمل خانة البحث أو قائمة المحطات للعثور على محطات الطاكسي في الدار البيضاء.',
    menuLabel: 'إظهار أو إخفاء لوحة المحطات',
    searchToggle: 'البحث عن محطة',
    mapLabel: 'خريطة محطات الطاكسي في الدار البيضاء',
    mapReset: 'إعادة ضبط الخريطة',
    mapLocate: 'التمركز على الدار البيضاء',
    destinationsLabel: 'الوجهات',
    showDestinations: 'إظهار الوجهات',
    hideDestinations: 'إخفاء الوجهات',
    travelWalkingTime: '15–30 دقيقة',
    travelDrivingTime: '5–15 دقيقة',
    travelTransitNote: 'متوفرة بالقرب',
    kmFromYou: (km) => `${km} كم من موقعك`,
    footer:
      'كازاوي مشروع مفتوح المصدر ومستقل، غير مرتبط بشركة كازا ترانسپور أو سلطات النقل المحلية.',
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
    travelOptions: 'كيف تصل إلى هناك',
    travelWalking: 'مشي',
    travelDriving: 'سيارة/طاكسي',
    travelTransit: 'حافلة/ترام',
    travelTime: 'الوقت المقدر',
    travelNote: 'كيف تصل إلى المحطة',
  },
};
