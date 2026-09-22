/*
 * Florence service worker (Faz 6 / Birim 6.4, plan M-12, S-11).
 *
 * El yazımı, bağımlılıksız ve bilinçli olarak sade. Serwist/Workbox yok.
 * Strateji:
 *   - `/api/` istekleri ASLA önbelleğe alınmaz (her zaman ağ). BFF/auth
 *     yanıtları kişiye özeldir; cache'lenmesi veri sızıntısı ve bayat oturum
 *     riski yaratır.
 *   - Gezinme (HTML) istekleri: network-first; ağ yoksa cache → `/offline`.
 *   - `_next/static` ve görsel/font/stil: cache-first + arka planda tazeleme
 *     (stale-while-revalidate).
 *   - Cache adı sürümlüdür; `activate` eski sürümleri siler.
 *   - Büyük gövdeler ve `Content-Disposition` (indirme) yanıtları cache'lenmez.
 */

// Sürüm değişince eski cache'ler activate'ta temizlenir.
const CACHE_NAME = "florence-v1";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL];

// Önbelleğe alınacak yanıt üst sınırı (5 MB): büyük indirmeleri dışlar.
const MAX_CACHEABLE_BYTES = 5 * 1024 * 1024;
// Statik varlık olarak kabul edilen fetch destination'ları.
const STATIC_DESTINATIONS = new Set(["style", "script", "image", "font"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Yalnız güvenli ve aynı kaynaklı GET istekleri ele alınır.
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  // API yanıtları kişisel/oturuma bağlı; önbelleğe alınmaz.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static") || STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/** Gezinme: önce ağ; başarısızsa cache, o da yoksa çevrimdışı sayfası. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    const offline = await cache.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

/** Statik varlık: cache'ten hemen dön, arka planda tazele. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        return cache.put(request, response.clone()).then(() => response);
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    return cached;
  }
  return (await network) || Response.error();
}

/** Yanıt önbelleğe alınabilir mi? (durum, boyut, indirme başlığı denetimi). */
function isCacheable(response) {
  if (!response || !response.ok || response.type === "opaque") {
    return false;
  }
  if (response.headers.get("Content-Disposition")) {
    return false;
  }
  const length = Number(response.headers.get("Content-Length") || "0");
  if (length > MAX_CACHEABLE_BYTES) {
    return false;
  }
  return true;
}
