// Offline-Cache: beim ersten Öffnen (im WLAN) wird alles gespeichert,
// danach läuft das Spiel auch im Wald ohne Netz. VERSION erhöhen nach Änderungen!
const VERSION = 'sternenclan-23';
const FILES = [
  './', 'index.html', 'print.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg',
  'js/app.js', 'js/config.js', 'js/players.js', 'js/map.js', 'js/territory.js', 'js/geo.js', 'js/puzzles.js', 'js/fx.js', 'js/print.js',
  'js/lib/jsQR.js', 'js/lib/qrcode.js',
  'sounds/owl1.m4a', 'sounds/owl2.m4a', 'sounds/wind.m4a', 'sounds/hiss.m4a', 'sounds/meow.m4a',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)),
  );
});
