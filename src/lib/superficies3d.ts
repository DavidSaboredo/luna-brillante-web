// Motor de las prendas del catálogo nuevo. Cada prenda es una superficie continua sobre el maniquí
// (cuerpo, mangas, cuello) y cada zona editable es una región recortada de esa misma superficie:
// así las uniones coinciden exacto y no quedan escalones ni huecos entre zonas.
// Las UV están en metros reales medidos sobre la tela (1 unidad = 100 cm): el motivo del punto
// conserva su tamaño en toda la prenda, aunque la pieza se angoste o se ensanche.
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Quaternion, SphereGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BRAZOS, type Cuerpo } from "./cuerpo3d";

export const TAU = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------------------
// Superficie tabulada: una grilla (u, v) con posiciones, normales y UV en metros
// ---------------------------------------------------------------------------

export interface Tabla {
  us: number[];
  vs: number[];
  pos: Float32Array;
  nor: Float32Array;
  U: Float32Array;
  V: Float32Array;
  /** Las normales se invirtieron para mirar hacia afuera: los triángulos también se dan vuelta */
  invertida: boolean;
  /** Muestras de la grilla ya calculadas (se reutilizan en todas las zonas) */
  nodos: Q[];
}

/** Un punto de la superficie con todo lo necesario para decidir a qué zona pertenece. */
export interface Q {
  u: number;
  v: number;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  U: number;
  V: number;
  /** Índice del nodo de la grilla (−1 si es un punto intermedio) */
  k: number;
}

/** Devuelve un número ≥ 0 si el punto está dentro de la región. */
export type Region = (q: Q) => number;

function celda(arr: number[], x: number): [number, number] {
  const n = arr.length - 1;
  if (x <= arr[0]) return [0, 0];
  if (x >= arr[n]) return [n - 1, 1];
  let lo = 0,
    hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid;
    else hi = mid;
  }
  return [lo, (x - arr[lo]) / (arr[lo + 1] - arr[lo] || 1)];
}

/**
 * Arma la tabla evaluando `punto(u, v)` en la grilla. `afuera` da una dirección de referencia hacia afuera
 * (se usa para orientar las normales). `u0` es la columna donde la UV horizontal vale 0 (por ejemplo, el centro del delantero).
 */
export function crearTabla(
  us: number[],
  vs: number[],
  punto: (u: number, v: number) => [number, number, number],
  afuera: (u: number, v: number, p: [number, number, number]) => [number, number, number],
  o: { cerrada?: boolean; u0?: number; v0?: number } = {},
): Tabla {
  const nu = us.length - 1,
    nv = vs.length - 1,
    W = nu + 1;
  const N = W * (nv + 1);
  const pos = new Float32Array(N * 3);
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const p = punto(us[i], vs[j]);
      pos.set(p, (j * W + i) * 3);
    }
  const P = (i: number, j: number, c: number) => pos[(j * W + i) * 3 + c];
  const nor = new Float32Array(N * 3);
  let votos = 0;
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      let i0 = i - 1,
        i1 = i + 1;
      if (o.cerrada) {
        if (i0 < 0) i0 = nu - 1;
        if (i1 > nu) i1 = 1;
      } else {
        i0 = Math.max(0, i0);
        i1 = Math.min(nu, i1);
      }
      const j0 = Math.max(0, j - 1),
        j1 = Math.min(nv, j + 1);
      const du = [P(i1, j, 0) - P(i0, j, 0), P(i1, j, 1) - P(i0, j, 1), P(i1, j, 2) - P(i0, j, 2)];
      const dv = [P(i, j1, 0) - P(i, j0, 0), P(i, j1, 1) - P(i, j0, 1), P(i, j1, 2) - P(i, j0, 2)];
      let nx = du[1] * dv[2] - du[2] * dv[1],
        ny = du[2] * dv[0] - du[0] * dv[2],
        nz = du[0] * dv[1] - du[1] * dv[0];
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l;
      ny /= l;
      nz /= l;
      const k = (j * W + i) * 3;
      nor[k] = nx;
      nor[k + 1] = ny;
      nor[k + 2] = nz;
      const ref = afuera(us[i], vs[j], [P(i, j, 0), P(i, j, 1), P(i, j, 2)]);
      votos += Math.sign(nx * ref[0] + ny * ref[1] + nz * ref[2]);
    }
  const invertida = votos < 0;
  if (invertida) for (let k = 0; k < nor.length; k++) nor[k] = -nor[k];

  // UV en metros: a lo largo de cada fila desde la columna u0, y a lo largo de cada columna desde la fila v0
  const U = new Float32Array(N),
    V = new Float32Array(N);
  const iu0 = celda(us, o.u0 ?? us[0])[0];
  const iv0 = celda(vs, o.v0 ?? vs[0])[0];
  const dist = (a: number, b: number) => Math.hypot(pos[a * 3] - pos[b * 3], pos[a * 3 + 1] - pos[b * 3 + 1], pos[a * 3 + 2] - pos[b * 3 + 2]);
  for (let j = 0; j <= nv; j++) {
    for (let i = iu0 + 1; i <= nu; i++) U[j * W + i] = U[j * W + i - 1] + dist(j * W + i, j * W + i - 1);
    for (let i = iu0 - 1; i >= 0; i--) U[j * W + i] = U[j * W + i + 1] - dist(j * W + i, j * W + i + 1);
  }
  for (let i = 0; i <= nu; i++) {
    for (let j = iv0 + 1; j <= nv; j++) V[j * W + i] = V[(j - 1) * W + i] + dist(j * W + i, (j - 1) * W + i);
    for (let j = iv0 - 1; j >= 0; j--) V[j * W + i] = V[(j + 1) * W + i] - dist(j * W + i, (j + 1) * W + i);
  }

  const t: Tabla = { us, vs, pos, nor, U, V, invertida, nodos: [] };
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const k = j * W + i;
      t.nodos.push({
        u: us[i],
        v: vs[j],
        x: pos[k * 3],
        y: pos[k * 3 + 1],
        z: pos[k * 3 + 2],
        nx: nor[k * 3],
        ny: nor[k * 3 + 1],
        nz: nor[k * 3 + 2],
        U: U[k],
        V: V[k],
        k,
      });
    }
  return t;
}

/** Punto de la superficie en cualquier (u, v), interpolando la grilla. */
export function muestra(t: Tabla, u: number, v: number): Q {
  const W = t.us.length;
  const [i, a] = celda(t.us, u);
  const [j, b] = celda(t.vs, v);
  const k00 = j * W + i,
    k10 = k00 + 1,
    k01 = k00 + W,
    k11 = k01 + 1;
  const w00 = (1 - a) * (1 - b),
    w10 = a * (1 - b),
    w01 = (1 - a) * b,
    w11 = a * b;
  const m = (arr: Float32Array, c: number, s: number) => arr[k00 * s + c] * w00 + arr[k10 * s + c] * w10 + arr[k01 * s + c] * w01 + arr[k11 * s + c] * w11;
  let nx = m(t.nor, 0, 3),
    ny = m(t.nor, 1, 3),
    nz = m(t.nor, 2, 3);
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l;
  ny /= l;
  nz /= l;
  return { u, v, x: m(t.pos, 0, 3), y: m(t.pos, 1, 3), z: m(t.pos, 2, 3), nx, ny, nz, U: m(t.U, 0, 1), V: m(t.V, 0, 1), k: -1 };
}

export interface OpcZona {
  /** Se despega de la superficie (m), para piezas que van encima (aplicaciones, tapetas) */
  elevar?: number;
  /** UV propias (en metros) para centrar el motivo en la pieza */
  uv?: (q: Q) => [number, number];
}

/**
 * Geometría de la región de la tabla donde todas las `regiones` dan ≥ 0.
 * Las celdas que cruzan un borde se recortan sobre la curva exacta: los bordes quedan lisos.
 */
export function zonaGeo(t: Tabla, regiones: Region[], o: OpcZona = {}): BufferGeometry | null {
  const W = t.us.length,
    H = t.vs.length;
  const pos: number[] = [],
    nor: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  const indiceNodo = new Map<number, number>();
  const elevar = o.elevar ?? 0;
  const agregar = (q: Q) => {
    if (q.k >= 0) {
      const ya = indiceNodo.get(q.k);
      if (ya !== undefined) return ya;
    }
    const n = pos.length / 3;
    pos.push(q.x + q.nx * elevar, q.y + q.ny * elevar, q.z + q.nz * elevar);
    nor.push(q.nx, q.ny, q.nz);
    const [a, b] = o.uv ? o.uv(q) : [q.U, q.V];
    uv.push(a, b);
    if (q.k >= 0) indiceNodo.set(q.k, n);
    return n;
  };
  const tri = (a: number, b: number, c: number) => (t.invertida ? idx.push(a, c, b) : idx.push(a, b, c));
  // valores de cada región en los nodos (se calculan una sola vez)
  const valores = regiones.map((r) => t.nodos.map(r));

  for (let j = 0; j < H - 1; j++)
    for (let i = 0; i < W - 1; i++) {
      const ks = [j * W + i, j * W + i + 1, (j + 1) * W + i + 1, (j + 1) * W + i];
      let todo = true,
        nada = false;
      for (const val of valores) {
        let dentro = 0;
        for (const k of ks) if (val[k] >= 0) dentro++;
        if (dentro === 0) {
          nada = true;
          break;
        }
        if (dentro < 4) todo = false;
      }
      if (nada) continue;
      if (todo) {
        const [a, b, c, d] = ks.map((k) => agregar(t.nodos[k]));
        tri(a, b, c);
        tri(a, c, d);
        continue;
      }
      // recorte de Sutherland–Hodgman en el espacio (u, v), con un paso de refinamiento sobre la región real
      let poli: Q[] = ks.map((k) => t.nodos[k]);
      for (let r = 0; r < regiones.length && poli.length >= 3; r++) {
        const reg = regiones[r];
        const vals = poli.map((q) => (q.k >= 0 ? valores[r][q.k] : reg(q)));
        const out: Q[] = [];
        for (let a = 0; a < poli.length; a++) {
          const b = (a + 1) % poli.length;
          const va = vals[a],
            vb = vals[b];
          if (va >= 0) out.push(poli[a]);
          if (va >= 0 !== vb >= 0) {
            const pa = poli[a],
              pb = poli[b];
            let s = va / (va - vb);
            let q = muestra(t, lerp(pa.u, pb.u, s), lerp(pa.v, pb.v, s));
            const vq = reg(q);
            if (Math.abs(vq) > 1e-9) {
              s = vq >= 0 === va >= 0 ? s + (1 - s) * (vq / (vq - vb)) : s * (va / (va - vq));
              q = muestra(t, lerp(pa.u, pb.u, s), lerp(pa.v, pb.v, s));
            }
            out.push(q);
          }
        }
        poli = out;
      }
      if (poli.length < 3) continue;
      const ids = poli.map(agregar);
      for (let a = 1; a < ids.length - 1; a++) tri(ids[0], ids[a], ids[a + 1]);
    }
  if (!idx.length) return null;
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Filas con más detalle donde la superficie se curva rápido (hombros). */
export function filas(y0: number, y1: number, pasos: [number, number][]): number[] {
  const out = [y0];
  let y = y0;
  while (y < y1 - 1e-6) {
    let paso = pasos[pasos.length - 1][1];
    for (const [hasta, p] of pasos)
      if (y < hasta) {
        paso = p;
        break;
      }
    y = Math.min(y1, y + paso);
    out.push(y);
  }
  return out;
}

export const rango = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n));

// ---------------------------------------------------------------------------
// Cuerpo de la prenda: sigue el torso sin meterse en los huecos (entre el busto, la columna) y cae desde el busto
// ---------------------------------------------------------------------------

/** Altura de la axila del maniquí: por encima, el perfil del cuerpo incluye los brazos. */
export const Y_AXILA = 1.265;

/** Semi-ancho del torso a la altura de la sisa: más afuera ya es brazo (m, talle del modelo). */
const anchoSisa = (y: number) => 0.145 + 0.167 * Math.max(0, y - Y_AXILA);

export interface OpcTorso {
  y0: number;
  y1: number;
  /** Holgura radial sobre el cuerpo (m) */
  holgura: number;
  /** Cuánto se acerca la tela al cuerpo por cada metro que baja desde el busto: 0,2 suelta … 1,5 ceñida */
  caida: number;
  /** Vuelo desde una altura hacia abajo: pendiente (m por m) y pliegues */
  vuelo?: { y: number; pend: number; ondas: number; amp: number };
  seg?: number;
}

/** Radios del contorno convexo (lo que cubre una tela tirante) en cada ángulo. */
function radiosConvexos(px: number[], pz: number[], ths: number[]): number[] {
  const pts = px.map((x, i) => [x, pz[i]] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: number[][] = [],
    hi: number[][] = [];
  for (const p of pts) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  const casco = lo.slice(0, -1).concat(hi.slice(0, -1));
  return ths.map((th) => {
    const dx = Math.sin(th),
      dz = Math.cos(th);
    let mejor = 0;
    for (let k = 0; k < casco.length; k++) {
      const p = casco[k],
        q = casco[(k + 1) % casco.length];
      const ex = q[0] - p[0],
        ez = q[1] - p[1];
      const den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-12) continue;
      const tt = (p[0] * ez - p[1] * ex) / den;
      const s = (p[0] * dz - p[1] * dx) / den;
      if (s >= -1e-6 && s <= 1 + 1e-6 && tt > mejor) mejor = tt;
    }
    return mejor;
  });
}

/** Superficie del cuerpo de la prenda en (θ, y): θ = 0 es el centro del delantero y crece hacia +x. */
export function tablaTorso(cu: Cuerpo, o: OpcTorso): Tabla {
  const seg = o.seg ?? 160;
  const ths = rango(-Math.PI, Math.PI, seg);
  const ys = filas(o.y0, o.y1, [
    [1.35, 0.006],
    [1.418, 0.002],
    [9, 0.005],
  ]);
  // 1) radio del cuerpo, con los brazos aplanados contra el plano de la sisa, y contorno convexo
  const R: number[][] = ys.map((y) => {
    const f = cu.factor(y);
    const xMax = f * anchoSisa(y);
    const rs = ths.map((th) => {
      const r = cu.r(y, th);
      const s = Math.abs(Math.sin(th));
      return y > 1.2 && s > 1e-3 ? Math.min(r, xMax / s) : r;
    });
    return radiosConvexos(
      rs.map((r, i) => r * Math.sin(ths[i])),
      rs.map((r, i) => r * Math.cos(ths[i])),
      ths,
    );
  });
  // 2) la tela cuelga desde el busto (y desde la cadera) en lugar de meterse bajo el pecho
  const out = R.map((fila) => fila.slice());
  for (let i = 0; i <= seg; i++)
    for (let j = 0; j < ys.length; j++) {
      let r = R[j][i];
      for (let jj = j + 1; jj < ys.length && ys[jj] <= Math.min(ys[j] + 0.3, Y_AXILA); jj++) r = Math.max(r, R[jj][i] - o.caida * (ys[jj] - ys[j]));
      out[j][i] = r;
    }
  // 3) holgura (casi nula en los hombros, donde la prenda apoya) y vuelo hacia el ruedo
  let base: number[] | null = null;
  if (o.vuelo) {
    const jv = celda(ys, o.vuelo.y)[0];
    base = out[jv].map((r) => r + o.holgura);
  }
  for (let j = 0; j < ys.length; j++) {
    const y = ys[j];
    const h = o.holgura * (1 - sm(1.3, 1.395, y)) + 0.003;
    for (let i = 0; i <= seg; i++) {
      let r = out[j][i] + h;
      if (o.vuelo && base && y < o.vuelo.y) {
        const d = o.vuelo.y - y;
        r = Math.max(r, base[i] + d * o.vuelo.pend);
        r += o.vuelo.amp * sm(0, 0.22, d) * Math.sin(o.vuelo.ondas * ths[i] + 0.4);
      }
      out[j][i] = r;
    }
  }
  const tabla = crearTabla(
    ths,
    ys,
    (th, y) => {
      const i = Math.round(((th + Math.PI) / TAU) * seg);
      const j = celda(ys, y)[0] + (y >= ys[ys.length - 1] ? 1 : 0);
      const r = out[Math.min(j, ys.length - 1)][i];
      const [cx, cz] = cu.centro(y);
      return [cx + r * Math.sin(th), y, cz + r * Math.cos(th)];
    },
    (th) => [Math.sin(th), 0, Math.cos(th)],
    { cerrada: true, u0: 0 },
  );
  return tabla;
}

// ---------------------------------------------------------------------------
// Regiones habituales
// ---------------------------------------------------------------------------

/** Sisa: elipse en (|θ|, y). */
export interface Sisa {
  tc: number;
  dt: number;
  yc: number;
  b: number;
}

export const SISA_NORMAL: Sisa = { tc: 1.6, dt: 0.44, yc: 1.322, b: 0.066 };

/** ≥ 0 fuera de las dos sisas. */
export const fueraDeSisa =
  (s: Sisa): Region =>
  (q) =>
    Math.hypot((Math.abs(q.u) - s.tc) / s.dt, (q.v - s.yc) / s.b) - 1;

/** Punto del borde de la sisa: t = 0 adelante, π/2 arriba (hombro), π atrás, −π/2 axila. */
export const bordeSisa = (s: Sisa, lado: 1 | -1, t: number): [number, number] => [lado * (s.tc - s.dt * Math.cos(t)), s.yc + s.b * Math.sin(t)];

export interface Escote {
  /** Semiancho del escote en el hombro (m) */
  a: number;
  /** Cuánto baja adelante y atrás desde la base del cuello (m) */
  frente: number;
  espalda: number;
  yBase?: number;
}

/**
 * ≥ 0 donde hay tela: debajo de la base del cuello y fuera de la media elipse del escote
 * (semiancho `a`, profundidad distinta adelante y atrás).
 */
export const debajoDeEscote =
  (e: Escote, zc = 0.012): Region =>
  (q) => {
    const yb = e.yBase ?? 1.405;
    const baja = Math.max(0.002, q.z >= zc ? e.frente : e.espalda);
    const fuera = (Math.hypot(q.x / e.a, (yb - q.y) / baja) - 1) * baja;
    return Math.min(yb - q.y, fuera);
  };

/** El mismo escote agrandado `w` metros: el espacio entre los dos es el ribete o la cartera del escote. */
export const escoteAgrandado = (e: Escote, w: number): Escote => ({
  a: e.a + w,
  frente: e.frente + w,
  espalda: e.espalda + w,
  yBase: e.yBase,
});

/** Todas las regiones a la vez (intersección). */
export const todas =
  (...rs: Region[]): Region =>
  (q) =>
    Math.min(...rs.map((r) => r(q)));
/** Alguna de las regiones (unión). */
export const alguna =
  (...rs: Region[]): Region =>
  (q) =>
    Math.max(...rs.map((r) => r(q)));

/**
 * UV de una pieza de espalda: la horizontal se mide desde el centro de la espalda, así el motivo no se corta
 * en la costura del medio (la tabla del cuerpo empieza y termina ahí).
 */
export const uvEspalda =
  (t: Tabla) =>
  (q: Q): [number, number] => {
    const mitad = muestra(t, q.u >= 0 ? Math.PI : -Math.PI, q.v).U;
    return [mitad - q.U, q.V];
  };

export const negar =
  (r: Region): Region =>
  (q) =>
    -r(q);
export const delante: Region = (q) => Math.PI / 2 - Math.abs(q.u);
export const detras: Region = (q) => Math.abs(q.u) - Math.PI / 2;
export const sobre =
  (y: number): Region =>
  (q) =>
    q.v - y;
export const bajo =
  (y: number): Region =>
  (q) =>
    y - q.v;

/** Altura de la línea del escote en una columna θ (busca el borde por bisección). */
export function yEscote(t: Tabla, e: Escote, th: number): number {
  const reg = debajoDeEscote(e);
  let lo = 1.2,
    hi = t.vs[t.vs.length - 1];
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (reg(muestra(t, th, mid)) >= 0) lo = mid;
    else hi = mid;
  }
  return lo;
}

// ---------------------------------------------------------------------------
// Mangas: nacen del borde exacto de la sisa y se van redondeando alrededor del brazo
// ---------------------------------------------------------------------------

export function ejeBrazo(cu: Cuerpo, lado: 1 | -1): CatmullRomCurve3 {
  const b = BRAZOS[lado === 1 ? "L" : "R"];
  const pts = [b.hombro, b.codo, b.muneca].map((p) => {
    const f = cu.factor(p[1]);
    const lateral = cu.r(p[1], (lado * Math.PI) / 2) / f;
    return new Vector3(p[0] + lado * (f - 1) * lateral, p[1], p[2]);
  });
  return new CatmullRomCurve3(pts, false, "centripetal");
}

export interface OpcManga {
  /** Largo desde la sisa a lo largo del brazo (m) */
  largo: number;
  /** Radio alrededor del brazo arriba y en el puño (m) */
  rIni: number;
  rFin: number;
  /** Ensanche extra hacia el final (manga campana) */
  campana?: number;
  /** Manga kimono: la tela cuelga bajo el brazo (m) */
  colgado?: number;
}

/** Datos del brazo para ubicar mangas, puños y botones. */
export interface Brazo {
  curva: CatmullRomCurve3;
  largoCurva: number;
  s0: number;
}

export function tablaManga(cu: Cuerpo, torso: Tabla, sisa: Sisa, lado: 1 | -1, o: OpcManga): { tabla: Tabla; brazo: Brazo } {
  const curva = ejeBrazo(cu, lado);
  const largoCurva = curva.getLength();
  const ts = rango(-Math.PI / 2, (3 * Math.PI) / 2, 72);
  const ss = filas(0, o.largo, [[9, 0.006]]);
  // borde de la sisa (en la superficie del cuerpo)
  const borde = ts.map((t) => {
    const [th, y] = bordeSisa(sisa, lado, t);
    const q = muestra(torso, th, y);
    return new Vector3(q.x, q.y, q.z);
  });
  // dónde empieza la manga sobre el eje del brazo: a la altura del centro de la sisa
  const centro = borde.reduce((a, p) => a.add(p), new Vector3()).multiplyScalar(1 / borde.length);
  let s0 = 0,
    mejor = Infinity;
  for (let k = 0; k <= 200; k++) {
    const p = curva.getPointAt(k / 200);
    const d = p.distanceTo(centro);
    if (d < mejor) {
      mejor = d;
      s0 = (k / 200) * largoCurva;
    }
  }
  const lateral = new Vector3(lado, 0, 0);
  const marco = (s: number) => {
    const a = s0 + s;
    const u = clamp(a / largoCurva, 0, 1);
    const c = curva.getPointAt(u);
    const T = curva.getTangentAt(u).normalize();
    if (a > largoCurva) c.addScaledVector(T, a - largoCurva);
    const e1 = lateral.clone().addScaledVector(T, -lateral.dot(T)).normalize();
    const eF = new Vector3().crossVectors(T, e1).multiplyScalar(lado).normalize();
    return { c, T, e1, eF };
  };
  const marcos = ss.map(marco);
  const S_CAPA = 0.09;
  const tabla = crearTabla(
    ts,
    ss,
    (t, s) => {
      const i = Math.round(((t + Math.PI / 2) / TAU) * (ts.length - 1));
      const j = celda(ss, s)[0] + (s >= ss[ss.length - 1] ? 1 : 0);
      const { c, e1, eF } = marcos[Math.min(j, ss.length - 1)];
      const dir = e1.clone().multiplyScalar(Math.sin(t)).addScaledVector(eF, Math.cos(t));
      const r = lerp(o.rIni, o.rFin, sm(0, o.largo, s)) + (o.campana ?? 0) * sm(o.largo * 0.45, o.largo, s);
      const circ = c.clone().addScaledVector(dir, r);
      if (o.colgado) circ.y -= o.colgado * sm(0.02, 0.14, s) * Math.max(0, -Math.sin(t)) ** 1.2;
      const w = sm(0, S_CAPA, s);
      const p = borde[i].clone().lerp(circ, w);
      // la copa de la manga se abomba para pasar por encima del hombro
      p.addScaledVector(dir, 4 * w * (1 - w) * 0.014 * Math.max(0, Math.sin(t)));
      // nunca dentro del cuerpo: arriba de la axila el perfil del maniquí incluye el hombro y el brazo
      if (p.y > Y_AXILA && Math.sin(t) > -0.3 && s > 0) {
        const [cx, cz] = cu.centro(p.y);
        const dx = p.x - cx,
          dz = p.z - cz;
        const rp = Math.hypot(dx, dz);
        const rc = cu.r(p.y, Math.atan2(dx, dz)) + 0.006 * sm(0, 0.03, s);
        if (rp < rc) {
          p.x = cx + (dx / rp) * rc;
          p.z = cz + (dz / rp) * rc;
        }
      }
      return [p.x, p.y, p.z];
    },
    (t, s, p) => {
      const { c } = marcos[Math.min(celda(ss, s)[0], ss.length - 1)];
      return [p[0] - c.x, p[1] - c.y, p[2] - c.z];
    },
    { cerrada: true, u0: Math.PI / 2 },
  );
  return { tabla, brazo: { curva, largoCurva, s0 } };
}

/** Largo de la manga (m) para la opción elegida: la larga llega a la muñeca. */
export function largoManga(cu: Cuerpo, mangaCm: number, mangaTalleCm: number): number {
  if (mangaCm <= 0) return 0;
  const curva = ejeBrazo(cu, 1);
  const disponible = curva.getLength() - 0.06;
  return Math.max(0.08, disponible * Math.min(1.04, mangaCm / mangaTalleCm) - 0.02);
}

// ---------------------------------------------------------------------------
// Cuello camisero: pie de cuello y solapa que cae sobre los hombros
// ---------------------------------------------------------------------------

export interface OpcCuello {
  /** Alto del pie (m) */
  pie: number;
  /** Largo de la parte que cae (m) */
  caida: number;
  /** Ángulo libre adelante, a cada lado del centro (rad) */
  abertura: number;
  /** Cuánto se alargan las puntas (m) */
  puntas: number;
}

export function tablaCuello(cu: Cuerpo, torso: Tabla, e: Escote, o: OpcCuello): Tabla {
  const ps = rango(o.abertura, TAU - o.abertura, 96);
  const ws = rango(0, 1, 18);
  const [cx, cz] = cu.centro(1.4);
  const base = ps.map((p) => {
    const th = p > Math.PI ? p - TAU : p;
    const y = yEscote(torso, e, th);
    const q = muestra(torso, th, y);
    return new Vector3(q.x, q.y, q.z);
  });
  // perfil en (afuera, arriba): sube el pie, se dobla y cae hacia afuera
  const perfil = (w: number, extra: number): [number, number] => {
    const pie = o.pie,
      cae = o.caida + extra;
    if (w < 0.38) {
      const a = w / 0.38;
      return [-0.002 * a, pie * a];
    }
    if (w < 0.5) {
      const a = (w - 0.38) / 0.12;
      return [-0.002 + 0.008 * a, pie + 0.005 * Math.sin(a * Math.PI)];
    }
    const a = (w - 0.5) / 0.5;
    return [0.006 + cae * 0.55 * Math.sin(a * 1.2), pie - cae * 0.9 * a];
  };
  return crearTabla(
    ps,
    ws,
    (p, w) => {
      const i = Math.round(((p - o.abertura) / (TAU - 2 * o.abertura)) * (ps.length - 1));
      const b = base[i];
      const fuera = new Vector3(b.x - cx, 0, b.z - cz).normalize();
      // las puntas se alargan cerca del frente
      const dist = Math.min(p - o.abertura, TAU - o.abertura - p);
      const extra = o.puntas * (1 - sm(0, 0.5, dist));
      const [a, h] = perfil(w, extra);
      const pt = b.clone().addScaledVector(fuera, a + 0.002);
      pt.y += h;
      // la parte que cae se apoya sobre la prenda, sin atravesarla
      if (w > 0.5) {
        const th = Math.atan2(pt.x - cx, pt.z - cz);
        const q = muestra(torso, th, pt.y);
        const rT = Math.hypot(q.x - cx, q.z - cz) + 0.004;
        const rp = Math.hypot(pt.x - cx, pt.z - cz);
        if (rp < rT) {
          pt.x = cx + ((pt.x - cx) / rp) * rT;
          pt.z = cz + ((pt.z - cz) / rp) * rT;
        }
      }
      return [pt.x, pt.y, pt.z];
    },
    (p, w, pt) => [pt[0] - cx, w < 0.45 ? 0 : 1, pt[2] - cz],
    { u0: Math.PI },
  );
}

// ---------------------------------------------------------------------------
// Detalles
// ---------------------------------------------------------------------------

/** Botones apenas abombados, apoyados sobre la superficie. */
export function botones(t: Tabla, puntos: [number, number][], radio = 0.0062): BufferGeometry | null {
  const geos: BufferGeometry[] = [];
  for (const [u, v] of puntos) {
    const q = muestra(t, u, v);
    const g = new SphereGeometry(radio, 14, 8);
    g.scale(1, 1, 0.38);
    const n = new Vector3(q.nx, q.ny, q.nz);
    g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), n));
    g.translate(q.x + n.x * 0.004, q.y + n.y * 0.004, q.z + n.z * 0.004);
    geos.push(g);
  }
  if (!geos.length) return null;
  const unido = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return unido;
}
