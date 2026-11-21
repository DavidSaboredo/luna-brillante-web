import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

/** Texturas de tejido dibujadas en canvas: color + relieve (bump), para los modelos 3D. */
export interface TexturaTejido {
  map: Texture;
  bump: Texture;
  /** Mapa de normales (relieve de las puntadas + torsión fina del hilo) */
  normal: Texture;
  /** Tamaño real del motivo repetido, en cm */
  tamCm: number;
  /** El motivo tiene huecos (calado): se recortan y deja ver lo que hay detrás */
  transparente: boolean;
}

const TAM = 256;
const cache = new Map<string, TexturaTejido>();

function mezclar(hex: string, k: number) {
  // k > 0 aclara, k < 0 oscurece
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.max(0, Math.min(255, k >= 0 ? v + (255 - v) * k : v * (1 + k)))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

type Ctx = CanvasRenderingContext2D;
type Modo = "color" | "bump";

/* ───────────── Puntos de crochet: cada motivo se arma con hebras reales ───────────── */

type P = [number, number];
/** Partes del dibujo de un punto, en cm dentro de la baldosa (y crece hacia abajo; las vueltas suben). */
type Elemento =
  | { t: "hebra"; p: P[]; w: number; cerrada?: boolean }
  | { t: "eslabon"; x: number; y: number; largo: number; ang: number; w: number }
  | { t: "bola"; x: number; y: number; r: number };

interface Motivo {
  /** Lado de la baldosa en cm */
  tam: number;
  /** true: entre las hebras queda hueco (se ve a través) */
  calado: boolean;
  el: Elemento[];
}

/** Vareta (o punto alto): poste con la lazada cruzada y las dos hebras de arriba. */
function vareta(el: Elemento[], x0: number, y0: number, x1: number, y1: number, w: number, cabeza = true) {
  el.push({ t: "hebra", p: [[x0, y0], [x1, y1]], w });
  const L = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / L,
    uy = (y1 - y0) / L;
  const mx = x0 + (x1 - x0) * 0.42,
    my = y0 + (y1 - y0) * 0.42,
    a = w * 0.5;
  // la lazada: una vuelta en diagonal sobre el poste
  el.push({
    t: "hebra",
    p: [
      [mx - uy * a - ux * a * 0.7, my + ux * a - uy * a * 0.7],
      [mx + uy * a + ux * a * 0.7, my - ux * a + uy * a * 0.7],
    ],
    w: w * 0.48,
  });
  if (cabeza) el.push({ t: "eslabon", x: x1 + ux * w * 0.15, y: y1 + uy * w * 0.15, largo: w * 1.9, ang: Math.atan2(ux, -uy), w: w * 0.38 });
}

/** Cadena de eslabones a lo largo de una curva suave entre dos puntos. */
function cadena(el: Elemento[], a: P, b: P, curva: number, n: number, w: number) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const ctrl: P = [(a[0] + b[0]) / 2 + (dy / L) * curva * L, (a[1] + b[1]) / 2 - (dx / L) * curva * L];
  const punto = (t: number): P => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1],
  ];
  let largo = 0;
  for (let i = 0; i < 12; i++) {
    const p = punto(i / 12),
      q = punto((i + 1) / 12);
    largo += Math.hypot(q[0] - p[0], q[1] - p[1]);
  }
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const p = punto(t - 0.01),
      q = punto(t + 0.01);
    const [x, y] = punto(t);
    el.push({ t: "eslabon", x, y, largo: (largo / n) * 1.12, ang: Math.atan2(q[1] - p[1], q[0] - p[0]), w });
  }
}

/** Punto bajo: filas de "V" con la trenza de arriba. */
function mBajo(): Motivo {
  const tam = 2.4,
    cols = 5,
    filas = 6,
    P = tam / cols,
    H = tam / filas,
    el: Elemento[] = [];
  for (let j = filas - 1; j >= 0; j--) {
    const yt = j * H,
      yb = yt + H;
    for (let i = 0; i < cols; i++) {
      const x = i * P + P / 2;
      el.push({ t: "hebra", p: [[x - P * 0.3, yt + H * 0.22], [x, yb + H * 0.05]], w: 0.115 });
      el.push({ t: "hebra", p: [[x + P * 0.3, yt + H * 0.22], [x, yb + H * 0.05]], w: 0.115 });
    }
    for (let i = 0; i < cols; i++) el.push({ t: "eslabon", x: i * P + P / 2, y: yt + H * 0.14, largo: P * 0.95, ang: 0, w: 0.07 });
  }
  return { tam, calado: false, el };
}

/** Varetas: postes altos uno al lado del otro. */
function mVareta(): Motivo {
  const tam = 3.6,
    cols = 6,
    filas = 3,
    P = tam / cols,
    H = tam / filas,
    el: Elemento[] = [];
  for (let j = filas - 1; j >= 0; j--) {
    const yt = j * H,
      yb = yt + H;
    for (let i = 0; i < cols; i++) vareta(el, i * P + P / 2, yb + 0.02, i * P + P / 2, yt + 0.14, 0.2);
  }
  return { tam, calado: false, el };
}

/** Relieve: varetas en relieve por delante (gruesas) y por detrás (hundidas). */
function mRelieve(): Motivo {
  const tam = 3.2,
    cols = 8,
    filas = 2,
    P = tam / cols,
    H = tam / filas,
    el: Elemento[] = [];
  for (let j = 0; j < filas; j++)
    for (let i = 1; i < cols; i += 2) vareta(el, i * P + P / 2, (j + 1) * H, i * P + P / 2, j * H + 0.1, 0.16);
  for (let j = 0; j < filas; j++)
    for (let i = 0; i < cols; i += 2) vareta(el, i * P + P / 2, (j + 1) * H + 0.08, i * P + P / 2, j * H + 0.04, 0.3, false);
  return { tam, calado: false, el };
}

/** Racimos / motas: bolitas en tresbolillo sobre una base de punto bajo. */
function mMotas(): Motivo {
  const tam = 3,
    cols = 4,
    filas = 4,
    P = tam / cols,
    H = tam / filas,
    el: Elemento[] = [];
  for (let j = filas - 1; j >= 0; j--) {
    const yt = j * H,
      off = (j % 2) * (P / 2);
    for (let i = 0; i < cols; i++) {
      const x = i * P + off;
      el.push({ t: "hebra", p: [[x - 0.12, yt + H * 0.2], [x, yt + H * 0.7], [x + 0.12, yt + H * 0.2]], w: 0.11 });
    }
    for (let i = 0; i < cols; i++) {
      const x = i * P + off + P / 2,
        y0 = yt + H * 0.92,
        y1 = yt + H * 0.1;
      for (const d of [-0.27, 0.27, -0.13, 0.13, 0])
        el.push({ t: "hebra", p: [[x + d * 0.25, y0], [x + d, (y0 + y1) / 2], [x + d * 0.3, y1]], w: 0.13 });
      el.push({ t: "eslabon", x, y: y1, largo: 0.3, ang: 0, w: 0.07 });
    }
  }
  return { tam, calado: false, el };
}

/** Tunecino: barras verticales con la hebra de vuelta abajo. */
function mTunecino(): Motivo {
  const tam = 2.4,
    cols = 6,
    filas = 8,
    P = tam / cols,
    H = tam / filas,
    el: Elemento[] = [];
  for (let j = 0; j < filas; j++) {
    const yt = j * H,
      yb = yt + H;
    el.push({ t: "hebra", p: [[0, yb - 0.04], [tam, yb - 0.04]], w: 0.08 });
    for (let i = 0; i < cols; i++) el.push({ t: "hebra", p: [[i * P + P / 2, yb - 0.03], [i * P + P / 2, yt + 0.05]], w: 0.16 });
  }
  return { tam, calado: false, el };
}

/**
 * Abanicos (conchas): varias varetas nacen del mismo punto y se abren; un punto bajo
 * en el centro de cada abanico sostiene los de la vuelta siguiente, corridos medio motivo.
 */
function mAbanico(tam: number, porFila: number, filas: number, varetas: number, w: number): Motivo {
  const P = tam / porFila,
    H = tam / filas,
    s = H * 0.42, // alto del punto bajo
    L = 2 * H - s, // largo de cada vareta
    abre = Math.asin(Math.min(0.97, (P * 0.49) / L)),
    el: Elemento[] = [];
  for (let j = filas - 1; j >= 0; j--) {
    const b = (j + 1) * H,
      off = (j % 2) * (P / 2);
    for (let i = 0; i < porFila; i++) {
      const xc = i * P + off;
      // punto bajo entre abanicos, apoyado en el centro del abanico de abajo
      const xs = xc + P / 2;
      el.push({ t: "hebra", p: [[xs, b - (L - H)], [xs, b - H + 0.04]], w: w * 0.9 });
      el.push({ t: "bola", x: xs, y: b - H + 0.06, r: w * 0.6 });
      // varetas desde la base común
      const tips: P[] = [];
      for (let k = 0; k < varetas; k++) {
        const phi = -abre + (2 * abre * k) / (varetas - 1);
        const tip: P = [xc + Math.sin(phi) * L, b - Math.cos(phi) * L];
        tips.push(tip);
        vareta(el, xc + Math.sin(phi) * 0.06, b - Math.cos(phi) * 0.06, tip[0], tip[1], w, false);
      }
      // borde del abanico: las cabezas de las varetas forman la onda
      const paso = 2 * abre * L / (varetas - 1);
      for (let k = 0; k < varetas; k++) {
        const phi = -abre + (2 * abre * k) / (varetas - 1);
        el.push({ t: "eslabon", x: tips[k][0], y: tips[k][1], largo: Math.min(paso * 0.85, w * 2.2), ang: phi, w: w * 0.36 });
      }
      el.push({ t: "bola", x: xc, y: b - 0.04, r: w * 0.75 });
    }
  }
  return { tam, calado: true, el };
}

/** Red de arcos de cadena unidos con puntos bajos. */
function mRed(): Motivo {
  const tam = 4.5,
    porFila = 2,
    filas = 4,
    P = tam / porFila,
    H = tam / filas,
    el: Elemento[] = [];
  const nudo = (i: number, j: number): P => [i * P + (j % 2) * (P / 2), j * H + H / 2];
  for (let j = filas; j >= 0; j--)
    for (let i = -1; i <= porFila; i++) {
      const a = nudo(i, j);
      const arriba: P = [a[0] + P / 2, a[1] - H];
      const siguiente: P = [a[0] + P, a[1]];
      cadena(el, a, arriba, 0.16, 4, 0.085);
      cadena(el, arriba, siguiente, 0.16, 4, 0.085);
    }
  for (let j = 0; j < filas; j++) for (let i = 0; i < porFila; i++) el.push({ t: "bola", x: nudo(i, j)[0], y: nudo(i, j)[1], r: 0.12 });
  return { tam, calado: true, el };
}

/** Red de filet: cuadraditos de varetas y cadenas; con `bloques` alterna cuadros llenos. */
function mFilete(bloques: boolean): Motivo {
  const tam = 4,
    n = 4,
    c = tam / n,
    el: Elemento[] = [];
  for (let j = n - 1; j >= 0; j--) {
    const yt = j * c,
      yb = yt + c;
    for (let i = 0; i < n; i++) {
      const lleno = bloques && (i + j) % 2 === 0;
      vareta(el, i * c, yb, i * c, yt + 0.1, 0.19);
      if (lleno) {
        vareta(el, i * c + c / 3, yb, i * c + c / 3, yt + 0.1, 0.19);
        vareta(el, i * c + (2 * c) / 3, yb, i * c + (2 * c) / 3, yt + 0.1, 0.19);
      } else {
        el.push({ t: "eslabon", x: i * c + c * 0.33, y: yt + 0.07, largo: c * 0.36, ang: 0, w: 0.075 });
        el.push({ t: "eslabon", x: i * c + c * 0.67, y: yt + 0.07, largo: c * 0.36, ang: 0, w: 0.075 });
      }
    }
  }
  return { tam, calado: true, el };
}

/** Punto V: dos varetas abiertas desde el mismo punto con una cadena en el medio. */
function mUves(): Motivo {
  const tam = 4,
    porFila = 3,
    filas = 4,
    P = tam / porFila,
    H = tam / filas,
    el: Elemento[] = [];
  for (let j = filas - 1; j >= 0; j--) {
    const yt = j * H,
      yb = yt + H;
    for (let i = 0; i < porFila; i++) {
      const x = i * P + P / 2;
      vareta(el, x - 0.05, yb + 0.02, x - 0.36, yt + 0.12, 0.19);
      vareta(el, x + 0.05, yb + 0.02, x + 0.36, yt + 0.12, 0.19);
      el.push({ t: "eslabon", x, y: yt + 0.16, largo: 0.3, ang: 0, w: 0.075 });
      el.push({ t: "bola", x, y: yb, r: 0.1 });
    }
  }
  return { tam, calado: true, el };
}

/** Punto granny en filas: grupos de 3 varetas en el espacio entre los grupos de abajo. */
function mGrannyFilas(): Motivo {
  const tam = 4.8,
    porFila = 3,
    filas = 4,
    P = tam / porFila,
    H = tam / filas,
    el: Elemento[] = [];
  for (let j = filas - 1; j >= 0; j--) {
    const yt = j * H,
      yb = yt + H,
      off = (j % 2) * (P / 2);
    for (let i = 0; i < porFila; i++) {
      const x = i * P + off + P / 4;
      for (let k = -1; k <= 1; k++) vareta(el, x + k * 0.12, yb + 0.02, x + k * 0.4, yt + 0.12, 0.2);
    }
  }
  return { tam, calado: true, el };
}

/** Cuadrado granny: anillo central, tres vueltas de grupos de 3 varetas, esquinas abiertas y costura de unión. */
function mGranny(): Motivo {
  const tam = 8,
    m = tam / 2,
    el: Elemento[] = [];
  // borde de unión con el cuadrado vecino
  el.push({ t: "hebra", p: [[0.04, 0.04], [tam - 0.04, 0.04], [tam - 0.04, tam - 0.04], [0.04, tam - 0.04]], w: 0.2, cerrada: true });
  // anillo del centro
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    el.push({ t: "eslabon", x: m + Math.cos(a) * 0.42, y: m + Math.sin(a) * 0.42, largo: 0.36, ang: a + Math.PI / 2, w: 0.08 });
  }
  const lados: [number, number][] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const g = 2.15;
  for (let r = 1; r <= 3; r++) {
    const dIn = 0.6 + (r - 1) * 1.13,
      dOut = dIn + 1.08;
    for (const [nx, ny] of lados) {
      // tx, ty: dirección a lo largo del lado
      const tx = -ny,
        ty = nx;
      for (let k = 0; k < r; k++) {
        const t = (k - (r - 1) / 2) * g;
        for (let q = -1; q <= 1; q++) {
          const tb = t + q * 0.16,
            tt = t + q * 0.5;
          vareta(el, m + nx * dIn + tx * tb, m + ny * dIn + ty * tb, m + nx * (dOut - 0.1) + tx * tt, m + ny * (dOut - 0.1) + ty * tt, 0.2);
        }
      }
      // esquina: dos cadenas en diagonal
      const ex = nx + tx,
        ey = ny + ty;
      const d = dOut - 0.2;
      el.push({ t: "eslabon", x: m + ex * d - tx * 0.22, y: m + ey * d - ty * 0.22, largo: 0.34, ang: Math.atan2(ty, tx), w: 0.075 });
      el.push({ t: "eslabon", x: m + ex * d - nx * 0.22, y: m + ey * d - ny * 0.22, largo: 0.34, ang: Math.atan2(ny, nx), w: 0.075 });
    }
  }
  return { tam, calado: true, el };
}

/** Flores calada: flores de 8 pétalos unidas con puentes de cadenas. */
function mFlores(): Motivo {
  const tam = 6,
    el: Elemento[] = [];
  const rIn = 0.3,
    rOut = 1.3;
  const flor = (cx: number, cy: number) => {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const rot = (u: number, v: number): P => [cx + Math.cos(a) * u - Math.sin(a) * v, cy + Math.sin(a) * u + Math.cos(a) * v];
      for (const d of [-0.17, 0, 0.17]) vareta(el, ...rot(rIn + 0.05, d * 0.3), ...rot(rOut - 0.18, d), 0.15, false);
      el.push({
        t: "hebra",
        p: [rot(rIn, 0), rot(0.6, 0.24), rot(0.95, 0.3), rot(1.2, 0.2), rot(rOut, 0), rot(1.2, -0.2), rot(0.95, -0.3), rot(0.6, -0.24)],
        w: 0.12,
        cerrada: true,
      });
    }
    el.push({ t: "bola", x: cx, y: cy, r: 0.26 });
  };
  const aro = (cx: number, cy: number) => {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      el.push({ t: "eslabon", x: cx + Math.cos(a) * 0.3, y: cy + Math.sin(a) * 0.3, largo: 0.32, ang: a + Math.PI / 2, w: 0.075 });
    }
  };
  const puente = (a: P, b: P, n: number) => cadena(el, a, b, 0.05, n, 0.08);
  const r = rOut - 0.05,
    dg = r / Math.SQRT2;
  // puentes en diagonal entre la flor del centro y las de las esquinas
  for (const [sx, sy] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ])
    puente([3 + sx * dg, 3 + sy * dg], [3 + sx * (3 - dg), 3 + sy * (3 - dg)], 4);
  // puentes rectos hacia los aros de unión
  for (const [cx, cy] of [
    [3, 3],
    [0, 0],
  ])
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      puente([cx + dx * r, cy + dy * r], [cx + dx * 2.65, cy + dy * 2.65], 3);
  aro(3, 0);
  aro(0, 3);
  flor(3, 3);
  flor(0, 0);
  return { tam, calado: true, el };
}

const MOTIVOS: Record<string, () => Motivo> = {
  bajo: mBajo,
  vareta: mVareta,
  relieve: mRelieve,
  motas: mMotas,
  tunecino: mTunecino,
  concha: () => mAbanico(5, 2, 4, 5, 0.22),
  abanico: () => mAbanico(6, 2, 6, 7, 0.19),
  red: mRed,
  filete: () => mFilete(false),
  filete_bloques: () => mFilete(true),
  uves: mUves,
  granny_filas: mGrannyFilas,
  granny: mGranny,
  flores: mFlores,
};

function caminoDe(e: Elemento): Path2D {
  const c = new Path2D();
  if (e.t === "eslabon") {
    c.ellipse(e.x, e.y, e.largo / 2, e.largo * 0.27, e.ang, 0, Math.PI * 2);
    return c;
  }
  if (e.t === "bola") {
    c.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    return c;
  }
  const p = e.p;
  const medio = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (e.cerrada && p.length > 2) {
    const ini = medio(p[p.length - 1], p[0]);
    c.moveTo(...ini);
    for (let i = 0; i < p.length; i++) c.quadraticCurveTo(...p[i], ...medio(p[i], p[(i + 1) % p.length]));
    c.closePath();
  } else if (p.length > 2) {
    c.moveTo(...p[0]);
    for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(...p[i], ...medio(p[i], p[i + 1]));
    c.lineTo(...p[p.length - 1]);
  } else {
    c.moveTo(...p[0]);
    c.lineTo(...p[1]);
  }
  return c;
}

/** Caja que ocupa el elemento, para dibujar solo las copias que caen dentro de la baldosa. */
function caja(e: Elemento): [number, number, number, number] {
  if (e.t === "bola") return [e.x - e.r, e.y - e.r, e.x + e.r, e.y + e.r];
  if (e.t === "eslabon") return [e.x - e.largo, e.y - e.largo, e.x + e.largo, e.y + e.largo];
  const xs = e.p.map((q) => q[0]),
    ys = e.p.map((q) => q[1]);
  return [Math.min(...xs) - e.w, Math.min(...ys) - e.w, Math.max(...xs) + e.w, Math.max(...ys) + e.w];
}

/** Dibuja la hebra en capas: borde oscuro, cuerpo del color y brillo arriba a la izquierda (o alturas en el relieve). */
function dibujarElemento(c: Ctx, e: Elemento, modo: Modo, color: string, px: number) {
  const camino = caminoDe(e);
  if (e.t === "bola") {
    if (modo === "color") {
      c.fillStyle = mezclar(color, -0.55);
      c.beginPath();
      c.arc(e.x, e.y, e.r + px * 1.3, 0, Math.PI * 2);
      c.fill();
      const g = c.createRadialGradient(e.x - e.r * 0.3, e.y - e.r * 0.35, e.r * 0.08, e.x, e.y, e.r);
      g.addColorStop(0, mezclar(color, 0.45));
      g.addColorStop(0.55, color);
      g.addColorStop(1, mezclar(color, -0.3));
      c.fillStyle = g;
    } else {
      const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, "#fff");
      g.addColorStop(1, "#666");
      c.fillStyle = g;
    }
    c.fill(camino);
    return;
  }
  const w = e.w;
  c.lineCap = "round";
  c.lineJoin = "round";
  if (modo === "color") {
    c.strokeStyle = mezclar(color, -0.55);
    c.lineWidth = w + px * 2.4;
    c.stroke(camino);
    c.strokeStyle = color;
    c.lineWidth = w;
    c.stroke(camino);
    c.save();
    c.translate(-w * 0.13, -w * 0.13);
    c.strokeStyle = mezclar(color, 0.42);
    c.lineWidth = w * 0.3;
    c.stroke(camino);
    c.restore();
  } else {
    const capas: [number, string][] = [
      [w + px * 2.4, "#262626"],
      [w, "#8a8a8a"],
      [w * 0.62, "#c2c2c2"],
      [w * 0.26, "#ffffff"],
    ];
    for (const [ancho, tono] of capas) {
      c.strokeStyle = tono;
      c.lineWidth = ancho;
      c.stroke(camino);
    }
  }
}

function dibujarMotivo(c: Ctx, motivo: Motivo, modo: Modo, color: string) {
  const s = TAM / motivo.tam,
    t = motivo.tam;
  if (motivo.calado) {
    if (modo === "bump") {
      c.fillStyle = "#000";
      c.fillRect(0, 0, TAM, TAM);
    } else c.clearRect(0, 0, TAM, TAM);
  } else {
    c.fillStyle = modo === "bump" ? "#1c1c1c" : mezclar(color, -0.42);
    c.fillRect(0, 0, TAM, TAM);
  }
  for (const e of motivo.el) {
    const [x0, y0, x1, y1] = caja(e);
    // cada hebra se repite en las 8 baldosas vecinas para que el motivo empalme sin costura
    for (const dy of [-t, 0, t])
      for (const dx of [-t, 0, t]) {
        if (x1 + dx < 0 || x0 + dx > t || y1 + dy < 0 || y0 + dy > t) continue;
        c.setTransform(s, 0, 0, s, dx * s, dy * s);
        dibujarElemento(c, e, modo, color, 1 / s);
      }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
}

/* ───────────── Telas ───────────── */

/** Dibuja un trazo en el color y en el relieve a la vez. */
type Trazo = (c: Ctx, modo: Modo, claro: string, oscuro: string, base: string) => void;

/** Telas: tramado fino. */
const tejido =
  (paso: number, diagonal = false, grosor = 1.6): Trazo =>
  (c, modo, claro) => {
    c.lineWidth = grosor;
    for (let i = -TAM; i < TAM * 2; i += paso) {
      c.strokeStyle = modo === "bump" ? "rgba(255,255,255,0.8)" : claro;
      c.beginPath();
      if (diagonal) {
        c.moveTo(i, 0);
        c.lineTo(i + TAM, TAM);
      } else {
        c.moveTo(i, 0);
        c.lineTo(i, TAM);
        c.moveTo(0, i);
        c.lineTo(TAM, i);
      }
      c.stroke();
    }
  };

const tul: Trazo = (c, modo, claro) => {
  const t = 8;
  for (let y = 0; y < TAM; y += t)
    for (let x = 0; x < TAM; x += t) {
      c.fillStyle = modo === "bump" ? "#999" : claro;
      c.beginPath();
      c.arc(x + ((y / t) % 2) * (t / 2), y, 1.5, 0, Math.PI * 2);
      c.fill();
    }
};

const TELAS: Record<string, { trazo: Trazo; tam: number }> = {
  lino: { trazo: tejido(6), tam: 3 },
  algodon: { trazo: tejido(10, false, 1), tam: 3 },
  gasa: { trazo: tejido(14, false, 0.8), tam: 4 },
  tul: { trazo: tul, tam: 3 },
  denim: { trazo: tejido(5, true, 2), tam: 3 },
};

/** Fibras muy finas para que no se vea plano; solo sobre el hilo, nunca sobre los huecos. */
function ruido(c: Ctx, base: string) {
  c.save();
  c.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * TAM,
      y = Math.random() * TAM,
      l = 2 + Math.random() * 4,
      a = Math.random() * Math.PI;
    c.strokeStyle = Math.random() > 0.5 ? mezclar(base, 0.14) : mezclar(base, -0.14);
    c.globalAlpha = 0.35;
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  c.restore();
}

/** Torsión fina del hilo: rayitas diagonales sobre el relieve, para que cada puntada parezca lana y no plástico. */
function torsionDeHilo(c: Ctx) {
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineWidth = 1.1;
  c.strokeStyle = "rgba(255,255,255,0.075)";
  for (let i = -TAM; i < TAM * 2; i += 4) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i + TAM * 0.55, TAM);
    c.stroke();
  }
  c.restore();
}

/** Convierte el mapa de alturas (gris) en un mapa de normales con un filtro de Sobel, repetible sin costuras. */
function normalDesdeAltura(origen: HTMLCanvasElement, fuerza: number): HTMLCanvasElement {
  const n = origen.width;
  const c = origen.getContext("2d")!;
  const src = c.getImageData(0, 0, n, n).data;
  const h = (x: number, y: number) => src[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;
  const dst = document.createElement("canvas");
  dst.width = dst.height = n;
  const dc = dst.getContext("2d")!;
  const out = dc.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1);
      const dy = h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1);
      let nx = -dx * fuerza,
        ny = dy * fuerza,
        nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      const i = (y * n + x) * 4;
      out.data[i] = (nx * 0.5 + 0.5) * 255;
      out.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      out.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  dc.putImageData(out, 0, 0);
  return dst;
}

/** Motivo de un punto o tela; los nombres viejos que ya no existen caen en punto bajo. */
function datosDe(textura: string) {
  const tela = TELAS[textura];
  if (tela) return { tam: tela.tam, calado: false, dibujar: (c: Ctx, modo: Modo, color: string) => {
    c.fillStyle = modo === "bump" ? "#202020" : mezclar(color, -0.22);
    c.fillRect(0, 0, TAM, TAM);
    tela.trazo(c, modo, mezclar(color, 0.1), mezclar(color, -0.45), color);
  } };
  const motivo = (MOTIVOS[textura] ?? MOTIVOS.bajo)();
  return { tam: motivo.tam, calado: motivo.calado, dibujar: (c: Ctx, modo: Modo, color: string) => dibujarMotivo(c, motivo, modo, color) };
}

export function crearTextura(textura: string, color: string): TexturaTejido {
  const clave = `${textura}|${color}`;
  const hecha = cache.get(clave);
  if (hecha) return hecha;

  const d = datosDe(textura);
  const hacer = (modo: Modo) => {
    const lienzo = document.createElement("canvas");
    lienzo.width = lienzo.height = TAM;
    const c = lienzo.getContext("2d")!;
    d.dibujar(c, modo, color);
    if (modo === "color") ruido(c, color);
    if (modo === "bump") torsionDeHilo(c);
    const t = new CanvasTexture(lienzo);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
    if (modo === "color") t.colorSpace = SRGBColorSpace;
    return t;
  };
  const bump = hacer("bump");
  const normalCanvas = normalDesdeAltura(bump.image as HTMLCanvasElement, 3.4);
  const normal = new CanvasTexture(normalCanvas);
  normal.wrapS = normal.wrapT = RepeatWrapping;
  normal.anisotropy = 8;
  const res = { map: hacer("color"), bump, normal, tamCm: d.tam, transparente: d.calado };
  cache.set(clave, res);
  return res;
}

const muestras = new Map<string, string>();
/** Imagen (data URL) de la misma baldosa que se aplica en la prenda, para las miniaturas del selector. */
export function muestraTextura(textura: string, color: string): string {
  const clave = `${textura}|${color}`;
  const hecha = muestras.get(clave);
  if (hecha) return hecha;
  const url = (crearTextura(textura, color).map.image as HTMLCanvasElement).toDataURL("image/png");
  muestras.set(clave, url);
  return url;
}
