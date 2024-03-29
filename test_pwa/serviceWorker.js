const cacheName = "venmo_clone"
const filesToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/venmo_logo.png",
  "/payment/payment.html",
  "/payment/payment.css",
  "/payment/payment_reg.html",
  "/payment/payment_reg.css",
  "/payment/venmo_template.jpg",
  "/payment/venmo_template_clean.jpg",
  "/payment/venmo_template_clean_11.jpg",
  "/payment/assets/TBE.jpg",
  "/payment/assets/LASBC.jpg",
  "/payment/assets/TDX.jpg",
  "/payment/assets/P1.jpg",
  "/payment/assets/P2.jpg",
  "/payment/assets/P3.jpg",
  "/payment/assets/AthleticsMedium.otf",
  "/payment/assets/SFPRODISPLAYMEDIUM.OTF",
  "/payment/assets/SFPRODISPLAYREGULAR.OTF"
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