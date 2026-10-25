// Puntadas de crochet en 3D: cada puntada es un hilo (TubeGeometry sobre CatmullRomCurve3)
// que atraviesa la lazada de la hilera de abajo. También genera el normal map del hilo.
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  LinearSRGBColorSpace,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type TipoPuntada = "cadena" | "pasado" | "bajo" | "media" | "vareta" | "doble";

export interface InfoPuntada {
  id: TipoPuntada;
  nombre: string;
  /** Id del punto en la biblioteca */
  punto: string;
  /** Altura de la puntada en anchos de puntada */
  alto: number;
  /** Vueltas de hilo (lazadas) alrededor del poste */
  vueltas: number;
  explicacion: string;
}

export const PUNTADAS: InfoPuntada[] = [
  {
    id: "cadena",
    nombre: "Cadeneta",
    punto: "chain",
    alto: 0,
    vueltas: 0,
    explicacion: "Cada eslabón es una lazada que pasa por la anterior; los eslabones se abrazan en ángulo recto.",
  },
  {
    id: "pasado",
    nombre: "Punto raso",
    punto: "slip_stitch",
    alto: 0.4,
    vueltas: 0,
    explicacion: "El más bajito: el hilo pasa por el punto y por la lazada de la aguja de una sola vez.",
  },
  {
    id: "bajo",
    nombre: "Punto bajo",
    punto: "single_crochet",
    alto: 0.82,
    vueltas: 0,
    explicacion: "Un poste corto que atraviesa la lazada de abajo y se cierra en una lazada arriba.",
  },
  {
    id: "media",
    nombre: "Media vareta",
    punto: "half_double_crochet",
    alto: 1.15,
    vueltas: 1,
    explicacion: "Una lazada previa (hilo sobre la aguja) abraza el poste y lo hace más alto.",
  },
  {
    id: "vareta",
    nombre: "Vareta",
    punto: "double_crochet",
    alto: 1.5,
    vueltas: 1,
    explicacion: "Poste alto con una lazada a media altura; se cierra en dos tiempos.",
  },
  {
    id: "doble",
    nombre: "Vareta doble",
    punto: "treble_crochet",
    alto: 1.95,
    vueltas: 2,
    explicacion: "Dos lazadas previas: el poste es todavía más alto y lleva dos vueltas de hilo.",
  },
];

export interface ParamsMuestra {
  tipo: TipoPuntada;
  filas: number;
  columnas: number;
  /** Radio del hilo respecto del ancho de la puntada (0.07 – 0.18) */
  grosor: number;
  /** 0 = flojo, 1 = apretado */
  tension: number;
  /** Separación vertical extra entre hileras para ver cómo se enlazan (0 – 1) */
  separacion: number;
}

export interface Muestra {
  /** Hileras pares (incluye la cadeneta de base) y hileras impares, para colorearlas distinto */
  a: BufferGeometry;
  b: BufferGeometry;
  ancho: number;
  alto: number;
  /** Largo real de una vuelta de torsión, en unidades del modelo */
  torsion: number;
}

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pseudoaleatorio determinista para que la muestra no cambie al volver a dibujarla. */
function azar(semilla: number) {
  let s = semilla * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

interface Tubo {
  puntos: Vector3[];
  cerrado: boolean;
}

function anillo(cx: number, cy: number, cz: number, rx: number, rz: number, inclinacion: number, fase: number, rnd: () => number): Tubo {
  const n = 14;
  const pts: Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const a = fase + (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const z0 = Math.sin(a) * rz;
    // el anillo está inclinado hacia delante, como la «V» de una puntada vista de frente
    const y = -z0 * Math.sin(inclinacion);
    const z = z0 * Math.cos(inclinacion);
    pts.push(new Vector3(cx + x + (rnd() - 0.5) * 0.01, cy + y, cz + z + (rnd() - 0.5) * 0.01));
  }
  return { puntos: pts, cerrado: true };
}

function eslabon(cx: number, cy: number, largo: number, ancho: number, giro: number, rnd: () => number): Tubo {
  const n = 16;
  const pts: Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * largo;
    const t = Math.sin(a) * ancho;
    pts.push(new Vector3(cx + x, cy + t * Math.cos(giro) + (rnd() - 0.5) * 0.008, t * Math.sin(giro)));
  }
  return { puntos: pts, cerrado: true };
}

function vuelta(cx: number, cy: number, radio: number, desde: number, rnd: () => number): Tubo {
  // una lazada que da una vuelta alrededor del poste
  const n = 11;
  const pts: Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = desde + (i / n) * TAU * 1.05;
    pts.push(new Vector3(cx + Math.cos(a) * radio, cy + (i / n - 0.5) * 0.1 + (rnd() - 0.5) * 0.01, Math.sin(a) * radio * 0.9));
  }
  return { puntos: pts, cerrado: false };
}

/** Construye la muestra tejida: devuelve la geometría de las hileras pares e impares. */
export function construirMuestra(p: ParamsMuestra): Muestra {
  const info = PUNTADAS.find((x) => x.id === p.tipo)!;
  const rnd = azar(p.filas * 31 + p.columnas * 7 + p.tipo.length);
  const ry = p.grosor;
  const w = lerp(1.08, 0.9, p.tension); // paso entre puntadas
  const lean = lerp(0.2, 0.05, p.tension);
  const rx = lerp(0.54, 0.4, p.tension);
  const rz = lerp(0.26, 0.2, p.tension);
  const h = info.alto;
  const hPaso = h + p.separacion * 0.6;

  const grupos: [Tubo[], Tubo[]] = [[], []];
  const abiertos: [Vector3[], Vector3[]] = [[], []];

  if (p.tipo === "cadena") {
    const largo = 0.62;
    const n = Math.max(3, p.columnas * 2);
    for (let i = 0; i < n; i++) grupos[0].push(eslabon(i * largo, 0, 0.58, 0.3, i % 2 ? 0 : Math.PI / 2, rnd));
    return finalizar(grupos, abiertos, ry, (n - 1) * largo, 0.6, rnd);
  }

  const cols = p.columnas;
  const filas = p.filas;
  // fila 0: cadeneta de base (anillos que recibirán los primeros postes)
  for (let i = 0; i < cols; i++) grupos[0].push(anillo(i * w, 0, 0, rx, rz, 0.35, rnd() * TAU, rnd));

  for (let r = 1; r <= filas; r++) {
    const g = r % 2;
    const yBase = (r - 1) * hPaso;
    const yTope = yBase + h;
    for (let i = 0; i < cols; i++) {
      const x0 = i * w;
      const lado = (i + r) % 2 ? 1 : -1;
      const d = lean * (r % 2 ? 1 : -1);
      // poste: entra por debajo de la lazada de la hilera anterior, sale por delante y sube
      const poste: Vector3[] = [
        new Vector3(x0 - d * 0.5, yBase - Math.min(0.42, h * 0.5), -0.12 * lado),
        new Vector3(x0, yBase, 0.0),
        new Vector3(x0 + d * 0.5, yBase + h * 0.42, 0.11),
        new Vector3(x0 + d, yBase + h * 0.82, 0.08),
        new Vector3(x0 + d, yTope - rz * 0.1, 0.04),
      ];
      grupos[g].push({ puntos: poste, cerrado: false });
      abiertos[g].push(poste[0]);
      // lazada de arriba: recibirá el poste de la hilera siguiente
      grupos[g].push(anillo(x0 + d, yTope, 0, rx, rz, 0.35, rnd() * TAU, rnd));
      // lazadas previas (hilo sobre la aguja) en varetas
      for (let v = 0; v < info.vueltas; v++) {
        const f = info.vueltas === 1 ? 0.55 : 0.4 + v * 0.26;
        const t = vuelta(x0 + lerp(0, d, f), yBase + h * f, ry * 1.5 + 0.1, rnd() * TAU, rnd);
        grupos[g].push(t);
      }
    }
  }
  const alto = filas * hPaso;
  return finalizar(grupos, abiertos, ry, (cols - 1) * w, alto, rnd);
}

function finalizar(grupos: [Tubo[], Tubo[]], abiertos: [Vector3[], Vector3[]], ry: number, ancho: number, alto: number, rnd: () => number): Muestra {
  const circ = TAU * ry;
  const torsion = circ * 1.2; // largo de una vuelta de torsión (coincide con la textura)
  const hacer = (tubos: Tubo[], tapas: Vector3[]): BufferGeometry => {
    const partes: BufferGeometry[] = [];
    for (const t of tubos) {
      const curva = new CatmullRomCurve3(t.puntos, t.cerrado, "catmullrom", 0.5);
      const largo = curva.getLength();
      const seg = Math.max(18, Math.min(90, Math.ceil(largo * 38)));
      const geo = new TubeGeometry(curva, seg, ry, 10, t.cerrado);
      // la textura repite cada `torsion` de hilo, con un desfase al azar por tubo
      const uv = geo.attributes.uv;
      const fase = rnd();
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (largo / torsion) + fase);
      partes.push(geo);
    }
    for (const p of tapas) {
      const s = new SphereGeometry(ry, 10, 8);
      s.translate(p.x, p.y, p.z);
      partes.push(s);
    }
    return partes.length ? mergeGeometries(partes, false)! : new BufferGeometry();
  };
  return { a: hacer(grupos[0], abiertos[0]), b: hacer(grupos[1], abiertos[1]), ancho, alto, torsion };
}

// ---------------------------------------------------------------------------
// Texturas del hilo: normal map, color y rugosidad generados por código
// ---------------------------------------------------------------------------

export interface TexturasHilo {
  map: CanvasTexture;
  normalMap: CanvasTexture;
  roughnessMap: CanvasTexture;
}

const N = 256;
const CABOS = 3;
const GIROS = 2;

/** Ruido de valor periódico (se repite sin costuras). */
function crearRuido(celdas: number, rnd: () => number) {
  const g = new Float32Array(celdas * celdas).map(() => rnd());
  return (u: number, v: number) => {
    const x = (((u * celdas) % celdas) + celdas) % celdas;
    const y = (((v * celdas) % celdas) + celdas) % celdas;
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const fx = x - x0,
      fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx),
      sy = fy * fy * (3 - 2 * fy);
    const a = g[y0 * celdas + x0],
      b = g[y0 * celdas + ((x0 + 1) % celdas)],
      c = g[((y0 + 1) % celdas) * celdas + x0],
      d = g[((y0 + 1) % celdas) * celdas + ((x0 + 1) % celdas)];
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  };
}

/** Altura del hilo: tres cabos retorcidos en hélice + fibrillas. u = largo, v = alrededor. */
function alturaHilo() {
  const rnd = azar(7);
  const fibra = crearRuido(48, rnd);
  const grano = crearRuido(16, rnd);
  const h = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const u = x / N,
        v = y / N;
      const fase = CABOS * v + GIROS * u;
      const f = fase - Math.floor(fase);
      const cabo = Math.pow(Math.sin(Math.PI * f), 0.75); // lomo redondeado de cada cabo
      // fibrillas finas alineadas con la torsión
      const fib = fibra(u * 1 + v * 0.0, (v + u * (GIROS / CABOS)) * 1.0) * 0.5 + fibra(u * 3, (v + u * 0.66) * 3) * 0.5;
      const g = grano(u * 2, v * 2);
      h[y * N + x] = cabo * 0.82 + fib * 0.14 + g * 0.04;
    }
  return h;
}

function lienzo() {
  const c = document.createElement("canvas");
  c.width = c.height = N;
  return c;
}

function hex(c: string) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const cache = new Map<string, TexturasHilo>();

/** Normal map + color + rugosidad del hilo, con el color elegido. */
export function crearTexturasHilo(color: string): TexturasHilo {
  const previa = cache.get(color);
  if (previa) return previa;
  const h = alturaHilo();
  const at = (x: number, y: number) => h[((y + N) % N) * N + ((x + N) % N)];

  const cn = lienzo(),
    cc = lienzo(),
    cr = lienzo();
  const dn = cn.getContext("2d")!.createImageData(N, N);
  const dc = cc.getContext("2d")!.createImageData(N, N);
  const dr = cr.getContext("2d")!.createImageData(N, N);
  const [R, G, B] = hex(color);
  const fuerza = 3.4;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      // Sobel sobre el mapa de alturas (envuelto) → normal
      const dx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const dy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      let nx = -dx * fuerza,
        ny = -dy * fuerza,
        nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      dn.data[i] = (nx * 0.5 + 0.5) * 255;
      dn.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      dn.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      dn.data[i + 3] = 255;
      // color: los valles entre cabos son más oscuros
      const v = h[y * N + x];
      const k = 0.62 + 0.55 * v;
      dc.data[i] = Math.min(255, R * k);
      dc.data[i + 1] = Math.min(255, G * k);
      dc.data[i + 2] = Math.min(255, B * k);
      dc.data[i + 3] = 255;
      // rugosidad: más lisa en el lomo, más áspera en los valles y las fibras
      const ru = 0.98 - 0.22 * v;
      dr.data[i] = dr.data[i + 1] = dr.data[i + 2] = ru * 255;
      dr.data[i + 3] = 255;
    }
  cn.getContext("2d")!.putImageData(dn, 0, 0);
  cc.getContext("2d")!.putImageData(dc, 0, 0);
  cr.getContext("2d")!.putImageData(dr, 0, 0);

  const mk = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
    t.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const res = { map: mk(cc, true), normalMap: mk(cn, false), roughnessMap: mk(cr, false) };
  cache.set(color, res);
  return res;
}
