const CACHE='aol-docente-ingenieria-v12';
const ASSETS=['./','index.html','styles.css?v=20261021-1','app.js?v=20261020-1','data.json','manifest.webmanifest','icon.svg','assets/calendario-academico-2026-aol.webp','assets/calendario-academico-2027-aol.webp'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
