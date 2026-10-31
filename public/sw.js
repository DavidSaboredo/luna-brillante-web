// Service worker: deja la app usable sin internet.
// - Archivos estáticos (_next/static, imágenes, diagramas): primero la copia guardada.
// - Páginas: primero la red; si no hay señal, la última copia guardada.
// - /api nunca se guarda.
const VERSION = "v6";
const CACHE = `luna-${VERSION}`;
const RUTAS = ["/", "/puntos", "/puntadas", "/proyectos", "/herramientas", "/crear", "/guia", "/privacidad"];

async function traer(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { credentials: "same-origin" });
      if (r.ok) return r;
      if (r.status === 404) return null;
    } catch {}
  }
  return null;
}

// Archivos (scripts, estilos, tipografías) que usa una página, incluidos los que se cargan aparte.
function archivosDe(html) {
  const todos = html.match(/(?:\/_next\/)?static\/[A-Za-z0-9_\-/.]+\.(?:js|css|woff2?)/g) || [];
  return todos.map((a) => (a.startsWith("/_next/") ? a : "/_next/" + a));
}

async function guardarTodo() {
  const cache = await caches.open(CACHE);
  const archivos = new Set();
  for (const ruta of RUTAS) {
    const res = await traer(ruta);
    if (!res) continue;
    await cache.put(ruta, res.clone());
    archivosDe(await res.text()).forEach((a) => archivos.add(a));
  }
  // el archivo "webpack-…" lista todos los pedazos que se cargan aparte (id → código)
  const runtime = [...archivos].find((a) => /\/chunks\/webpack-[\w]+\.js$/.test(a));
  if (runtime) {
    const r = await traer(runtime);
    if (r) {
      const js = await r.text();
      for (const m of js.matchAll(/([\w-]+):"([0-9a-f]{16})"/g)) archivos.add(`/_next/static/chunks/${m[1]}.${m[2]}.js`);
    }
  }
  // baja de a 4 archivos para no saturar la conexión del celular
  const cola = [...archivos];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let a = cola.pop(); a; a = cola.pop()) {
        if (await cache.match(a)) continue;
        const r = await traer(a);
        if (r) await cache.put(a, r);
      }
    })
  );
}

function sinConexion() {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · Luna Brillante</title>
<style>body{font-family:system-ui,sans-serif;background:#faf6f0;color:#4a4458;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center}
a{display:inline-block;margin-top:16px;padding:12px 24px;border-radius:999px;background:#6a58a8;color:#fff;text-decoration:none;font-weight:600}</style></head>
<body><main><h1>Sin conexión</h1><p>Esta página todavía no se guardó en tu celular.<br>No hay conexión · No connection · Sem conexão</p><a href="/herramientas">Ir a Herramientas</a></main></body></html>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

self.addEventListener("install", (e) => {
  e.waitUntil(guardarTodo().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith("luna-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const estatico = /^\/(_next\/static|img|diagramas|icons?)\//.test(url.pathname) || /\.(png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname);

  if (estatico) {
    e.respondWith(
      caches.match(req).then(
        (copia) =>
          copia ||
          fetch(req).then((res) => {
            if (res.ok) {
              const c = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, c));
            }
            return res;
          })
      )
    );
    return;
  }

  // páginas (y datos de navegación de Next): red primero, copia si no hay señal
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const c = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, c));
        }
        return res;
      })
      .catch(async () => {
        const copia = await caches.match(req);
        if (copia) return copia;
        if (req.mode !== "navigate") return Response.error();
        // la misma página con otros parámetros (por ejemplo /crear?prenda=poncho)
        return (await caches.match(url.pathname, { ignoreSearch: true })) || sinConexion();
      })
  );
});
