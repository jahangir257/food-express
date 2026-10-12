'use client';
import { useEffect, useRef } from 'react';
function leaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((res) => {
    const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'; document.head.appendChild(c);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'; s.onload = () => res(window.L); document.body.appendChild(s);
  });
}
// props are [lng, lat] arrays
export default function TrackMap({ restaurant, customer, rider }) {
  const el = useRef(), st = useRef({});
  const ll = (p) => [p[1], p[0]];
  useEffect(() => {
    let dead = false;
    leaflet().then((L) => {
      if (dead || st.current.map) return;
      const map = L.map(el.current, { zoomControl: true, scrollWheelZoom: false }).setView(ll(customer), 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      const icon = (e) => L.divIcon({ className: '', html: `<div class="mk">${e}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] });
      st.current = { map, L, icon, r: L.marker(ll(restaurant), { icon: icon('🍽️') }).addTo(map), c: L.marker(ll(customer), { icon: icon('🏠') }).addTo(map) };
      map.fitBounds(L.latLngBounds([ll(restaurant), ll(customer)]), { padding: [40, 40] }); st.current.fit = true;
    });
    return () => { dead = true; st.current.map?.remove(); st.current = {}; };
  }, []);
  useEffect(() => {
    const s = st.current; if (!s.map || !rider) return;
    if (!s.d) s.d = s.L.marker(ll(rider), { icon: s.icon('🛵') }).addTo(s.map); else s.d.setLatLng(ll(rider));
    if (!s.bounded) { s.map.fitBounds(s.L.latLngBounds([ll(restaurant), ll(customer), ll(rider)]), { padding: [40, 40] }); s.bounded = true; }
  });
  return <div ref={el} className="map" />;
}
