import { useState } from 'react';

const STATIONS = [
  { id: 1, name: "Place de la Concorde (L-Hammam / Bd Lalla Yacout)", district: "Centre Ville", taxiType: "Grand Taxi", destinations: ["Oulfa", "Maarif", "Ain Diab"] },
  { id: 2, name: "Station Casa-Port", district: "Casa-Port", taxiType: "Grand & Petit Taxi", destinations: ["Ain Sebaa", "Sidi Bernoussi", "Mohammedia"] },
  { id: 3, name: "Station Casa-Voyageurs", district: "Casa-Voyageurs", taxiType: "Grand & Petit Taxi", destinations: ["Centre Ville", "Hay Mohammadi", "Derb Sultan"] },
  { id: 4, name: "Station Garage Allal (Derb Sultan)", district: "Derb Sultan", taxiType: "Grand Taxi", destinations: ["Mediouna", "Tit Mellil", "Bouskoura"] },
  { id: 5, name: "Station Rond-Point Bachkou", district: "Bachkou", taxiType: "Grand Taxi", destinations: ["Near University", "Oulfa", "Sidi Maalouf"] },
  { id: 6, name: "Station L-Oulfa (Terminus / Bd Moulay Rachid)", district: "Oulfa", taxiType: "Grand Taxi", destinations: ["Centre Ville", "Maarif", "Errahma"] },
  { id: 7, name: "Station Sidi Bernoussi (Bd Imam Ali)", district: "Sidi Bernoussi", taxiType: "Grand Taxi", destinations: ["Mohammedia", "Tit Mellil", "Casa-Port"] },
  { id: 8, name: "Station Ain Sebaa (L-Gara / Near Train Station)", district: "Ain Sebaa", taxiType: "Grand Taxi", destinations: ["Sidi Bernoussi", "Centre Ville"] },
  { id: 9, name: "Station Maarif (Bd Bir Anzarane / Twin Center)", district: "Maarif", taxiType: "Petit Taxi & Grand Taxi Hub", destinations: ["Grand taxi hub", "Twin Center", "Ain Diab"] },
  { id: 10, name: "Station Hay Hassani (SOUK / Terminus)", district: "Hay Hassani", taxiType: "Grand Taxi", destinations: ["Oulfa", "Lissasfa", "Maarif"] },
  { id: 11, name: "Station Lissasfa (Route d'El Jadida / Rond Point)", district: "Lissasfa", taxiType: "Grand Taxi", destinations: ["Azemmour", "Had Soualem", "Errahma"] },
  { id: 12, name: "Station Derb Omar / Bd Mohammed V", district: "Derb Omar", taxiType: "Petit Taxi & Regional Grand Taxi", destinations: ["Centre Ville", "Casa-Voyageurs", "Regional routes"] },
  { id: 13, name: "Station Sidi Moumen (Terminus Tramway Anassi)", district: "Sidi Moumen", taxiType: "Grand Taxi", destinations: ["Bernoussi", "Tit Mellil"] },
  { id: 14, name: "Station Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)", district: "Hay Mohammadi", taxiType: "Grand Taxi", destinations: ["Casa-Voyageurs", "Sidi Bernoussi"] },
  { id: 15, name: "Station Sbata (Rond Point Jamila)", district: "Sbata", taxiType: "Grand Taxi", destinations: ["Garage Allal", "Derb Sultan", "Ain Chock"] },
  { id: 16, name: "Station Ain Chock (Bd Baghdad / Near Faculté)", district: "Ain Chock", taxiType: "Grand Taxi", destinations: ["Bachkou", "Derb Sultan", "Sidi Maalouf"] },
  { id: 17, name: "Station Errahma (Ville Nouvelle / Main Roundabout)", district: "Errahma", taxiType: "Grand Taxi", destinations: ["Oulfa", "Lissasfa"] },
  { id: 18, name: "Station Tit Mellil (Centre)", district: "Tit Mellil", taxiType: "Regional Grand Taxi", destinations: ["Garage Allal", "Bernoussi"] },
  { id: 19, name: "Station Sidi Maalouf (Near Technopark)", district: "Sidi Maalouf", taxiType: "Grand Taxi", destinations: ["Bachkou", "Shorex", "Zenith"] },
  { id: 20, name: "Station Sidi Bernoussi - Tram Terminus", district: "Sidi Bernoussi", taxiType: "Grand Taxi", destinations: ["Zone Industrielle", "Mohammedia"] }
];

export default function Dashboard() {
  const [query, setQuery] = useState('');

  const filtered = STATIONS.filter(s =>
    `${s.name} ${s.district} ${s.destinations.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto', color: '#edf0f5', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #283140', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#e5c158' }}>Casaway Stations Directory</h1>
          <p style={{ margin: '6px 0 0', color: '#8993a3', fontSize: '13px' }}>Casablanca Taxi Navigator Admin Dashboard</p>
        </div>
        <a href="/" style={{ color: '#e5c158', textDecoration: 'none', border: '1px solid #756231', padding: '8px 14px', borderRadius: '4px', fontSize: '12px' }}>
          ← Back to Map
        </a>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#111722', border: '1px solid #283140', padding: '16px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#8993a3', textTransform: 'uppercase' }}>Total Stations</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e5c158', marginTop: '4px' }}>20</div>
        </div>
        <div style={{ background: '#111722', border: '1px solid #283140', padding: '16px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#8993a3', textTransform: 'uppercase' }}>Districts Covered</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#86c8a0', marginTop: '4px' }}>16</div>
        </div>
        <div style={{ background: '#111722', border: '1px solid #283140', padding: '16px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#8993a3', textTransform: 'uppercase' }}>Grand Taxi Hubs</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#edf0f5', marginTop: '4px' }}>18</div>
        </div>
        <div style={{ background: '#111722', border: '1px solid #283140', padding: '16px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#8993a3', textTransform: 'uppercase' }}>Route Traces</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e5c158', marginTop: '4px' }}>1 Active GPX</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="search"
          placeholder="Filter stations by name, district, or destination..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', background: '#111722', border: '1px solid #283140', color: '#edf0f5', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #283140', borderRadius: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#171e2a', borderBottom: '1px solid #283140', color: '#8993a3', textTransform: 'uppercase', fontSize: '11px' }}>
              <th style={{ padding: '12px 14px' }}>ID</th>
              <th style={{ padding: '12px 14px' }}>Station Name</th>
              <th style={{ padding: '12px 14px' }}>District</th>
              <th style={{ padding: '12px 14px' }}>Taxi Type</th>
              <th style={{ padding: '12px 14px' }}>Destinations</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #283140', background: '#111722' }}>
                <td style={{ padding: '12px 14px', color: '#e5c158', fontWeight: 'bold' }}>#{String(s.id).padStart(2, '0')}</td>
                <td style={{ padding: '12px 14px', fontWeight: '600' }}>{s.name}</td>
                <td style={{ padding: '12px 14px', color: '#abb3c1' }}>{s.district}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '3px', fontSize: '11px', background: s.taxiType.includes('&') ? '#2e2715' : '#1e2430', color: s.taxiType.includes('&') ? '#e5c158' : '#86c8a0', border: '1px solid rgba(229,193,88,0.2)' }}>
                    {s.taxiType}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#abb3c1', fontSize: '12px' }}>
                  {s.destinations.join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
