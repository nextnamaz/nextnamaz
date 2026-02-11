// Service Worker for NextNamaz Display Screens
// Provides offline capability for TV/kiosk devices
// Scoped to /display/ and /screen/ — does not interfere with admin/auth pages

const CACHE_VERSION = 'nextnamaz-display-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== STATIC_CACHE && key !== PAGE_CACHE && key !== FONT_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase realtime/API requests
  if (url.hostname.includes('supabase')) return;

  // Font requests: cache-first (fonts rarely change)
  if (
    url.pathname.includes('/fonts/') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  // Next.js build artifacts — network-first so cache always has latest chunks.
  // In production chunks are content-hashed (safe forever), but in dev they change often.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }

  // Next.js image optimization
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Static images/icons in public/
  if (/\.(ico|svg|png|jpg|webp)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Display pages: network-first, fall back to cache
  if (url.pathname.startsWith('/display/') || url.pathname.startsWith('/screen/')) {
    event.respondWith(networkFirst(event.request, PAGE_CACHE));
    return;
  }

  // API requests for yearly times: network-first with cache fallback
  if (
    url.pathname.includes('/api/display/') &&
    url.pathname.includes('/yearly-times')
  ) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // No cache — serve offline page that reads prayer times from localStorage
    if (request.mode === 'navigate') {
      return new Response(offlinePageHtml(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

function offlinePageHtml() {
  // This page reads cached prayer times from localStorage and renders them.
  // It extracts the screen slug from the URL to find the right cache key.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Prayer Times - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 2.5rem; margin-bottom: 1.5rem; color: #fff; }
    h2 { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.6; }
    .times { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 3rem; font-size: 1.6rem; text-align: left; }
    .label { text-align: right; opacity: 0.8; }
    .time { font-weight: bold; color: #fff; }
    .status { margin-top: 2rem; font-size: 0.85rem; opacity: 0.5; }
    .dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: #eab308; margin-right: 0.5rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .waiting { display: none; }
  </style>
</head>
<body>
  <div id="root">
    <div id="cached-display" style="display:none">
      <h1 id="mosque-name"></h1>
      <h2>Prayer Times</h2>
      <div class="times" id="prayer-grid"></div>
      <p class="status"><span class="dot"></span>Offline &mdash; showing cached times</p>
    </div>
    <div id="no-cache">
      <h1>Prayer Times Display</h1>
      <p><span class="dot"></span>Waiting for network connection...</p>
      <p class="status">The page will reload automatically when connected.</p>
    </div>
  </div>
  <script>
    var PRAYER_NAMES = {
      fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr',
      asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha'
    };
    var ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

    function getSlug() {
      var parts = window.location.pathname.split('/');
      // Get the last non-empty segment from the URL
      var segment = null;
      for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i]) { segment = parts[i]; break; }
      }
      if (!segment) return null;

      // /display/[slug] — segment IS the slug
      if (window.location.pathname.startsWith('/display/')) return segment;

      // /screen/[code] — segment is a short_code, resolve via alias
      if (window.location.pathname.startsWith('/screen/')) {
        try {
          var alias = localStorage.getItem('nextnamaz:alias:' + segment);
          if (alias) return alias;
        } catch(e) {}
      }

      return segment;
    }

    function todayStr() {
      var d = new Date();
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    }

    function tryRender() {
      var slug = getSlug();
      if (!slug) return false;

      var raw = null;
      try { raw = localStorage.getItem('nextnamaz:display:' + slug); } catch(e) {}
      if (!raw) return false;

      var data = null;
      try { data = JSON.parse(raw); } catch(e) { return false; }
      if (!data || !data.mosque || !data.settings) return false;

      // Resolve best prayer times: yearly cache > settings cache
      var times = data.settings.prayer_times;
      try {
        var yearlyRaw = localStorage.getItem('nextnamaz:yearly:' + slug);
        if (yearlyRaw) {
          var yearly = JSON.parse(yearlyRaw);
          var today = todayStr();
          if (yearly.times && yearly.times[today]) {
            times = yearly.times[today];
          }
        }
      } catch(e) {}

      if (!times) return false;

      // Render
      document.getElementById('mosque-name').textContent = data.mosque.name;
      var grid = document.getElementById('prayer-grid');
      grid.innerHTML = '';
      for (var i = 0; i < ORDER.length; i++) {
        var key = ORDER[i];
        var label = document.createElement('span');
        label.className = 'label';
        label.textContent = PRAYER_NAMES[key];
        var val = document.createElement('span');
        val.className = 'time';
        val.textContent = times[key] || '--:--';
        grid.appendChild(label);
        grid.appendChild(val);
      }

      document.getElementById('cached-display').style.display = '';
      document.getElementById('no-cache').style.display = 'none';
      return true;
    }

    tryRender();

    // Auto-reload when network is restored
    window.addEventListener('online', function() { location.reload(); });
    // Poll every 30s using navigator.onLine (not fetch, which the SW intercepts)
    setInterval(function() {
      if (navigator.onLine) location.reload();
    }, 30000);
  </script>
</body>
</html>`;
}
