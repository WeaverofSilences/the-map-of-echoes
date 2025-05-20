// 1) Inizializza la mappa
const map = L.map('map', {
  center: [30, 20],
  zoom: 2,
  minZoom: 2,
  maxZoom: 8,
  maxBounds: [[-90, -180], [90, 180]],
  maxBoundsViscosity: 1.0,
  worldCopyJump: false
});

// 2) Tile layer dark di CARTO
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    noWrap: true,
    bounds: [[-90, -180], [90, 180]]
  }
).addTo(map);

// 3) Overlay “nebula onirica” più tenue
const overlay = L.tileLayer.canvas();
overlay.drawTile = canvas => {
  const ctx = canvas.getContext('2d');
  const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 200);
  grd.addColorStop(0, 'rgba(30,30,50,0)');
  grd.addColorStop(1, 'rgba(10,0,20,0.4)');  // opacity ridotta a 0.4
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 256);
};
overlay.addTo(map);

// 4) Dati dei punti con gemelli
const points = [
  // I SEE YOU
  { lat: 41.9, lon: 12.5, work: "I SEE YOU",    message: "Your echo has been sent." },
  { lat: 42.1, lon: 12.7, work: "I SEE YOU",    message: "Your echo has been sent." },

  // NO SHIELDS
  { lat: 48.8, lon: 2.35, work: "NO SHIELDS",   message: "Your echo has been sent." },
  { lat: 49.0, lon: 2.50, work: "NO SHIELDS",   message: "Your echo has been sent." },

  // FRAGILE LIGHT
  { lat: 35.7, lon: 139.7, work: "FRAGILE LIGHT", message: "Your echo has been sent." },
  { lat: 36.0, lon: 140.0, work: "FRAGILE LIGHT", message: "Your echo has been sent." }
];

// 5) Array e mappa per raggruppare i marker
const markers = [];
const markersByWork = {};

// 6) Funzione per aggiungere i marker in base al filtro
targetunction addMarkers(filter) {
  // Rimuovi quelli vecchi
  markers.forEach(m => map.removeLayer(m));
  markers.length = 0;
  Object.keys(markersByWork).forEach(k => delete markersByWork[k]);

  // Crea i nuovi
  points
    .filter(p => filter === 'all' || p.work === filter)
    .forEach(p => {
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: 8,
        fillColor: "#FFFFFF",
        color: "#FFFFFF",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      // Applica il glow pulsante appena viene aggiunto al DOM
      marker.on('add', () => {
        marker.getElement().classList.add('pulsing');
      });

      marker.work = p.work;
      markers.push(marker);
      (markersByWork[p.work] = markersByWork[p.work] || []).push(marker);

      // Evento click: scia luminosa o flash
      marker.on('click', onMarkerClick);
    });
}

// 7) Gestione del click sui marker
function onMarkerClick(e) {
  const me = e.target;
  const group = markersByWork[me.work] || [];

  // Se solo un marker per quest’opera: flash
  if (group.length < 2) {
    me.getElement().classList.add('flash');
    setTimeout(() => me.getElement().classList.remove('flash'), 1200);
    return;
  }

  // Altrimenti disegna scie verso gli altri marker
  group.forEach(other => {
    if (other === me) return;
    const latlngs = [me.getLatLng(), other.getLatLng()];
    const line = L.polyline(latlngs, {
      color: '#ffdca0',
      weight: 2,
      opacity: 0.7
    }).addTo(map);

    let prog = 0,
        steps = 40,
        animMarker;

    const anim = setInterval(() => {
      prog++;
      const t = prog / steps;
      const a = latlngs[0],
            b = latlngs[1];
      const lat = a.lat + t * (b.lat - a.lat);
      const lng = a.lng + t * (b.lng - a.lng);

      if (animMarker) map.removeLayer(animMarker);
      animMarker = L.circleMarker([lat, lng], {
        radius: 5,
        fillColor: '#ffdca0',
        fillOpacity: 1,
        stroke: false
      }).addTo(map);

      if (prog >= steps) {
        clearInterval(anim);
        map.removeLayer(animMarker);
        map.removeLayer(line);
      }
    }, 25);
  });
}

// 8) Change listener sul dropdown
document.getElementById('workSelect')
  .addEventListener('change', function() {
    addMarkers(this.value);
  });

// 9) Inizializza con tutti i gesture
addMarkers('all');

