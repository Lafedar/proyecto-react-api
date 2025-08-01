const CACHE_NAME = "app-cache-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Instalar SW
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

// Activar y limpiar caché vieja
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
});

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then(
            (response) => response || fetch(event.request)
        )
    );
});
