const CACHE_NAME = 'astro-guru-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/src/assets/planets/Jupiter.glb',
  '/src/assets/planets/Mars.glb',
  '/src/assets/planets/Mercury.glb',
  '/src/assets/planets/Moon.glb',
  '/src/assets/planets/Neptune.glb',
  '/src/assets/planets/Saturn.glb',
  '/src/assets/planets/Sun.glb',
  '/src/assets/planets/Uranus.glb',
  '/src/assets/planets/Venus.glb',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
