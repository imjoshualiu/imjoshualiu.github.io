const cacheName = "venmo_clone"
const filesToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/main.js",
  "/payment/payment.html",
  "/payment/payment.css",
  "/payment/venmo_template.jpg"
]

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});