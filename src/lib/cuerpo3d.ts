// El cuerpo del maniquí (generado con Blender + MPFB, ver scripts/blender) usado para ajustar las prendas y el propio modelo al talle.
// Coordenadas: y arriba, el frente mira a +z. theta = 0 es el frente y crece hacia +x.
import perfil from "@/data/maniqui-perfil.json";
import { cintura, type Medidas } from "./medidas";

interface Fila {
  y: number;
  cx: number;
  cz: number;
  r: number[];
}

const filas = perfil.cuerpo as Fila[];
const piernas = perfil.pierna as Fila[];
export const NT = perfil.ntheta as number;
const PASO = 0.01;
const Y0 = filas[0].y;
const Y1 = filas[filas.length - 1].y;
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const rms = (f: Fila) => Math.sqrt(f.r.reduce((a, b) => a + b * b, 0) / f.r.length);
const fila = (y: number) => filas[clamp(Math.round((y - Y0) / PASO), 0, filas.length - 1)];

/** Alturas de referencia, medidas sobre el modelo. */
export const Y_CADERA = 0.9;
export const Y_CINTURA = 1.06;
export const Y_BUSTO = 1.21;
export const Y_HOMBRO = 1.38;
export const Y_CUELLO = 1.4;
export const Y_ENTREPIERNA = 0.77;

export const BRAZOS = perfil.brazos as Record<"L" | "R", { hombro: number[]; codo: number[]; muneca: number[]; dir: number[]; radio_sup: number; radio_inf: number }>;

export interface Cuerpo {
  /** Factor horizontal que lleva el modelo al talle elegido, según la altura */
  factor: (y: number) => number;
  /** Radio (con el factor aplicado) en la altura y y el ángulo theta */
  r: (y: number, theta: number) => number;
  /** Radio medio (cuadrático) a esa altura */
  radio: (y: number) => number;
  /** Centro del cuerpo a esa altura: [x, z] */
  centro: (y: number) => [number, number];
  /** Punto de la superficie con x dado: devuelve la z del frente (+1) o de la espalda (-1) */
  z: (y: number, x: number, lado: 1 | -1, extra?: number) => number;
  /** Pierna izquierda a esa altura: centro y radio medio (la derecha es el espejo) */
  pierna: (y: number) => { cx: number; cz: number; r: number };
  yMin: number;
  yMax: number;
}

/** Cuánto hay que escalar el cuerpo del modelo en cada nivel para llegar a las medidas del talle. */
function factores(m: Medidas) {
  const ref = (y: number) => rms(fila(y));
  const kB = m.busto / TAU / 100 / ref(Y_BUSTO);
  const kC = cintura(m) / TAU / 100 / ref(Y_CINTURA);
  const kH = m.cadera / TAU / 100 / ref(Y_CADERA);
  return { kB, kC, kH };
}

/** Escala en función de la altura, interpolada entre cadera, cintura y busto. */
function funcionFactor(m: Medidas) {
  const { kB, kC, kH } = factores(m);
  return (y: number) => {
    if (y <= 0.74) return 1;
    if (y < Y_CADERA) return lerp(1, kH, (y - 0.74) / (Y_CADERA - 0.74));
    if (y < Y_CINTURA) return lerp(kH, kC, (y - Y_CADERA) / (Y_CINTURA - Y_CADERA));
    if (y < Y_BUSTO) return lerp(kC, kB, (y - Y_CINTURA) / (Y_BUSTO - Y_CINTURA));
    const hombros = 1 + (kB - 1) * 0.6;
    if (y < 1.34) return lerp(kB, hombros, (y - Y_BUSTO) / (1.34 - Y_BUSTO));
    if (y < 1.44) return lerp(hombros, 1, (y - 1.34) / 0.1);
    return 1;
  };
}

/** Radio del modelo sin escalar. */
function rBruto(y: number, theta: number) {
  const yy = clamp(y, Y0, Y1);
  const t = (yy - Y0) / PASO;
  const i = Math.floor(t);
  const f = t - i;
  const a = filas[Math.min(i, filas.length - 1)],
    b = filas[Math.min(i + 1, filas.length - 1)];
  const u = ((((theta / TAU) % 1) + 1) % 1) * NT;
  const j = Math.floor(u);
  const g = u - j;
  const j0 = j % NT,
    j1 = (j + 1) % NT;
  return lerp(lerp(a.r[j0], a.r[j1], g), lerp(b.r[j0], b.r[j1], g), f);
}

function centroBruto(y: number): [number, number] {
  const yy = clamp(y, Y0, Y1);
  const t = (yy - Y0) / PASO;
  const i = Math.floor(t);
  const f = t - i;
  const a = filas[Math.min(i, filas.length - 1)],
    b = filas[Math.min(i + 1, filas.length - 1)];
  return [lerp(a.cx, b.cx, f), lerp(a.cz, b.cz, f)];
}

export function crearCuerpo(m: Medidas): Cuerpo {
  const factor = funcionFactor(m);
  const centro = centroBruto;
  const r = (y: number, theta: number) => rBruto(y, theta) * factor(y);
  const radio = (y: number) => {
    let s = 0;
    for (let i = 0; i < 16; i++) s += r(y, (i * TAU) / 16) ** 2;
    return Math.sqrt(s / 16);
  };
  const z = (y: number, x: number, lado: 1 | -1, extra = 0) => {
    const [cx, cz] = centro(y);
    let lo = 0,
      hi = Math.PI / 2;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      const th = lado === 1 ? mid : Math.PI - mid;
      const rr = r(y, th) + extra;
      const px = cx + rr * Math.sin(th);
      if (px < Math.abs(x)) lo = mid;
      else hi = mid;
    }
    const mid = (lo + hi) / 2;
    const th = lado === 1 ? mid : Math.PI - mid;
    return cz + (r(y, th) + extra) * Math.cos(th);
  };
  const pierna = (y: number) => {
    const a = piernas.reduce((p, q) => (Math.abs(q.y - y) < Math.abs(p.y - y) ? q : p));
    const k = factor(y) ** 0.5;
    return { cx: a.cx, cz: a.cz, r: (a.r.reduce((s, v) => s + v, 0) / a.r.length) * (y > 0.7 ? k : 1) };
  };
  return { factor, r, radio, centro, z, pierna, yMin: Y0, yMax: Y1 };
}

/**
 * Deforma las posiciones del maniquí (en el lugar) para llevarlo al talle.
 * Dentro del torso se escala la sección; lo que queda afuera (los brazos) solo se desplaza.
 */
export function deformarManiqui(pos: Float32Array, cu: Cuerpo) {
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i],
      y = pos[i + 1],
      z = pos[i + 2];
    const f = cu.factor(y);
    if (Math.abs(f - 1) < 1e-4) continue;
    const [cx, cz] = centroBruto(y);
    const dx = x - cx,
      dz = z - cz;
    const rho = Math.hypot(dx, dz);
    if (rho < 1e-6) continue;
    const th = Math.atan2(dx, dz);
    const rb = rBruto(y, th);
    const nuevo = rho <= rb * 1.03 ? rho * f : rho + (f - 1) * rb;
    pos[i] = cx + (dx / rho) * nuevo;
    pos[i + 2] = cz + (dz / rho) * nuevo;
  }
}
