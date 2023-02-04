const venmo_clone = "venmo_clone"
const assets = [
  "/",
  "/index.html",
  "/index.css",
  "/venmo_logo.png",
  "/payment/payment.html",
  "/payment/payment.css",
  "/payment/venmo_template.jpg"
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(venmo_clone).then(cache => {
      cache.addAll(assets)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
      caches.match(fetchEvent.request).then(res => {
        return res || fetch(fetchEvent.request)
      })
    )
  })