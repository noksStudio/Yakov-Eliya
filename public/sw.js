// Speeds up repeat visits: build assets and images come from the device, pages are always
// fetched fresh first (falling back to the last copy only when offline).
// The personal area (/life) also works offline on his phone: every screen opens, and today,
// the week, leads, the deal board and the shopping list show what was last loaded. Nothing is
// saved offline; writes need a connection. Logging out clears it all (see LIFE_CLEAR).
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const MEDIA = `media-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const LIFE = "life-v1";
// Data kept for offline use. Not finance, the journal, chats or couple notes.
const LIFE_API = ["/api/life/day", "/api/life/calendar", "/api/life/recurring", "/api/life/leads", "/api/life/business", "/api/life/metrics", "/api/life/shopping", "/api/life/reminders"];
// A weak signal should not keep a screen blank: after this long, the saved copy is shown.
const SLOW_MS = 3500;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC, MEDIA, PAGES, LIFE];
      for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then((response) => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
    .catch(() => hit);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  return refresh;
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw new Error("offline");
  }
}

const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve(null), ms));

/** A copy worth keeping: a real page or data, not a login redirect or an error. */
const keepable = (response) => response && response.ok && !response.redirected && response.type === "basic";

/**
 * Network first, but never stuck: on no connection, or after SLOW_MS, the saved copy is served
 * (marked with X-Life-Offline so the screen can say so) while the network keeps filling the cache.
 */
async function lifeNetworkFirst(event, key, fallback) {
  const cache = await caches.open(LIFE);
  const network = fetch(event.request).then(async (response) => {
    if (keepable(response)) await saveLifeData(cache, key, response);
    return response;
  });
  event.waitUntil(network.catch(() => {}));
  const first = await Promise.race([network.catch(() => null), timeout(SLOW_MS)]);
  if (first) return first;
  const hit = await cache.match(key);
  if (hit) {
    const headers = new Headers(hit.headers);
    headers.set("X-Life-Offline", "1");
    return new Response(await hit.blob(), { status: hit.status, headers });
  }
  // Nothing saved: wait for the network after all, or fall back.
  return network.catch(() => fallback());
}

const offlineJson = () =>
  new Response(JSON.stringify({ error: "אין חיבור לאינטרנט. המסך הזה זמין רק עם חיבור.", offline: true }), {
    status: 503,
    headers: { "Content-Type": "application/json", "X-Life-Offline": "1" },
  });

async function offlinePage() {
  // Any saved screen is better than the browser's error page; the home screen first.
  const cache = await caches.open(LIFE);
  return (await cache.match("/life")) || new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

const OFFLINE_HTML = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>אין חיבור</title><body style="margin:0;background:#05061a;color:#eee;font-family:system-ui;display:grid;place-items:center;min-height:100vh;text-align:center">
<div><p style="font-size:40px;margin:0">📡</p><h1 style="font-size:20px">אין חיבור לאינטרנט</h1><p style="color:#aaa">המסך הזה עוד לא נשמר בטלפון. כשהחיבור יחזור הוא ייפתח.</p>
<a href="/life" style="color:#f0c878">להיום שלי</a></div></body></html>`;

async function saveLifeData(cache, key, response) {
  const headers = new Headers(response.headers);
  headers.set("X-Life-Saved-At", new Date().toISOString());
  await cache.put(key, new Response(await response.clone().blob(), { status: response.status, headers }));
}

/**
 * Saves the life screens and the scripts they need, so moving between them works offline, and
 * the data of the main screens (`api`: today, this week and month, leads, shopping).
 */
async function warmLife(paths, api) {
  const cache = await caches.open(LIFE);
  for (const url of api) {
    try {
      const response = await fetch(url, { credentials: "same-origin", cache: "no-store" });
      if (keepable(response)) await saveLifeData(cache, url, response);
    } catch {
      return;
    }
  }
  const assets = new Set();
  for (const path of paths) {
    try {
      const response = await fetch(path, { credentials: "same-origin" });
      if (!keepable(response) || !(response.headers.get("content-type") || "").includes("text/html")) continue;
      const html = await response.clone().text();
      await cache.put(path, response);
      for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
    } catch {
      return; // offline or flaky: try again next time
    }
  }
  const staticCache = await caches.open(STATIC);
  for (const asset of assets) {
    if (!(await staticCache.match(asset))) await staticCache.add(asset).catch(() => {});
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "LIFE_WARM" && Array.isArray(data.paths)) {
    const api = (Array.isArray(data.api) ? data.api : []).filter((u) => LIFE_API.includes(new URL(u, self.location.origin).pathname));
    event.waitUntil(warmLife(data.paths.filter((p) => p.startsWith("/life")), api));
  }
  if (data.type === "LIFE_CLEAR") event.waitUntil(caches.delete(LIFE));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The personal area, for offline use on his phone (logging out deletes the LIFE cache).
  if (url.pathname.startsWith("/life") && request.mode === "navigate") {
    event.respondWith(lifeNetworkFirst(event, url.pathname, offlinePage));
    return;
  }
  if (LIFE_API.some((p) => url.pathname === p)) {
    event.respondWith(lifeNetworkFirst(event, url.pathname + url.search, async () => offlineJson()));
    return;
  }

  // Everything else private (admin, other life data and screens' payloads) is never cached.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/life")) return;
  // Client-side navigation payloads must always be fresh.
  if (url.searchParams.has("_rsc") || request.headers.get("RSC")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (url.pathname.startsWith("/_next/image") || /^\/(home|lp)\//.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, MEDIA));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});
