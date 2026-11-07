const MESSAGES = {
  en: {
    pageTitle: 'Casaway - Your Way Through Casablanca', language: 'Language',
    disclaimer: 'Casaway is an independent open-source project and is not affiliated with Casa Transport or local transit authorities.',
    tagline: 'Your Casa Your Way', menuToggle: 'Toggle depot explorer',
    themeToLight: 'Switch to light mode', themeToDark: 'Switch to dark mode',
    depotCount: (count) => `${count} depots mapped`, findTaxi: 'Find your next taxi.',
    sidebarDescription: 'Depots, destinations and route traces across Casablanca.',
    stationSearch: 'Search depots by name or district', stationPlaceholder: 'Search depot or district',
    taxiType: 'Taxi type', allDepots: 'All depots', grandTaxi: 'Grand taxi', petitTaxi: 'Petit taxi',
    noResults: 'No depots match this search.', routeDetails: 'Route details', routeTrace: 'Route trace',
    selectRoute: 'Select a route', loadingRoutes: 'Loading route catalogue…',
    fareCalculator: 'Fare calculator', dayRate: 'DAY RATE', nightRate: 'NIGHT RATE',
    day: 'Day', nightPlus50: 'Night +50%', dayFare: 'Day fare', nightFare: 'Night fare',
    seats: 'Seats', seat: 'seat', seatsPlural: 'seats', seatCount: (count) => `${count} ${count === 1 ? 'seat' : 'seats'}`, passengerSeats: 'Passenger seats (1 to 6)',
    rateSelection: 'Day or night rate', grandTaxiFare: 'Grand taxi fare',
    fareNotListed: 'Official fare not listed for this depot yet.', perSeat: 'Per seat',
    totalSeats: (count) => `Total · ${count} ${count === 1 ? 'seat' : 'seats'}`,
    courssaFullTaxi: (count) => `Courssa · full taxi (${count} seats)`, regulatedRange: 'Estimated range',
    pickDepotFare: 'Pick a depot to calculate its fare — 6 seats per grand taxi.',
    regulatedFareNote: (distance, minutes) => `Estimated fare, not exact · night rate after 20:00 · about ${distance} km ≈ ${minutes} min`,
    fareDisclaimer: 'Prices are estimates, not exact fares. Actual prices may differ.',
    courssaNote: (count) => `Courssa = all ${count} seats · night rate after 20:00`, distanceUnknown: 'distance unknown',
    mapLabel: 'Map of Casablanca taxi depots', mapSearch: 'Search depots, districts or destinations',
    mapSearchPlaceholder: 'Search depots, districts, destinations', findNearMe: 'Find near me',
    resetMap: 'Reset map view', selectionDetails: 'Selection details', selection: 'Selection',
    details: 'Details', closeDetails: 'Close details panel', reportIssue: 'Report a route or depot issue',
    installLabel: 'Install Casaway', installTitle: 'Take Casaway with you',
    installHint: 'Install for quick access to taxi depots.', install: 'Install', dismissInstall: 'Dismiss install prompt',
    routeName: 'Route name', depotName: 'Depot name', district: 'District',
    trajectory: 'Trajectory GeoJSON', editRoute: 'Edit route', deleteTrace: 'Delete trace',
    saveRoute: 'Save route', cancel: 'Cancel', origin: 'Origin', destination: 'Destination',
    distance: 'Distance', duration: 'Duration', majorStops: 'Major stops', unavailable: 'Not available',
    confirmDelete: (name) => `Permanently delete the route trace “${name}”? This cannot be undone.`,
    tokenPrompt: 'Enter the route write token to continue:',
    invalidGeoJson: 'Trajectory must be valid GeoJSON with at least two coordinates.',
    routeSaved: 'Route updated.', routeDeleted: 'Route trace deleted.',
    routeWriteFailed: 'Could not save this route. Check the token and try again.',
    feedbackTitle: 'Report a route or depot update', feedbackIntro: 'Spotted a closed depot, a renamed depot or a wrong route? Send a community report.',
    communityCheck: 'Community check', feedbackKind: 'What is wrong?', feedbackSubject: 'Depot or route',
    subjectPlaceholder: 'e.g. Depot Casa-Port', detailsPlaceholder: 'Describe what changed on the ground…', emailPlaceholder: 'you@example.com',
    routeUpdateOption: 'Route update', stationCorrectionOption: 'Incorrect depot data',
    missingStationOption: 'Missing depot', otherOption: 'Something else',
    feedbackDetails: 'Details', required: 'Required',
    feedbackEmail: 'Email', optional: 'Optional', sendReport: 'Send report',
    sendingReport: 'Sending…', reportSent: 'Thanks — your report was sent.',
    reportsSent: (count) => `Thanks — your report and ${count} queued report${count === 1 ? '' : 's'} were sent.`,
    reportQueued: 'You appear to be offline — your report is saved and will be sent automatically.',
    noTrajectory: 'This depot has no stored trajectory yet.', loadingTrace: 'Loading route trace…',
    traceLoaded: (distance) => `Trace loaded · ${distance} · illustrative geometry, not an official itinerary.`,
    destinations: 'Destinations', start: 'Start', end: 'End', showDirections: 'Show directions',
    showDirectionsTo: (name) => `Show directions to ${name} on the map`, minutes: 'min',
    mixedTaxi: 'Grand & Petit Taxi', largeTaxi: 'Large taxi', smallTaxi: 'Small taxi',
    grandTaxiHub: 'Grand taxi hub', regionalTaxi: 'Regional grand taxi',
    availableTaxiOptions: 'Available taxi options', comingSoon: ' soon', depot: 'Depot',
    reportRouteIssue: 'Report an issue with this route', reportDepotIssue: 'Report incorrect data for this depot',
    directionsTo: (name) => `Directions to ${name}`, directionsOnMap: 'Show directions on map',
    destinationsFrom: 'Destinations from this depot', durationEstimate: (stops) => `Duration estimated at the 22 km/h city average${stops ? ` · serves ${stops}` : ''} · traces are illustrative, not official itineraries.`,
    routesLoaded: (routeCount, depotCount) => `${routeCount} route traces · ${depotCount} depots loaded from the Casaway API.`,
    offlineSnapshot: (savedAt) => `Offline — showing the snapshot saved ${savedAt}.`,
    apiUnavailable: 'The route API is unreachable and no snapshot exists. Showing the bundled depot list.',
    startupFailed: (error) => `Casaway could not start: ${error}`,
  },
  fr: {
    pageTitle: 'Casaway - Vos trajets à Casablanca', language: 'Langue',
    disclaimer: 'Casaway est un projet libre et indépendant, sans affiliation avec Casa Transport ni les autorités locales.',
    tagline: 'Casa, à votre façon', menuToggle: 'Ouvrir ou fermer les dépôts',
    themeToLight: 'Passer en mode clair', themeToDark: 'Passer en mode sombre',
    depotCount: (count) => `${count} dépôts cartographiés`, findTaxi: 'Trouvez votre taxi.',
    sidebarDescription: 'Dépôts, destinations et itinéraires de taxi à Casablanca.',
    stationSearch: 'Rechercher par dépôt ou quartier', stationPlaceholder: 'Dépôt ou quartier',
    taxiType: 'Type de taxi', allDepots: 'Tous les dépôts', grandTaxi: 'Grand taxi', petitTaxi: 'Petit taxi',
    noResults: 'Aucun dépôt ne correspond à cette recherche.', routeDetails: 'Détails de l’itinéraire', routeTrace: 'Tracé du trajet',
    selectRoute: 'Choisir un itinéraire', loadingRoutes: 'Chargement des itinéraires…',
    fareCalculator: 'Calcul du tarif', dayRate: 'TARIF DE JOUR', nightRate: 'TARIF DE NUIT',
    day: 'Jour', nightPlus50: 'Nuit +50 %', dayFare: 'Tarif de jour', nightFare: 'Tarif de nuit',
    seats: 'Places', seat: 'place', seatsPlural: 'places', seatCount: (count) => `${count} ${count === 1 ? 'place' : 'places'}`, passengerSeats: 'Nombre de places (1 à 6)',
    rateSelection: 'Tarif de jour ou de nuit', grandTaxiFare: 'Tarif du grand taxi',
    fareNotListed: 'Tarif officiel non renseigné pour ce dépôt.', perSeat: 'Par place',
    totalSeats: (count) => `Total · ${count} ${count === 1 ? 'place' : 'places'}`,
    courssaFullTaxi: (count) => `Courssa · taxi complet (${count} places)`, regulatedRange: 'Fourchette estimée',
    pickDepotFare: 'Choisissez un dépôt pour calculer le tarif · 6 places par grand taxi.',
    regulatedFareNote: (distance, minutes) => `Tarif estimé, non exact · nuit après 20 h · environ ${distance} km ≈ ${minutes} min`,
    fareDisclaimer: 'Les prix sont des estimations, pas des tarifs exacts. Le prix réel peut varier.',
    courssaNote: (count) => `Courssa = les ${count} places · tarif de nuit après 20 h`, distanceUnknown: 'distance inconnue',
    mapLabel: 'Carte des dépôts de taxi de Casablanca', mapSearch: 'Rechercher un dépôt, un quartier ou une destination',
    mapSearchPlaceholder: 'Dépôt, quartier, destination', findNearMe: 'Près de moi',
    resetMap: 'Recentrer la carte', selectionDetails: 'Détails de la sélection', selection: 'Sélection',
    details: 'Détails', closeDetails: 'Fermer le panneau de détails', reportIssue: 'Signaler un itinéraire ou un dépôt',
    installLabel: 'Installer Casaway', installTitle: 'Emportez Casaway',
    installHint: 'Installez l’application pour accéder rapidement aux dépôts.', install: 'Installer', dismissInstall: 'Fermer la suggestion',
    routeName: 'Nom de l’itinéraire', depotName: 'Nom du dépôt', district: 'Quartier',
    trajectory: 'GéoJSON du trajet', editRoute: 'Modifier le trajet', deleteTrace: 'Supprimer le tracé',
    saveRoute: 'Enregistrer', cancel: 'Annuler', origin: 'Départ', destination: 'Destination',
    distance: 'Distance', duration: 'Durée', majorStops: 'Arrêts principaux', unavailable: 'Indisponible',
    confirmDelete: (name) => `Supprimer définitivement le tracé « ${name} » ? Cette action est irréversible.`,
    tokenPrompt: 'Saisissez le jeton de modification des itinéraires :',
    invalidGeoJson: 'Le trajet doit être un GéoJSON valide avec au moins deux coordonnées.',
    routeSaved: 'Itinéraire modifié.', routeDeleted: 'Tracé supprimé.',
    routeWriteFailed: 'Modification impossible. Vérifiez le jeton et réessayez.',
    feedbackTitle: 'Signaler une mise à jour d’itinéraire ou de dépôt', feedbackIntro: 'Dépôt fermé, renommé ou trajet incorrect ? Envoyez un signalement.',
    communityCheck: 'Signalement citoyen', feedbackKind: 'Quel est le problème ?', feedbackSubject: 'Dépôt ou itinéraire',
    subjectPlaceholder: 'Ex. dépôt Casa-Port', detailsPlaceholder: 'Décrivez le changement observé…', emailPlaceholder: 'vous@exemple.com',
    routeUpdateOption: 'Mise à jour d’itinéraire', stationCorrectionOption: 'Donnée de dépôt incorrecte',
    missingStationOption: 'Dépôt manquant', otherOption: 'Autre',
    feedbackDetails: 'Détails', required: 'Obligatoire',
    feedbackEmail: 'E-mail', optional: 'Facultatif', sendReport: 'Envoyer le signalement',
    sendingReport: 'Envoi…', reportSent: 'Merci, votre signalement a été envoyé.',
    reportsSent: (count) => `Merci, votre signalement et ${count} signalement${count === 1 ? '' : 's'} en attente ont été envoyés.`,
    reportQueued: 'Vous semblez hors ligne — votre signalement est enregistré et sera envoyé automatiquement.',
    noTrajectory: 'Aucun tracé enregistré pour ce dépôt.', loadingTrace: 'Chargement du tracé…',
    traceLoaded: (distance) => `Tracé chargé · ${distance} · géométrie indicative, itinéraire non officiel.`,
    destinations: 'Destinations', start: 'Départ', end: 'Arrivée', showDirections: 'Afficher l’itinéraire',
    showDirectionsTo: (name) => `Afficher l’itinéraire vers ${name} sur la carte`, minutes: 'min',
    mixedTaxi: 'Grand et petit taxis', largeTaxi: 'Grand taxi', smallTaxi: 'Petit taxi',
    grandTaxiHub: 'Station de grands taxis', regionalTaxi: 'Grand taxi régional',
    availableTaxiOptions: 'Options de taxi disponibles', comingSoon: ' bientôt', depot: 'Dépôt',
    reportRouteIssue: 'Signaler un problème avec cet itinéraire', reportDepotIssue: 'Signaler une donnée incorrecte pour ce dépôt',
    directionsTo: (name) => `Itinéraire vers ${name}`, directionsOnMap: 'Afficher l’itinéraire sur la carte',
    destinationsFrom: 'Destinations depuis ce dépôt', durationEstimate: (stops) => `Durée estimée à la vitesse moyenne de 22 km/h${stops ? ` · dessert ${stops}` : ''} · tracés indicatifs, non officiels.`,
    routesLoaded: (routeCount, depotCount) => `${routeCount} tracés · ${depotCount} dépôts chargés depuis l’API Casaway.`,
    offlineSnapshot: (savedAt) => `Hors ligne — instantané enregistré le ${savedAt}.`,
    apiUnavailable: 'API des itinéraires inaccessible, aucun instantané disponible. Liste locale des dépôts affichée.',
    startupFailed: (error) => `Casaway n’a pas pu démarrer : ${error}`,
  },
  ar: {
    pageTitle: 'كازاوي - تنقلاتك في الدار البيضاء', language: 'اللغة',
    disclaimer: 'كازاوي مشروع مستقل ومفتوح المصدر، ولا يرتبط بشركة كازا ترانسبور أو السلطات المحلية.',
    tagline: 'كازا بطريقتك', menuToggle: 'إظهار أو إخفاء المحطات',
    themeToLight: 'التبديل إلى الوضع الفاتح', themeToDark: 'التبديل إلى الوضع الداكن',
    depotCount: (count) => `${count} محطة على الخريطة`, findTaxi: 'اعثر على سيارة أجرة.',
    sidebarDescription: 'محطات سيارات الأجرة والوجهات والمسارات في الدار البيضاء.',
    stationSearch: 'ابحث باسم المحطة أو الحي', stationPlaceholder: 'المحطة أو الحي',
    taxiType: 'نوع سيارة الأجرة', allDepots: 'كل المحطات', grandTaxi: 'طاكسي كبير', petitTaxi: 'طاكسي صغير',
    noResults: 'لا توجد محطات تطابق هذا البحث.', routeDetails: 'تفاصيل المسار', routeTrace: 'مسار الرحلة',
    selectRoute: 'اختر مسارًا', loadingRoutes: 'جارٍ تحميل المسارات…',
    fareCalculator: 'حساب الأجرة', dayRate: 'أجرة النهار', nightRate: 'أجرة الليل',
    day: 'نهارًا', nightPlus50: 'ليلًا ‎+٥٠٪', dayFare: 'أجرة النهار', nightFare: 'أجرة الليل',
    seats: 'المقاعد', seat: 'مقعد', seatsPlural: 'مقاعد', seatCount: (count) => `${count} مقاعد`, passengerSeats: 'عدد المقاعد (١ إلى ٦)',
    rateSelection: 'أجرة النهار أو الليل', grandTaxiFare: 'أجرة الطاكسي الكبير',
    fareNotListed: 'السعر الرسمي غير متوفر لهذه المحطة بعد.', perSeat: 'للمقعد الواحد',
    totalSeats: (count) => `المجموع · ${count} مقاعد`,
    courssaFullTaxi: (count) => `كورصة · الطاكسي كاملًا (${count} مقاعد)`, regulatedRange: 'نطاق تقديري',
    pickDepotFare: 'اختر محطة لحساب الأجرة · ٦ مقاعد للطاكسي الكبير.',
    regulatedFareNote: (distance, minutes) => `أجرة تقديرية وليست دقيقة · أجرة الليل بعد ٢٠:٠٠ · نحو ${distance} كم و${minutes} دقيقة`,
    fareDisclaimer: 'الأسعار تقديرية وليست دقيقة. قد يختلف السعر الفعلي.',
    courssaNote: (count) => `كورصة = جميع المقاعد وعددها ${count} · أجرة الليل بعد ٢٠:٠٠`, distanceUnknown: 'المسافة غير معروفة',
    mapLabel: 'خريطة محطات سيارات الأجرة في الدار البيضاء', mapSearch: 'ابحث عن محطة أو حي أو وجهة',
    mapSearchPlaceholder: 'المحطة، الحي، الوجهة', findNearMe: 'بالقرب مني',
    resetMap: 'إعادة توسيط الخريطة', selectionDetails: 'تفاصيل الاختيار', selection: 'الاختيار',
    details: 'التفاصيل', closeDetails: 'إغلاق لوحة التفاصيل', reportIssue: 'الإبلاغ عن مسار أو محطة',
    installLabel: 'تثبيت كازاوي', installTitle: 'اصطحب كازاوي معك',
    installHint: 'ثبّت التطبيق للوصول السريع إلى المحطات.', install: 'تثبيت', dismissInstall: 'إغلاق تلميح التثبيت',
    routeName: 'اسم المسار', depotName: 'اسم المحطة', district: 'الحي',
    trajectory: 'بيانات GeoJSON للمسار', editRoute: 'تعديل المسار', deleteTrace: 'حذف المسار',
    saveRoute: 'حفظ المسار', cancel: 'إلغاء', origin: 'نقطة الانطلاق', destination: 'الوجهة',
    distance: 'المسافة', duration: 'المدة', majorStops: 'المحطات الرئيسية', unavailable: 'غير متاح',
    confirmDelete: (name) => `هل تريد حذف مسار «${name}» نهائيًا؟ لا يمكن التراجع عن ذلك.`,
    tokenPrompt: 'أدخل رمز تعديل المسارات للمتابعة:',
    invalidGeoJson: 'يجب أن يكون المسار بصيغة GeoJSON صحيحة وبإحداثيين على الأقل.',
    routeSaved: 'تم تعديل المسار.', routeDeleted: 'تم حذف المسار.',
    routeWriteFailed: 'تعذر حفظ المسار. تحقق من الرمز ثم حاول مجددًا.',
    feedbackTitle: 'الإبلاغ عن تحديث لمسار أو محطة', feedbackIntro: 'هل المحطة مغلقة أو تغيّر اسمها أو المسار غير صحيح؟ أرسل بلاغًا.',
    communityCheck: 'مساهمة مجتمعية', feedbackKind: 'ما المشكلة؟', feedbackSubject: 'المحطة أو المسار',
    subjectPlaceholder: 'مثال: محطة كازا بورت', detailsPlaceholder: 'صف التغيير الذي لاحظته…', emailPlaceholder: 'you@example.com',
    routeUpdateOption: 'تحديث مسار', stationCorrectionOption: 'بيانات محطة غير صحيحة',
    missingStationOption: 'محطة غير موجودة', otherOption: 'شيء آخر',
    feedbackDetails: 'التفاصيل', required: 'مطلوب',
    feedbackEmail: 'البريد الإلكتروني', optional: 'اختياري', sendReport: 'إرسال البلاغ',
    sendingReport: 'جارٍ الإرسال…', reportSent: 'شكرًا، تم إرسال بلاغك.',
    reportsSent: (count) => `شكرًا، تم إرسال بلاغك و${count} بلاغات أخرى محفوظة.`,
    reportQueued: 'يبدو أنك غير متصل — تم حفظ البلاغ وسيُرسل تلقائيًا.',
    noTrajectory: 'لا يوجد مسار محفوظ لهذه المحطة بعد.', loadingTrace: 'جارٍ تحميل المسار…',
    traceLoaded: (distance) => `تم تحميل المسار · ${distance} · مسار توضيحي غير رسمي.`,
    destinations: 'الوجهات', start: 'البداية', end: 'النهاية', showDirections: 'اعرض الاتجاهات',
    showDirectionsTo: (name) => `اعرض الاتجاهات إلى ${name} على الخريطة`, minutes: 'دقيقة',
    mixedTaxi: 'طاكسي كبير وصغير', largeTaxi: 'طاكسي كبير', smallTaxi: 'طاكسي صغير',
    grandTaxiHub: 'محطة الطاكسي الكبير', regionalTaxi: 'طاكسي كبير للجهات',
    availableTaxiOptions: 'خيارات سيارات الأجرة المتاحة', comingSoon: ' قريبًا', depot: 'المحطة',
    reportRouteIssue: 'الإبلاغ عن مشكلة في هذا المسار', reportDepotIssue: 'الإبلاغ عن بيانات غير صحيحة لهذه المحطة',
    directionsTo: (name) => `الاتجاهات إلى ${name}`, directionsOnMap: 'اعرض الاتجاهات على الخريطة',
    destinationsFrom: 'الوجهات من هذه المحطة', durationEstimate: (stops) => `المدة المقدرة بمتوسط سرعة ٢٢ كم/ساعة${stops ? ` · يمر عبر ${stops}` : ''} · المسارات توضيحية وليست رسمية.`,
    routesLoaded: (routeCount, depotCount) => `${routeCount} مسارًا · تم تحميل ${depotCount} محطة من واجهة كازاوي.`,
    offlineSnapshot: (savedAt) => `أنت غير متصل · تعرض نسخة محفوظة بتاريخ ${savedAt}.`,
    apiUnavailable: 'واجهة المسارات غير متاحة ولا توجد نسخة محفوظة. يتم عرض قائمة المحطات المحلية.',
    startupFailed: (error) => `تعذر تشغيل كازاوي: ${error}`,
  },
}

const PLACE_TRANSLATIONS = {
  fr: {
    'Place de la Concorde (L-Hammam / Bd Lalla Yacout)': 'Place de la Concorde (L-Hammam / boulevard Lalla Yacout)',
    'Dépôt Casa-Port': 'Dépôt Casa-Port',
    'Dépôt Casa-Voyageurs': 'Dépôt Casa-Voyageurs',
    'Dépôt Garage Allal (Derb Sultan)': 'Dépôt Garage Allal (Derb Sultan)',
    'Dépôt Rond-Point Bachkou': 'Dépôt Rond-Point Bachkou',
    'Dépôt L-Oulfa (Terminus / Bd Moulay Rachid)': 'Dépôt de L’Oulfa (terminus / boulevard Moulay Rachid)',
    'Dépôt Sidi Bernoussi (Bd Imam Ali)': 'Dépôt Sidi Bernoussi (boulevard Imam Ali)',
    'Near University': 'Près de l’université',
    'Grand taxi hub': 'Station de grands taxis',
    'Regional routes': 'Lignes régionales',
    'Zone Industrielle': 'Zone industrielle',
    'Dépôt Ain Sebaa (L-Gara / Near Train Station)': 'Dépôt Ain Sebaa (Gare / près de la gare)',
    'Dépôt Hay Hassani (SOUK / Terminus)': 'Dépôt Hay Hassani (Souk / terminus)',
    "Dépôt Lissasfa (Route d'El Jadida / Rond Point)": 'Dépôt Lissasfa (Route d’El Jadida / rond-point)',
    'Dépôt Sidi Moumen (Terminus Tramway Anassi)': 'Dépôt Sidi Moumen (Terminus du tramway Anassi)',
    'Dépôt Maarif (Bd Bir Anzarane / Twin Center)': 'Dépôt du Maârif (boulevard Bir Anzarane / Twin Center)',
    'Dépôt Derb Omar / Bd Mohammed V': 'Dépôt Derb Omar / boulevard Mohammed V',
    'Dépôt Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)': 'Dépôt Hay Mohammadi (place Bouchentouf / boulevard Ali Yata)',
    'Dépôt Sbata (Rond Point Jamila)': 'Dépôt Sbata (rond-point Jamila)',
    'Dépôt Tit Mellil (Centre)': 'Dépôt Tit Mellil (centre)',
    'Dépôt Ain Chock (Bd Baghdad / Near Faculté)': 'Dépôt Ain Chock (Bd Baghdad / près de la faculté)',
    'Dépôt Errahma (Ville Nouvelle / Main Roundabout)': 'Dépôt Errahma (Ville nouvelle / rond-point principal)',
    'Dépôt Sidi Maalouf (Near Technopark)': 'Dépôt Sidi Maalouf (près du Technopark)',
    'Dépôt Sidi Bernoussi - Tram Terminus': 'Dépôt Sidi Bernoussi - Terminus du tramway',
    'Centre Ville': 'Centre-ville',
  },
  ar: {
    'Place de la Concorde (L-Hammam / Bd Lalla Yacout)': 'ساحة الكونكورد (الحمام / شارع للا الياقوت)',
    'Dépôt Casa-Port': 'محطة كازا بورت',
    'Dépôt Casa-Voyageurs': 'محطة الدار البيضاء المسافرين',
    'Dépôt Garage Allal (Derb Sultan)': 'محطة كراج علال (درب السلطان)',
    'Dépôt Rond-Point Bachkou': 'محطة مدار باشكو',
    'Dépôt L-Oulfa (Terminus / Bd Moulay Rachid)': 'محطة الألفة (المحطة النهائية / شارع مولاي رشيد)',
    'Dépôt Sidi Bernoussi (Bd Imam Ali)': 'محطة سيدي البرنوصي (شارع الإمام علي)',
    'Dépôt Ain Sebaa (L-Gara / Near Train Station)': 'محطة عين السبع (الكَار / قرب محطة القطار)',
    'Dépôt Maarif (Bd Bir Anzarane / Twin Center)': 'محطة المعاريف (شارع بئر أنزران / توين سنتر)',
    'Dépôt Hay Hassani (SOUK / Terminus)': 'محطة الحي الحسني (السوق / المحطة النهائية)',
    "Dépôt Lissasfa (Route d'El Jadida / Rond Point)": 'محطة ليساسفة (طريق الجديدة / المدار)',
    'Dépôt Derb Omar / Bd Mohammed V': 'محطة درب عمر / شارع محمد الخامس',
    'Dépôt Sidi Moumen (Terminus Tramway Anassi)': 'محطة سيدي مومن (نهاية ترامواي أناسي)',
    'Dépôt Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)': 'محطة الحي المحمدي (ساحة بوشنتوف / شارع علي يعتة)',
    'Dépôt Sbata (Rond Point Jamila)': 'محطة سباتة (مدار جميلة)',
    'Dépôt Ain Chock (Bd Baghdad / Near Faculté)': 'محطة عين الشق (شارع بغداد / قرب الكلية)',
    'Dépôt Errahma (Ville Nouvelle / Main Roundabout)': 'محطة الرحمة (المدينة الجديدة / المدار الرئيسي)',
    'Dépôt Tit Mellil (Centre)': 'محطة تيط مليل (المركز)',
    'Dépôt Sidi Maalouf (Near Technopark)': 'محطة سيدي معروف (قرب تكنوبارك)',
    'Dépôt Sidi Bernoussi - Tram Terminus': 'محطة سيدي البرنوصي - نهاية الترامواي',
    'Centre Ville': 'وسط المدينة', 'Oulfa': 'الألفة', 'Maarif': 'المعاريف', 'Ain Diab': 'عين الذئاب',
    'Ain Sebaa': 'عين السبع', 'Sidi Bernoussi': 'سيدي البرنوصي', 'Mohammedia': 'المحمدية',
    'Hay Mohammadi': 'الحي المحمدي', 'Derb Sultan': 'درب السلطان', 'Mediouna': 'مديونة',
    'Tit Mellil': 'تيط مليل', 'Bouskoura': 'بوسكورة', 'Bachkou': 'باشكو', 'Near University': 'قرب الجامعة',
    'Lissasfa': 'ليساسفة', 'Azemmour': 'أزمور', 'Had Soualem': 'حد السوالم', 'Errahma': 'الرحمة',
    'Grand taxi hub': 'محطة الطاكسي الكبير', 'Twin Center': 'توين سنتر', 'Regional routes': 'الخطوط الجهوية',
    'Derb Omar': 'درب عمر', 'Casa-Voyageurs': 'الدار البيضاء المسافرين', 'Bernoussi': 'البرنوصي',
    'Garage Allal': 'كراج علال', 'Sbata': 'سباتة', 'Ain Chock': 'عين الشق', 'Shorex': 'شوريكس',
    'Zenith': 'زينيت', 'Zone Industrielle': 'المنطقة الصناعية', 'Hay Hassani': 'الحي الحسني',
    'Sidi Moumen': 'سيدي مومن', 'Sidi Maalouf': 'سيدي معروف',
  },
}

const STORAGE_KEY = 'casaway-locale'

export function setupI18n() {
  const selector = document.querySelector('#language-select')
  let locale = 'en'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (Object.hasOwn(MESSAGES, saved)) locale = saved
  } catch { /* private browsing */ }

  function t(key, ...args) {
    if (key === 'taxiTypeName') {
      return String(args[0] ?? '')
        .replace(/Petit Taxi & Grand Taxi Hub/gi, `${t('petitTaxi')} & ${t('grandTaxiHub')}`)
        .replace(/Petit Taxi & Regional Grand Taxi/gi, `${t('petitTaxi')} & ${t('regionalTaxi')}`)
        .replace(/Regional Grand Taxi/gi, t('regionalTaxi'))
        .replace(/Grand & Petit Taxi/gi, t('mixedTaxi'))
        .replace(/Grand Taxi/gi, t('grandTaxi'))
        .replace(/Petit Taxi/gi, t('petitTaxi'))
    }
    if (key === 'placeName') {
      const place = String(args[0] ?? '')
      return PLACE_TRANSLATIONS[locale]?.[place] || place
    }
    const value = MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key
    return typeof value === 'function' ? value(...args) : value
  }

  function apply(nextLocale, persist = true) {
    locale = Object.hasOwn(MESSAGES, nextLocale) ? nextLocale : 'en'
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.title = t('pageTitle')
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n)
    })
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder)
    })
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel))
    })
    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      element.title = t(element.dataset.i18nTitle)
    })
    if (selector) selector.value = locale
    const themeToggle = document.querySelector('#theme-toggle')
    if (themeToggle) themeToggle.setAttribute('aria-label', t(document.documentElement.dataset.theme === 'light' ? 'themeToDark' : 'themeToLight'))
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, locale) } catch { /* private browsing */ }
    }
    window.dispatchEvent(new CustomEvent('casaway:localechange', { detail: { locale } }))
  }

  selector?.addEventListener('change', () => apply(selector.value))
  apply(locale, false)
  return { t, getLocale: () => locale, setLocale: apply }
}