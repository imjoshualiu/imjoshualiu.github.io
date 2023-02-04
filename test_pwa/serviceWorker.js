const cacheName = "venmo_clone"
const filesToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/venmo_logo.png",
  "/payment/payment.html",
  "/payment/payment.css",
  "/payment/venmo_template.jpg",
  "/payment/venmo_template_clean.jpg",
  "/payment/assets/TBE.jpg",
  "/payment/assets/AthleticsMedium.otf"
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