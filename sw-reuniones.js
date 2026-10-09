/* ============================================================
   Service Worker — Reuniones Equipo Directivo
   Registro con scope './': el ámbito queda limitado a la carpeta
   de esta aplicación dentro de iesvilladiego.github.io, de modo
   que NO interfiere con las demás apps alojadas en el dominio.
   ============================================================ */
const VERSION = 'v8';                 // Versión "viva" de la app: sube este número en cada despliegue (se muestra en el banner)
const CACHE = 'reuniones-' + VERSION; // El nombre de la caché acompaña siempre a la versión
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable-512.png',
  './img/icon.svg',
  './img/ImagenInicio.jpg',
  './img/apple-touch-icon.png',
  './img/favicon-32.png',
  './img/favicon-16.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* La página pide al sw que está atendiendo la app la versión "viva"
   (chip del banner). Se responde por el MessageChannel recibido y,
   como alternativa, directamente al cliente que preguntó. */
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'PEDIR_VERSION') return;
  const respuesta = {type:'VERSION', version: VERSION};
  if (e.ports && e.ports[0]) e.ports[0].postMessage(respuesta);
  else if (e.source) e.source.postMessage(respuesta);
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Regla clave de convivencia: solo se atienden peticiones dentro del scope
  // de esta app. Nada de dominio raíz, ni otras apps, ni CDNs/Firebase
  // (esos van siempre a la red para que Firebase funcione en tiempo real).
  if (!e.request.url.startsWith(self.registration.scope)) return;
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp && resp.ok) {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
      }
      return resp;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
