// Generador de diagramas (SVG) e ilustraciones "de lana" (SVG -> WebP) a partir de un gráfico por filas.
//
// Cada fila del gráfico es un texto con símbolos separados por espacios, de abajo hacia arriba.
// La cadena base se dibuja sola debajo de la primera fila.
//
// Símbolos: ch, sc, hdc, dc, tr, slst, sk, pic (piquillo), V (pa-cad-pa), X (pa cruzados),
//           puff, bob (mota), pop (palomita), arcN (arco de N cad), shellN (abanico de N pa),
//           clN (racimo de N pa cerrados arriba)
//           sol (nudo de Salomón horizontal), solL / solR (nudo de Salomón inclinado  o /)
// Prefijos: fp: / bp: (relieve), blo: (hebra trasera), long: (punto largo), c2: (segundo color)
// Repetición: "dc*6" = seis pa

const U = 13.65; // ancho de una cadeneta
const ALTO = { ch: 10, slst: 8, sc: 16, hdc: 22, dc: 30, tr: 40, puff: 28, bob: 28, pop: 28, pic: 14, V: 30, X: 30, sol: 10, solL: 26, solR: 26 };

function expandir(fila) {
  return fila
    .trim()
    .split(/\s+/)
    .flatMap((t) => {
      const m = t.match(/^(.*)\*(\d+)$/);
      return m ? Array(Number(m[2])).fill(m[1]) : [t];
    });
}

function analizar(tok) {
  const p = { c2: false, fp: false, bp: false, blo: false, long: false };
  let t = tok;
  for (;;) {
    const m = t.match(/^(c2|fp|bp|blo|long):(.*)$/);
    if (!m) break;
    p[m[1]] = true;
    t = m[2];
  }
  let tipo = t,
    n = 0;
  const num = t.match(/^(arc|shell|cl)(\d+)$/);
  if (num) {
    tipo = num[1];
    n = Number(num[2]);
  }
  const ancho =
    tipo === "arc" ? Math.max(2, Math.round(n * 0.6)) : tipo === "shell" ? Math.max(2, Math.round(n * 0.55) + 1) : tipo === "cl" ? Math.max(2, Math.round(n * 0.5) + 1) : tipo === "V" || tipo === "X" || tipo === "solL" || tipo === "solR" ? 2 : tipo === "sol" ? 3 : 1;
  const alto = tipo === "arc" ? 8 + n * 2.6 : tipo === "shell" ? 34 : tipo === "cl" ? 30 : (ALTO[tipo] ?? 16) * (p.long ? 1.7 : 1);
  return { ...p, tipo, n, ancho, alto };
}

// Primitivas en coordenadas absolutas: {k:"l",x1,y1,x2,y2} | {k:"e",cx,cy,rx,ry,rot} | {k:"p",d} | {k:"dot",cx,cy}
function puntoAlto(x, y, h, barras, rot = 0) {
  const r = (rot * Math.PI) / 180,
    s = Math.sin(r),
    c = Math.cos(r);
  const P = (dx, dy) => [x + dx * c - dy * s, y + dx * s + dy * c];
  const out = [];
  const [ax, ay] = P(0, 0),
    [bx, by] = P(0, -h);
  out.push({ k: "l", x1: ax, y1: ay, x2: bx, y2: by });
  const [t1x, t1y] = P(-5, -h),
    [t2x, t2y] = P(5, -h);
  out.push({ k: "l", x1: t1x, y1: t1y, x2: t2x, y2: t2y });
  for (let i = 0; i < barras; i++) {
    const yy = -h * (0.45 + i * 0.18);
    const [q1x, q1y] = P(-4, yy + 3),
      [q2x, q2y] = P(4, yy - 3);
    out.push({ k: "l", x1: q1x, y1: q1y, x2: q2x, y2: q2y });
  }
  return out;
}

function dibujarToken(t, cx, base, sig) {
  const prims = [];
  const add = (...a) => prims.push(...a);
  switch (t.tipo) {
    case "sk":
      break;
    case "ch":
      add({ k: "e", cx, cy: base - 5, rx: 6, ry: 3.6, rot: 0 });
      break;
    case "slst":
      add({ k: "dot", cx, cy: base - 4 });
      break;
    case "sc":
      add({ k: "l", x1: cx - 5, y1: base - 2, x2: cx + 5, y2: base - 12 }, { k: "l", x1: cx + 5, y1: base - 2, x2: cx - 5, y2: base - 12 });
      break;
    case "hdc":
      add(...puntoAlto(cx, base, t.alto, 0));
      break;
    case "dc":
      add(...puntoAlto(cx, base, t.alto, 1));
      break;
    case "tr":
      add(...puntoAlto(cx, base, t.alto, 2));
      break;
    case "sol":
      add({ k: "e", cx, cy: base - 6, rx: 17, ry: 3.4, rot: 0 });
      break;
    case "solL":
    case "solR":
      add({ k: "e", cx, cy: base - 14, rx: 15, ry: 3.4, rot: t.tipo === "solR" ? -58 : 58 });
      break;
    case "V":
      add(...puntoAlto(cx, base, 28, 1, -20), ...puntoAlto(cx, base, 28, 1, 20));
      add({ k: "e", cx, cy: base - 30, rx: 5, ry: 3.2, rot: 0 });
      break;
    case "X":
      add(...puntoAlto(cx - 7, base, 30, 1, 22), ...puntoAlto(cx + 7, base, 30, 1, -22));
      break;
    case "puff":
    case "bob":
    case "pop": {
      add({ k: "e", cx, cy: base - 14, rx: t.tipo === "pop" ? 7 : 5.5, ry: 12, rot: 0 });
      add({ k: "l", x1: cx, y1: base - 3, x2: cx, y2: base - 26 });
      if (t.tipo !== "puff") add({ k: "l", x1: cx - 4, y1: base - 16, x2: cx + 4, y2: base - 12 });
      break;
    }
    case "pic":
      for (let i = 0; i < 3; i++) {
        const a = (-90 + (i - 1) * 70) * (Math.PI / 180);
        add({ k: "e", cx: cx + Math.cos(a) * 5, cy: base - 8 + Math.sin(a) * 5, rx: 3.6, ry: 2.4, rot: (a * 180) / Math.PI + 90 });
      }
      break;
    case "arc": {
      const w = t.ancho * U,
        h = t.alto - 4;
      for (let i = 0; i < t.n; i++) {
        const f = (i + 0.5) / t.n;
        const x = cx - w / 2 + f * w;
        const y = base - 4 - Math.sin(f * Math.PI) * h;
        const ang = Math.atan2(-Math.cos(f * Math.PI) * h * Math.PI, w) * (180 / Math.PI);
        add({ k: "e", cx: x, cy: y, rx: 5, ry: 3, rot: ang });
      }
      break;
    }
    case "shell": {
      const ab = Math.min(70, 12 * (t.n - 1));
      for (let i = 0; i < t.n; i++) {
        const rot = t.n === 1 ? 0 : -ab + (2 * ab * i) / (t.n - 1);
        add(...puntoAlto(cx, base, 32, 1, rot));
      }
      break;
    }
    case "cl": {
      const w = (t.ancho - 1) * U;
      for (let i = 0; i < t.n; i++) {
        const x0 = cx - w / 2 + (t.n === 1 ? w / 2 : (w * i) / (t.n - 1));
        add({ k: "l", x1: x0, y1: base, x2: cx, y2: base - 28 });
      }
      add({ k: "l", x1: cx - 5, y1: base - 28, x2: cx + 5, y2: base - 28 });
      add({ k: "e", cx, cy: base - 33, rx: 5, ry: 3.2, rot: 0 });
      break;
    }
    default:
      add({ k: "e", cx, cy: base - 5, rx: 6, ry: 3.6, rot: 0 });
  }
  if (t.fp || t.bp) {
    const d = t.fp ? `M${cx - 4},${base + 3} q4,-7 8,0` : `M${cx - 4},${base - 3} q4,7 8,0`;
    prims.push({ k: "p", d });
  }
  if (t.blo) prims.push({ k: "p", d: `M${cx - 5},${base + 2} q5,5 10,0` });
  return prims.map((p) => ({ ...p, c2: t.c2 }));
}

/** Calcula la geometría completa del gráfico. */
export function geometria(filas) {
  const tokens = filas.map((f) => expandir(f).map(analizar));
  const anchos = tokens.map((r) => r.reduce((s, t) => s + t.ancho, 0));
  const columnas = Math.max(...anchos);
  const margenX = 2 * U;
  let y = 0;
  const prims = [];
  // cadena base
  const nBase = columnas + 2;
  const baseY = 0;
  for (let i = 0; i < nBase; i++) prims.push({ k: "e", cx: margenX + i * U, cy: baseY, rx: 6, ry: 3.6, rot: 0, c2: false });
  prims.push({ k: "p", d: `M${margenX - 9},${baseY} h-8`, c2: false });
  y = baseY - 6;
  tokens.forEach((fila, idx) => {
    const ancho = anchos[idx];
    let x = margenX + U / 2 + ((columnas - ancho) * U) / 2;
    const alto = Math.max(...fila.map((t) => t.alto));
    fila.forEach((t) => {
      const cx = x + ((t.ancho - 1) * U) / 2;
      prims.push(...dibujarToken(t, cx, y + (t.long ? t.alto * 0.4 : 0), 0));
      x += t.ancho * U;
    });
    y -= alto + 7;
  });
  const minY = y - 4;
  return { prims, ancho: margenX * 2 + (nBase - 1) * U, minY, maxY: baseY + 8 };
}

const f1 = (n) => Math.round(n * 10) / 10;

function primSvg(p, extra = "") {
  switch (p.k) {
    case "l":
      return `<line x1="${f1(p.x1)}" y1="${f1(p.y1)}" x2="${f1(p.x2)}" y2="${f1(p.y2)}"${extra}/>`;
    case "e":
      return `<ellipse cx="${f1(p.cx)}" cy="${f1(p.cy)}" rx="${p.rx}" ry="${p.ry}"${p.rot ? ` transform="rotate(${f1(p.rot)} ${f1(p.cx)} ${f1(p.cy)})"` : ""}${extra}/>`;
    case "p":
      return `<path d="${p.d}"${extra}/>`;
    case "dot":
      return `<ellipse cx="${f1(p.cx)}" cy="${f1(p.cy)}" rx="3.2" ry="2.2" fill="currentColor"${extra}/>`;
  }
}

/** Diagrama con simbología estándar; trazos en currentColor como los de la base. */
export function diagramaSvg(filas, titulo) {
  const g = geometria(filas);
  const alto = g.maxY - g.minY;
  const cuerpo = g.prims.map((p) => primSvg(p, p.c2 ? ' stroke="#d0533f"' : "")).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${f1(g.minY)} ${f1(g.ancho)} ${f1(alto)}" width="${f1(g.ancho * 2)}" height="${f1(alto * 2)}" role="img" style="color:#2b2b2b"><title>${titulo}</title><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</g></svg>`;
}

/** Colores de lana por categoría (los mismos de las ilustraciones existentes). */
export const LANA = {
  texturas: ["#628a5f", "#a3c4a0", "#d2e5d0"],
  calados: ["#7563a6", "#b7a6d9", "#ddd3f1"],
  relieve: ["#536c9c", "#8fa9d6", "#c7d5ef"],
  racimos: ["#a85050", "#e98a8a", "#f7c6c6"],
  variaciones_lazada: ["#927a3e", "#d2b878", "#ecdcb2"],
  especiales: ["#b4507a", "#f28fb0", "#f9c9da"],
  bordes: ["#568d6c", "#94c9a9", "#cbe7d5"],
};

/** Ilustración "de lana": misma geometría dibujada en capas (sombra, hebra, brillo). */
export function ilustracionSvg(filas, titulo, categoria) {
  const [oscuro, base, claro] = LANA[categoria] ?? LANA.calados;
  const g = geometria(filas);
  const pad = 14;
  const vb = `${-pad} ${f1(g.minY - pad)} ${f1(g.ancho + pad * 2)} ${f1(g.maxY - g.minY + pad * 2)}`;
  const capa = (cls) => {
    const normales = g.prims.filter((p) => !p.c2).map((p) => primSvg(p).replace('fill="currentColor"', "")).join("");
    const segundo = g.prims.filter((p) => p.c2).map((p) => primSvg(p).replace('fill="currentColor"', "")).join("");
    return `<g class="${cls}">${normales}</g>${segundo ? `<g class="c2"><g class="${cls}">${segundo}</g></g>` : ""}`;
  };
  const estilo = `.yd{stroke:${oscuro};stroke-width:6.6}.yb{stroke:${base};stroke-width:5}.yp{stroke:${claro};stroke-width:4.4;stroke-dasharray:1.3 2.1;stroke-linecap:butt;opacity:.75}.yh{stroke:#fff;stroke-width:1.3;opacity:.38;transform:translate(-.6px,-.8px)}.c2 .yd{stroke:#223556}.c2 .yb{stroke:#3f5a8a}.c2 .yp{stroke:#8098c4}.sh *{stroke:rgba(60,40,20,.3)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img"><title>${titulo}</title><defs><style>${estilo}</style><filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g class="sh" stroke-width="8" filter="url(#soft)" transform="translate(1.2 1.8)">${g.prims.map((p) => primSvg(p).replace('fill="currentColor"', "")).join("")}</g>${capa("yd")}${capa("yb")}${capa("yp")}${capa("yh")}</g></svg>`;
}

/** Envuelve la ilustración en un lienzo 1200x900 con fondo crema, listo para rasterizar. */
export function lienzo(svgInterno) {
  const interno = svgInterno
    .replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*"/, "<svg$1")
    .replace("<svg ", '<svg x="90" y="90" width="1020" height="720" ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><radialGradient id="fondo" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#fbf8f2"/><stop offset="100%" stop-color="#efe5d6"/></radialGradient></defs><rect width="1200" height="900" fill="url(#fondo)"/>${interno}</svg>`;
}
