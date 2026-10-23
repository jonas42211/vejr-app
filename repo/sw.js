const cache = "vejr-app-cache-v1";


const files = [
    "./",
    "./index.html",
    "./assets/css/site.css",
    "./assets/java/side.js",
    "./manifest.json",
    "./assets/java/weatherModel.js",
    "./assets/java/weatherView.js",
    "./assets/java/weatherController.js",
    "./assets/img/weather-icon.svg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cache).then((storage) => storage.addAll(files))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys
                .filter((key) => key.startsWith("vejr-app-cache-") && key !== cache)
                .map((key) => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    const isOpenMeteo = [
        "api.open-meteo.com",
        "geocoding-api.open-meteo.com"
    ].includes(url.hostname);

    if (isOpenMeteo) {
        event.respondWith(networkFirst(event.request));
    } else if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(event.request));
    }
});

function cacheFirst(request) {
    return caches.match(request).then((response) => {
        if (response) {
            return response;
        }
        return fetch(request);
    });
}

function networkFirst(request) {
    return fetch(request).then((response) => {
        if (!response.ok) return response;

        return caches.open(cache).then((storage) =>
            storage.put(request, response.clone()).then(() => response)
        ).catch(() => response);
    }).catch(() => caches.match(request).then((response) =>
        response || new Response(
            JSON.stringify({ error: true, reason: "Du er offline, og der er ingen gemte data for denne forespørgsel." }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        )
    ));
}

self.addEventListener("push", (event) => {
    const text = event.data ? event.data.text() : "Ingen data modtaget";
    event.waitUntil(
        self.registration.showNotification("Vejr", {
            body: text,
            icon: "./assets/img/weather-icon.svg"
        })
    );
});