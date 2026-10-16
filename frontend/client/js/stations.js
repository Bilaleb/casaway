import { TAXI_FILTERS, METERS_PER_KILOMETER } from './constants.js'

export const STATIONS = [
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
  { id: 11, name: "Station Lissasfa (Route d'El Jadida / Rond Point)", district: 'Lissasfa', coordinates: [33.5341, -7.6781], taxiType: 'Grand Taxi', destinations: ['Azemmour', 'Had Soualem', 'Errahma'] },
  { id: 12, name: 'Station Derb Omar / Bd Mohammed V', district: 'Derb Omar', coordinates: [33.5938, -7.6087], taxiType: 'Petit Taxi & Regional Grand Taxi', destinations: ['Centre Ville', 'Casa-Voyageurs', 'Regional routes'] },
  { id: 13, name: 'Station Sidi Moumen (Terminus Tramway Anassi)', district: 'Sidi Moumen', coordinates: [33.5871, -7.5023], taxiType: 'Grand Taxi', destinations: ['Bernoussi', 'Tit Mellil'] },
  { id: 14, name: 'Station Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)', district: 'Hay Mohammadi', coordinates: [33.5921, -7.5658], taxiType: 'Grand Taxi', destinations: ['Casa-Voyageurs', 'Sidi Bernoussi'] },
  { id: 15, name: 'Station Sbata (Rond Point Jamila)', district: 'Sbata', coordinates: [33.5542, -7.5681], taxiType: 'Grand Taxi', destinations: ['Garage Allal', 'Derb Sultan', 'Ain Chock'] },
  { id: 16, name: 'Station Ain Chock (Bd Baghdad / Near Faculté)', district: 'Ain Chock', coordinates: [33.5488, -7.6012], taxiType: 'Grand Taxi', destinations: ['Bachkou', 'Derb Sultan', 'Sidi Maalouf'] },
  { id: 17, name: 'Station Errahma (Ville Nouvelle / Main Roundabout)', district: 'Errahma', coordinates: [33.5124, -7.7115], taxiType: 'Grand Taxi', destinations: ['Oulfa', 'Lissasfa'] },
  { id: 18, name: 'Station Tit Mellil (Centre)', district: 'Tit Mellil', coordinates: [33.5540, -7.4812], taxiType: 'Regional Grand Taxi', destinations: ['Garage Allal', 'Bernoussi'] },
  { id: 19, name: 'Station Sidi Maalouf (Near Technopark)', district: 'Sidi Maalouf', coordinates: [33.5421, -7.6385], taxiType: 'Grand Taxi', destinations: ['Bachkou', 'Shorex', 'Zenith'] },
  { id: 20, name: 'Station Sidi Bernoussi - Tram Terminus', district: 'Sidi Bernoussi', coordinates: [33.6152, -7.5089], taxiType: 'Grand Taxi', destinations: ['Zone Industrielle', 'Mohammedia'] },
]

export const hasGrandTaxi = (station) => /grand/i.test(station.taxiType)
export const hasPetitTaxi = (station) => /petit/i.test(station.taxiType)

export function getStation(stations, id) {
  return stations.find((station) => station.id === Number(id)) || null
}

export function filterStations(stations, query, taxiType) {
  const needle = query.trim().toLocaleLowerCase()
  return stations.filter((station) => {
    if (taxiType === TAXI_FILTERS.GRAND && !hasGrandTaxi(station)) return false
    if (taxiType === TAXI_FILTERS.PETIT && !hasPetitTaxi(station)) return false
    if (!needle) return true
    const haystack = [station.name, station.district, station.taxiType, ...station.destinations].join(' ').toLocaleLowerCase()
    return haystack.includes(needle)
  })
}

export function distanceMeters(from, to) {
  const earthRadius = 6371000
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const deltaLat = toRadians(to[0] - from[0])
  const deltaLon = toRadians(to[1] - from[1])
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(toRadians(from[0])) * Math.cos(toRadians(to[0])) * Math.sin(deltaLon / 2) ** 2
  return 2 * earthRadius * Math.asin(Math.sqrt(a))
}

export function findNearestStation(stations, latitude, longitude) {
  return stations.reduce((best, station) => {
    const meters = distanceMeters([latitude, longitude], station.coordinates)
    return !best || meters < best.meters ? { station, meters } : best
  }, null)
}

export function formatDistance(meters) {
  const kilometers = meters / METERS_PER_KILOMETER
  return kilometers < 1 ? `${Math.round(meters)} m` : `${kilometers.toFixed(1)} km`
}

export function buildStationHaystack(station) {
  return [station.name, station.district, ...station.destinations].join(' ').toLocaleLowerCase()
}
