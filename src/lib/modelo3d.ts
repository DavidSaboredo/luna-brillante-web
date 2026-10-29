// Geometría 3D de las prendas (three.js). Se construyen sobre el cuerpo real del maniquí (ver cuerpo3d.ts),
// escalado al talle elegido. Unidades: metros; y arriba; el frente mira a +z.
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BRAZOS, Y_BUSTO, Y_CADERA, Y_CINTURA, Y_CUELLO, Y_HOMBRO, crearCuerpo, type Cuerpo } from "./cuerpo3d";
import { contexto, type Contexto, type Opciones, type Prenda } from "./taller";

type V3 = [number, number, number];

export interface Parte {
  /** Zona de la prenda a la que pertenece */
  zona: string | null;
  geo: BufferGeometry;
  pos?: V3;
  rot?: V3;
  /** Cuántos cm de tejido caben en la geometría: [alrededor, a lo largo] */
  rep: [number, number];
}

export interface Modelo {
  partes: Parte[];
  /** Hacia dónde mira la cámara y a qué distancia */
  camara: { objetivo: V3; distancia: number };
  /** Los accesorios como el bolso no llevan maniquí */
  conManiqui: boolean;
}

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sm = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

interface OpcEnvolver {
  pasos?: number;
  seg?: number;
  phi0?: number;
  phiLen?: number;
  /** Semiángulo (rad) del escote delantero a cada altura: se omiten las mallas dentro de esa abertura */
  hueco?: (y: number) => number;
  /** Lo mismo para la espalda */
  huecoEsp?: (y: number) => number;
  /** Frunces o tablones: n ondas alrededor, con amplitud (m) según la altura */
  ond?: { n: number; amp: (y: number) => number };
}

/**
 * Superficie que sigue el cuerpo: a cada altura y ángulo, el radio del cuerpo más un margen `off(y)`.
 * Por debajo y por encima del rango medido se repite la sección de los extremos.
 */
function envolver(cu: Cuerpo, y0: number, y1: number, off: (y: number) => number, o: OpcEnvolver = {}): BufferGeometry {
  const pasos = o.pasos ?? 24;
  const seg = o.seg ?? 72;
  const phi0 = o.phi0 ?? 0;
  const phiLen = o.phiLen ?? TAU;
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (let j = 0; j <= pasos; j++) {
    const y = lerp(y0, y1, j / pasos);
    const [cx, cz] = cu.centro(y);
    const o2 = off(y);
    for (let i = 0; i <= seg; i++) {
      const phi = phi0 + (phiLen * i) / seg;
      const r = cu.r(y, phi) + o2 + (o.ond ? o.ond.amp(y) * Math.sin(o.ond.n * phi) : 0);
      pos.push(cx + r * Math.sin(phi), y, cz + r * Math.cos(phi));
      uv.push(i / seg, j / pasos);
    }
  }
  for (let j = 0; j < pasos; j++)
    for (let i = 0; i < seg; i++) {
      if (o.hueco || o.huecoEsp) {
        const yc = lerp(y0, y1, (j + 0.5) / pasos);
        const phic = phi0 + (phiLen * (i + 0.5)) / seg;
        const d = Math.abs((((phic + Math.PI) % TAU) + TAU) % TAU - Math.PI);
        if (o.hueco && d < o.hueco(yc)) continue;
        if (o.huecoEsp && Math.PI - d < o.huecoEsp(yc)) continue;
      }
      const a = j * (seg + 1) + i;
      idx.push(a, a + 1, a + seg + 1, a + 1, a + seg + 2, a + seg + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const repEnvolver = (cu: Cuerpo, y0: number, y1: number, off: number, phiLen = TAU): [number, number] => [
  ((TAU * (cu.radio((y0 + y1) / 2) + off) * phiLen) / TAU) * 100,
  Math.abs(y1 - y0) * 100,
];

/** Revolución simple (para prendas que no se pegan al cuerpo, como el poncho). */
function revolucion(y0: number, y1: number, rFn: (y: number) => number, pasos = 28, seg = 64): BufferGeometry {
  const pts: Vector2[] = [];
  for (let i = 0; i <= pasos; i++) {
    const y = lerp(y0, y1, i / pasos);
    pts.push(new Vector2(Math.max(0.002, rFn(y)), y));
  }
  const g = new LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}

/** Tubo con radio variable a lo largo de una curva. `radio` recibe la posición 0..1 dentro del tramo. */
function tuboVar(curva: CatmullRomCurve3, t0: number, t1: number, radio: (t: number) => number, pasos = 40, seg = 20): BufferGeometry {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  let ref = new Vector3(0, 0, 1);
  for (let j = 0; j <= pasos; j++) {
    const t = lerp(t0, t1, j / pasos);
    const p = curva.getPoint(t);
    const tan = curva.getTangent(t).normalize();
    if (Math.abs(tan.dot(ref)) > 0.95) ref = new Vector3(1, 0, 0);
    const n = new Vector3().crossVectors(tan, ref).normalize();
    const b = new Vector3().crossVectors(tan, n).normalize();
    const r = radio(j / pasos);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * TAU;
      const c = Math.cos(a) * r,
        s = Math.sin(a) * r;
      pos.push(p.x + c * n.x + s * b.x, p.y + c * n.y + s * b.y, p.z + c * n.z + s * b.z);
      uv.push(i / seg, j / pasos);
    }
  }
  for (let j = 0; j < pasos; j++)
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      idx.push(a, a + 1, a + seg + 1, a + 1, a + seg + 2, a + seg + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Volado ondulado que cae sobre el cuello: nace pegado en `r0` a altura `y` y se abre y ondula hacia el borde. */
function volado(r0: number, y: number, ancho: number, caida: number, ondas = 14): BufferGeometry {
  const seg = 96;
  const pasos = 6;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * TAU;
      const onda = Math.sin(a * ondas) * t * 0.012;
      const r = r0 + ancho * t + onda;
      const yy = y - caida * t * t + Math.cos(a * ondas) * t * 0.008;
      pos.push(r * Math.sin(a), yy, r * Math.cos(a));
      uv.push(j / seg, t);
    }
  }
  for (let i = 0; i < pasos; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      idx.push(a, a + 1, a + seg + 1, a + 1, a + seg + 2, a + seg + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function fleco(n: number, puntos: (i: number) => V3, largo = 0.1): BufferGeometry {
  const hebras: BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const g = new CylinderGeometry(0.004, 0.0032, largo, 5);
    const [x, y, z] = puntos(i);
    g.translate(x, y - largo / 2, z);
    hebras.push(g);
  }
  return mergeGeometries(hebras)!;
}

function cinta(curva: CatmullRomCurve3, ancho: number, pasos = 120): BufferGeometry {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const p = curva.getPoint(t);
    const tan = curva.getTangent(t);
    const ref = Math.abs(tan.y) > 0.85 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0);
    const lado = new Vector3().crossVectors(tan, ref).normalize().multiplyScalar(ancho / 2);
    pos.push(p.x - lado.x, p.y - lado.y, p.z - lado.z, p.x + lado.x, p.y + lado.y, p.z + lado.z);
    uv.push(0, t, 1, t);
    if (i < pasos) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

interface Ctx3D {
  c: Contexto;
  cu: Cuerpo;
  /** Holgura radial de la prenda sobre el cuerpo (m) */
  h: number;
  /** Altura del borde inferior de la prenda principal */
  yDobladillo: number;
}

function ctx3d(prenda: Prenda, o: Opciones): Ctx3D {
  const c = contexto(prenda, o);
  const cu = crearCuerpo(c.m);
  return { c, cu, h: c.holgura / TAU / 100 + 0.004, yDobladillo: Y_HOMBRO - c.largo / 100 };
}

const camaraCuerpo = (distancia = 2.35, y = 1.1): Modelo["camara"] => ({ objetivo: [0, y, 0], distancia });

// ---------------------------------------------------------------------------
// Mangas: siguen el eje real del brazo del maniquí
// ---------------------------------------------------------------------------

function puntosBrazo(cu: Cuerpo, lado: 1 | -1): Vector3[] {
  const b = BRAZOS[lado === 1 ? "L" : "R"];
  const pts = [b.hombro, b.codo, b.muneca].map((p) => {
    const f = cu.factor(p[1]);
    // los brazos no se escalan: solo se corren hacia afuera lo que creció el torso
    const lateral = cu.r(p[1], (lado * Math.PI) / 2) / f;
    return new Vector3(p[0] + lado * (f - 1) * lateral, p[1], p[2]);
  });
  // la manga nace bajo la sisa: se arranca 6 cm más abajo del punto más alto del hombro, sobre el eje del brazo
  const eje = pts[1].clone().sub(pts[0]).normalize();
  const ini = pts[0].clone().addScaledVector(eje, 0.06);
  return [ini, pts[1], pts[2]];
}

function mangaPartes(k: Ctx3D, zona: string, conPuno: boolean, campana = 0): Parte[] {
  const { c, cu } = k;
  if (c.manga <= 0) return [];
  const fraccion = Math.min(1, (c.manga / c.m.manga) * 1.05);
  const out: Parte[] = [];
  for (const lado of [1, -1] as const) {
    const b = BRAZOS[lado === 1 ? "L" : "R"];
    const curva = new CatmullRomCurve3(puntosBrazo(cu, lado), false, "centripetal");
    const largo = curva.getLength();
    const tFin = curva.getUtoTmapping(0, Math.min(0.995, fraccion) * largo);
    const rSup = b.radio_sup * 1.2 + k.h * 1.1 + 0.004;
    const suelta = c.o.ajuste === "suelto" ? 0.014 : c.o.ajuste === "normal" ? 0.004 : 0;
    const rPuno = Math.max(c.m.puno / TAU / 100 + 0.004, b.radio_inf * 0.85);
    const rInf = lerp(b.radio_inf, rPuno, 0.4) + k.h * 0.6 + suelta;
    const largoMangaM = largo * fraccion;
    const radio = (t: number) => lerp(rSup, rInf, Math.pow(t, 0.85)) + campana * sm(0.45, 1, t);
    const repLargo = largoMangaM * 100;
    if (conPuno && largoMangaM > 0.14) {
      const frPuno = Math.min(0.5, 0.06 / largoMangaM);
      const tCorte = tFin * (1 - frPuno);
      out.push({ zona, geo: tuboVar(curva, 0, tCorte, (t) => radio(t * (1 - frPuno))), rep: [TAU * ((rSup + rInf) / 2) * 100, repLargo * (1 - frPuno)] });
      out.push({ zona: "puños", geo: tuboVar(curva, tCorte, tFin, (t) => radio(1 - frPuno + t * frPuno) * 0.96, 8), rep: [TAU * rInf * 100, 6] });
    } else {
      out.push({ zona, geo: tuboVar(curva, 0, tFin, radio), rep: [TAU * ((rSup + rInf) / 2) * 100, repLargo] });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Prendas
// ---------------------------------------------------------------------------

/** Blusa y suéter. */
function torso(prenda: Prenda, o: Opciones, tipo: "blusa" | "sueter"): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const yH = Math.max(0.6, k.yDobladillo);
  const banda = tipo === "sueter" ? 0.07 : 0.05;
  const flare = (y: number) => 0.012 * sm(yH + 0.1, yH, y);
  const off = (y: number) => k.h + flare(y);
  const partes: Parte[] = [];
  partes.push({ zona: "borde", geo: envolver(cu, yH, yH + banda, off, { pasos: 4 }), rep: repEnvolver(cu, yH, yH + banda, k.h) });
  if (tipo === "blusa") {
    const yS = 1.28;
    partes.push({ zona: "cuerpo", geo: envolver(cu, yH + banda, yS, off, { pasos: 30 }), rep: repEnvolver(cu, yH, yS, k.h) });
    // escote redondo: baja 7 cm adelante y 2 cm atrás
    const escote = {
      pasos: 18,
      seg: 96,
      hueco: (y: number) => 1.15 * sm(Y_CUELLO - 0.07, Y_CUELLO, y),
      huecoEsp: (y: number) => 0.6 * sm(Y_CUELLO - 0.02, Y_CUELLO, y),
    };
    partes.push({ zona: "canesu", geo: envolver(cu, yS, Y_CUELLO, () => k.h, escote), rep: repEnvolver(cu, yS, Y_CUELLO, k.h) });
    partes.push(...mangaPartes(k, "mangas", false, k.c.o.ajuste === "suelto" ? 0.03 : 0.012));
  } else {
    partes.push({ zona: "cuerpo", geo: envolver(cu, yH + banda, Y_CUELLO, off, { pasos: 40 }), rep: repEnvolver(cu, yH, Y_CUELLO, k.h) });
    const [cx, cz] = cu.centro(1.44);
    const cuello = new CylinderGeometry(cu.radio(1.44) + 0.016, cu.radio(1.42) + 0.022, 0.085, 40, 1, true);
    partes.push({ zona: "cuello", geo: cuello, pos: [cx, 1.445, cz], rep: [TAU * 0.07 * 100, 8.5] });
    partes.push(...mangaPartes(k, "mangas", true));
  }
  return { partes, camara: camaraCuerpo(), conManiqui: true };
}

/** Breteles que pasan por encima del hombro, siguiendo la superficie. */
function breteles(cu: Cuerpo, yTop: number, zona: string, x0 = 0.072, ancho = 0.013): Parte[] {
  const out: Parte[] = [];
  // altura a la que el hombro deja de sostener el bretel
  let yCruce = yTop + 0.02;
  for (let y = yTop; y <= 1.43; y += 0.004) {
    const [cx] = cu.centro(y);
    if (cx + cu.r(y, Math.PI / 2) >= x0 + 0.004) yCruce = y;
  }
  for (const lado of [1, -1] as const) {
    const x = x0 * lado;
    const pts: Vector3[] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const y = lerp(yTop, yCruce, i / n);
      pts.push(new Vector3(x, y, cu.z(y, x0, 1, 0.011)));
    }
    pts.push(new Vector3(x, yCruce + 0.008, lerp(cu.z(yCruce, x0, 1), cu.z(yCruce, x0, -1), 0.5)));
    for (let i = n; i >= 0; i--) {
      const y = lerp(yTop, yCruce, i / n);
      pts.push(new Vector3(x, y, cu.z(y, x0, -1, 0.011)));
    }
    // cinta plana que apoya sobre el hombro, no un cilindro
    out.push({ zona, geo: cinta(new CatmullRomCurve3(pts), ancho * 1.9, 120), rep: [2.2, 45] });
  }
  return out;
}

function musculosa(prenda: Prenda, o: Opciones): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const yH = Math.max(0.6, k.yDobladillo);
  const yTop = 1.26;
  const partes: Parte[] = [
    { zona: "borde", geo: envolver(cu, yH, yH + 0.035, () => k.h, { pasos: 3 }), rep: repEnvolver(cu, yH, yH + 0.035, k.h) },
    {
      zona: "cuerpo",
      // escote en U: 6 cm de caída adelante, 2 cm atrás
      geo: envolver(cu, yH + 0.035, yTop, () => k.h, {
        pasos: 36,
        seg: 96,
        hueco: (y) => 0.46 * sm(yTop - 0.065, yTop, y),
        huecoEsp: (y) => 0.5 * sm(yTop - 0.02, yTop, y),
      }),
      rep: repEnvolver(cu, yH, yTop, k.h),
    },
    ...breteles(cu, yTop, "breteles"),
  ];
  return { partes, camara: camaraCuerpo(), conManiqui: true };
}

function chaleco(prenda: Prenda, o: Opciones, conMangas: boolean): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const yH = Math.max(0.6, k.yDobladillo);
  const g = 0.16; // semiancho de la abertura delantera (rad)
  const off = () => k.h + 0.003;
  const partes: Parte[] = [];
  // la abertura se abre en V desde el busto hacia el cuello
  const gV = (y: number) => g + 0.55 * sm(Y_BUSTO - 0.04, Y_CUELLO, y);
  const delant = (phi0: number) =>
    envolver(cu, yH, Y_CUELLO, off, { phi0, phiLen: Math.PI / 2 - g, pasos: 44, seg: 40, hueco: (y) => gV(y) - 0.0001 });
  const rD = repEnvolver(cu, yH, Y_CUELLO, k.h, Math.PI / 2);
  partes.push({ zona: "delanteros", geo: delant(g), rep: rD });
  partes.push({ zona: "delanteros", geo: delant(-Math.PI / 2), rep: rD });
  partes.push({
    zona: "espalda",
    geo: envolver(cu, yH, Y_CUELLO, off, { phi0: Math.PI / 2, phiLen: Math.PI, pasos: 34, seg: 56 }),
    rep: repEnvolver(cu, yH, Y_CUELLO, k.h, Math.PI),
  });
  // ribete del frente: cinta que sigue el borde en V
  for (const lado of [1, -1] as const) {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const y = lerp(yH + 0.02, Y_CUELLO, i / 24);
      const phi = lado * (gV(y) - 0.018);
      const [cx, cz] = cu.centro(y);
      const r = cu.r(y, phi) + k.h + 0.006;
      pts.push(new Vector3(cx + r * Math.sin(phi), y, cz + r * Math.cos(phi)));
    }
    partes.push({ zona: "ribete", geo: cinta(new CatmullRomCurve3(pts), 0.03, 80), rep: [3, (Y_CUELLO - yH) * 100] });
  }
  partes.push({ zona: "ribete", geo: envolver(cu, yH, yH + 0.03, () => k.h + 0.007, { phi0: g, phiLen: TAU - 2 * g, pasos: 2 }), rep: repEnvolver(cu, yH, yH + 0.03, k.h) });
  if (conMangas) partes.push(...mangaPartes(k, "mangas", false));
  return { partes, camara: camaraCuerpo(), conManiqui: true };
}

function poncho(prenda: Prenda, o: Opciones): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const yH = Math.max(0.5, k.yDobladillo);
  const R = 0.42 + 0.16 * (k.c.largo / 70);
  const [cx, cz] = cu.centro(1.3);
  const Y_TOP = 1.42;
  // El poncho cae sobre los hombros y los brazos (los lados) y queda más largo adelante y atrás, en punta.
  const largoLado = 0.13;
  const yBorde = (a: number) => yH + largoLado * Math.sin(a) ** 2;
  const radioEn = (a: number, y: number) => {
    const w = Math.sin(a) ** 2;
    const baja = Y_TOP - y;
    const rLado = Math.min(R, cu.radio(Y_TOP) + 0.05 + 0.75 * baja);
    const rFrente = Math.max(cu.radio(y) + 0.035, lerp(cu.radio(Y_TOP) + 0.025, R * 0.78, Math.min(1, baja / (Y_TOP - yH)) ** 1.3));
    return lerp(rFrente, rLado, w);
  };
  const pasosV = 28;
  const segH = 72;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= pasosV; i++) {
    for (let j = 0; j <= segH; j++) {
      const a = (j / segH) * TAU;
      const y = lerp(Y_TOP, yBorde(a), i / pasosV);
      const r = radioEn(a, y);
      pos.push(r * Math.sin(a), y, r * Math.cos(a));
      uv.push(j / segH, i / pasosV);
    }
  }
  for (let i = 0; i < pasosV; i++)
    for (let j = 0; j < segH; j++) {
      const a = i * (segH + 1) + j;
      idx.push(a, a + 1, a + segH + 1, a + 1, a + segH + 2, a + segH + 1);
    }
  const geoPoncho = new BufferGeometry();
  geoPoncho.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geoPoncho.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geoPoncho.setIndex(idx);
  geoPoncho.computeVertexNormals();
  const partes: Parte[] = [
    { zona: "cuerpo", geo: geoPoncho, pos: [cx, 0, cz], rep: [TAU * R * 100 * 0.9, (Y_TOP - yH) * 135] },
    { zona: "cuello", geo: volado(cu.radio(1.44) + 0.012, 1.455, 0.1, 0.07), pos: [cx, 0, cz], rep: [TAU * 0.09 * 100, 8] },
  ];
  const n = 96;
  partes.push({
    zona: "flecos",
    geo: fleco(
      n,
      (i) => {
        const a = (i / n) * TAU;
        const y = yBorde(a);
        const r = radioEn(a, y) - 0.003;
        return [cx + r * Math.sin(a), y, cz + r * Math.cos(a)];
      },
      0.11,
    ),
    rep: [4, 12],
  });
  return { partes, camara: camaraCuerpo(2.5, 1.05), conManiqui: true };
}

function chal(prenda: Prenda, o: Opciones): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const largo = k.c.largo / 100;
  const filasU = 48,
    filasV = 36;
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  const yTop = 1.39;
  const fn = (u: number, v: number): V3 => {
    const y = yTop - v * largo * 0.95;
    const th = (1 - v) * 1.25;
    const phi = Math.PI + (u - 0.5) * 2 * th;
    const folds = 0.012 * Math.sin(u * TAU * 5 + v * 2) * (0.3 + v);
    const [cx, cz] = cu.centro(y);
    const r = cu.r(Math.max(0.88, y), phi) + 0.014 + folds + 0.02 * Math.sin(v * Math.PI);
    return [cx + r * Math.sin(phi), y, cz + r * Math.cos(phi)];
  };
  for (let j = 0; j <= filasV; j++)
    for (let i = 0; i <= filasU; i++) {
      const [x, y, z] = fn(i / filasU, j / filasV);
      pos.push(x, y, z);
      uv.push(i / filasU, j / filasV);
    }
  for (let j = 0; j < filasV; j++)
    for (let i = 0; i < filasU; i++) {
      const a = j * (filasU + 1) + i;
      idx.push(a, a + 1, a + filasU + 1, a + 1, a + filasU + 2, a + filasU + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const partes: Parte[] = [{ zona: "cuerpo", geo: g, rep: [95, largo * 100] }];
  const lado = (u: number) => new CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => new Vector3(...fn(u, i / 29))));
  partes.push({ zona: "borde", geo: mergeGeometries([new TubeGeometry(lado(0), 60, 0.006, 5), new TubeGeometry(lado(1), 60, 0.006, 5)])!, rep: [2, 200] });
  const nF = 44;
  partes.push({ zona: "flecos", geo: fleco(nF, (i) => fn(i % 2, 0.3 + 0.7 * (Math.floor(i / 2) / (nF / 2 - 1))), 0.12), rep: [4, 12] });
  return { partes, camara: camaraCuerpo(2.4, 1.05), conManiqui: true };
}

function falda(prenda: Prenda, o: Opciones, vuelo: number, conLazo: boolean): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const yH = Math.max(0.3, Y_CINTURA - k.c.largo / 100);
  const yPre = Y_CINTURA - 0.03;
  const rBase = (y: number) => {
    if (y >= Y_CADERA) return cu.radio(y) + k.h * 0.9 + 0.004;
    return cu.radio(Y_CADERA) + k.h * 0.9 + 0.004 + (Y_CADERA - y) * vuelo;
  };
  const off = (y: number) => rBase(y) - cu.radio(y);
  const volado = 0.1;
  const partes: Parte[] = [
    { zona: "pretina", geo: envolver(cu, yPre, Y_CINTURA + 0.03, off, { pasos: 4 }), rep: repEnvolver(cu, yPre, Y_CINTURA + 0.03, off(Y_CINTURA)) },
    {
      zona: "cuerpo",
      geo: envolver(cu, yH + volado - 0.004, yPre, off, {
        pasos: 36,
        seg: 120,
        // la pollera lleva frunces que se abren hacia el ruedo; la falda recta, casi ninguno
        ond: { n: vuelo > 0.5 ? 18 : 10, amp: (y) => (vuelo > 0.5 ? 0.02 : 0.004) * sm(Y_CADERA + 0.03, yH + volado, y) },
      }),
      rep: [TAU * rBase(0.7) * 100, (yPre - yH - volado) * 100],
    },
    {
      zona: "volado",
      geo: envolver(cu, yH, yH + volado, (y) => off(y) + 0.02 * sm(yH + volado, yH, y), {
        pasos: 10,
        seg: 120,
        ond: { n: vuelo > 0.5 ? 18 : 10, amp: () => (vuelo > 0.5 ? 0.024 : 0.006) },
      }),
      rep: [TAU * rBase(yH) * 100, volado * 100],
    },
  ];
  if (conLazo) {
    const [cx] = cu.centro(Y_CINTURA);
    const z = cu.z(Y_CINTURA + 0.02, 0.02, 1, 0.02);
    for (const lado of [1, -1] as const) {
      const g = new CylinderGeometry(0.0, 0.05, 0.1, 4, 1);
      partes.push({ zona: "lazo", geo: g, pos: [cx + lado * 0.06, Y_CINTURA + 0.03, z + 0.01], rot: [0, 0, (lado * Math.PI) / 2], rep: [3, 3] });
      const t = new BoxGeometry(0.022, 0.2, 0.004);
      t.translate(0, -0.1, 0);
      partes.push({ zona: "lazo", geo: t, pos: [cx + lado * 0.02, Y_CINTURA + 0.02, z + 0.015], rot: [0, 0, lado * 0.18], rep: [2, 20] });
    }
    partes.push({ zona: "lazo", geo: new SphereGeometry(0.022, 16, 12), pos: [cx, Y_CINTURA + 0.03, z + 0.012], rep: [2, 2] });
  }
  return { partes, camara: camaraCuerpo(2.6, 0.9), conManiqui: true };
}

function vestido(prenda: Prenda, o: Opciones): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const yH = Math.max(0.3, k.yDobladillo);
  const vuelo = 0.34;
  const rFalda = (y: number) => {
    if (y >= Y_CADERA) return cu.radio(y) + k.h * 0.7 + 0.004;
    return cu.radio(Y_CADERA) + k.h * 0.7 + 0.004 + (Y_CADERA - y) * vuelo;
  };
  const offF = (y: number) => rFalda(y) - cu.radio(y);
  const yTopC = 1.26;
  const offT = () => k.h * 0.7 + 0.004;
  const ruedo = 0.05;
  const partes: Parte[] = [
    { zona: "ruedo", geo: envolver(cu, yH, yH + ruedo, (y) => offF(y) + 0.004, { pasos: 4 }), rep: [TAU * rFalda(yH) * 100, ruedo * 100] },
    {
      zona: "falda",
      geo: envolver(cu, yH + ruedo - 0.004, Y_CINTURA - 0.03, offF, {
        pasos: 36,
        seg: 120,
        ond: { n: 14, amp: (y) => 0.016 * sm(Y_CADERA + 0.02, yH + 0.1, y) },
      }),
      rep: [TAU * rFalda(0.7) * 100, (Y_CINTURA - yH) * 100] },
    { zona: "cintura", geo: envolver(cu, Y_CINTURA - 0.03, Y_CINTURA + 0.03, offT, { pasos: 4 }), rep: repEnvolver(cu, Y_CINTURA, Y_CINTURA, 0) },
    {
      zona: "corpino",
      geo: envolver(cu, Y_CINTURA + 0.03, yTopC, offT, {
        pasos: 24,
        seg: 96,
        hueco: (y) => 0.46 * sm(yTopC - 0.05, yTopC, y),
        huecoEsp: (y) => 0.5 * sm(yTopC - 0.02, yTopC, y),
      }),
      rep: repEnvolver(cu, Y_CINTURA, yTopC, 0) },
    ...breteles(cu, yTopC, "tirantes"),
  ];
  return { partes, camara: camaraCuerpo(2.5, 0.95), conManiqui: true };
}

const Y_ENTREPIERNA = 0.84;

function short(prenda: Prenda, o: Opciones): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const yH = Math.max(0.4, Y_CINTURA - k.c.largo / 100);
  const off = () => k.h * 0.8 + 0.004;
  const partes: Parte[] = [
    { zona: "pretina", geo: envolver(cu, Y_CINTURA - 0.03, Y_CINTURA + 0.04, off, { pasos: 4 }), rep: repEnvolver(cu, 1, 1, 0) },
    { zona: "piernas", geo: envolver(cu, Y_ENTREPIERNA, Y_CINTURA - 0.03, off, { pasos: 14 }), rep: repEnvolver(cu, Y_ENTREPIERNA, 1.0, 0) },
  ];
  const yBajo = Math.min(yH, 0.76);
  for (const lado of [1, -1] as const) {
    // las piernas arrancan donde termina la cadera, para que no quede un borde suelto al costado
    const pts = Array.from({ length: 6 }, (_, i) => {
      const y = lerp(Y_ENTREPIERNA, yBajo, i / 5);
      const p = cu.pierna(Math.min(0.76, y));
      return new Vector3(lado * lerp(p.cx, 0.09, sm(0.76, 0.9, y)), y, p.cz);
    });
    const curva = new CatmullRomCurve3(pts);
    const rad = (t: number) => cu.pierna(Math.min(0.76, lerp(Y_ENTREPIERNA, yBajo, t))).r * lerp(1, 1.08, sm(0.76, 0.9, lerp(Y_ENTREPIERNA, yBajo, t))) + k.h * 0.45 + 0.006 + 0.03 * (1 - sm(0, 0.4, t));
    const largoCm = (Y_ENTREPIERNA - yBajo) * 100;
    partes.push({ zona: "piernas", geo: tuboVar(curva, 0, 0.9, (t) => rad(t * 0.9), 20, 24), rep: [TAU * rad(0.5) * 100, largoCm * 0.9] });
    partes.push({ zona: "puños", geo: tuboVar(curva, 0.9, 1, (t) => rad(0.9 + t * 0.1) + 0.003, 4, 24), rep: [TAU * rad(1) * 100, 5] });
  }
  return { partes, camara: camaraCuerpo(2.6, 0.9), conManiqui: true };
}

function bikini(prenda: Prenda, o: Opciones): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const partes: Parte[] = [];
  const yC = 1.2;
  for (const lado of [1, -1] as const) {
    const g = new SphereGeometry(0.056, 28, 16, 0, TAU, 0, Math.PI / 2);
    g.scale(1, 1, 0.75);
    const zc = cu.z(yC, 0.07, 1);
    partes.push({ zona: "tazas", geo: g, pos: [0.072 * lado, yC, zc - 0.012], rot: [Math.PI / 2 - 0.12, 0, 0], rep: [14, 12] });
    const curva = new CatmullRomCurve3([
      new Vector3(0.062 * lado, yC + 0.055, zc + 0.03),
      new Vector3(0.07 * lado, 1.31, cu.z(1.31, 0.07, 1, 0.012)),
      new Vector3(0.05 * lado, 1.4, 0.05),
      new Vector3(0, 1.43, -0.04),
    ]);
    partes.push({ zona: "tiras", geo: new TubeGeometry(curva, 28, 0.006, 6), rep: [2, 30] });
  }
  partes.push({ zona: "tiras", geo: envolver(cu, yC - 0.056, yC - 0.038, () => 0.008, { phi0: 0.7, phiLen: TAU - 1.4, pasos: 2, seg: 60 }), rep: [50, 2] });
  const yB = 0.92,
    yBb = 0.8;
  const ob = () => 0.008;
  partes.push({ zona: "bombacha", geo: envolver(cu, yBb, yB, ob, { phi0: -0.82, phiLen: 1.64, pasos: 6, seg: 22 }), rep: [20, 10] });
  partes.push({ zona: "bombacha", geo: envolver(cu, yBb, yB, ob, { phi0: Math.PI - 0.82, phiLen: 1.64, pasos: 6, seg: 22 }), rep: [20, 10] });
  partes.push({ zona: "tiras", geo: envolver(cu, yB - 0.025, yB - 0.005, ob, { phi0: 0.82, phiLen: Math.PI - 1.64, pasos: 2, seg: 14 }), rep: [20, 2] });
  partes.push({ zona: "tiras", geo: envolver(cu, yB - 0.025, yB - 0.005, ob, { phi0: -Math.PI + 0.82, phiLen: Math.PI - 1.64, pasos: 2, seg: 14 }), rep: [20, 2] });
  return { partes, camara: camaraCuerpo(2.2, 1.05), conManiqui: true };
}

function bolso(): Modelo {
  const W = 0.32,
    H = 0.24,
    D = 0.12;
  const partes: Parte[] = [];
  const caja = (w: number, h: number, d: number) => new BoxGeometry(w, h, d, 8, 8, 4);
  partes.push({ zona: "cuerpo", geo: caja(W, H - 0.05, D), pos: [0, (H - 0.05) / 2 + 0.03, 0], rep: [W * 100, (H - 0.05) * 100] });
  partes.push({ zona: "base", geo: caja(W + 0.004, 0.03, D + 0.004), pos: [0, 0.015, 0], rep: [W * 100, 3] });
  partes.push({ zona: "solapa", geo: caja(W + 0.004, 0.05, D + 0.004), pos: [0, H - 0.025, 0], rep: [W * 100, 5] });
  for (const z of [(D / 2) * 0.55, (-D / 2) * 0.55]) {
    partes.push({ zona: "asa", geo: new TorusGeometry(0.1, 0.011, 10, 32, Math.PI), pos: [0, H - 0.01, z], rep: [3, 40] });
  }
  return { partes, camara: { objetivo: [0, 0.17, 0], distancia: 0.95 }, conManiqui: false };
}

function gorro(): Modelo {
  // cabeza del maniquí: coronilla en 1,66 m, centro hacia 1,56 y un poco adelantada
  const yCab = 1.572,
    rad = 0.096,
    zc = 0.03,
    esc = 1.12;
  const corte = Math.PI * 0.6;
  const copa = new SphereGeometry(rad, 48, 32, 0, TAU, 0, corte);
  copa.scale(1, esc, 1.12);
  const yBase = yCab + rad * esc * Math.cos(corte);
  const rBase = rad * Math.sin(corte);
  const partes: Parte[] = [
    { zona: "copa", geo: copa, pos: [0, yCab, zc], rep: [TAU * rad * 100, 14] },
    { zona: "puño", geo: new CylinderGeometry(rBase * 1.06, rBase * 1.03, 0.055, 48, 1, true), pos: [0, yBase - 0.012, zc], rep: [TAU * rBase * 100, 5.5] },
    { zona: "pompon", geo: new SphereGeometry(0.034, 24, 16), pos: [0, yCab + rad * esc + 0.02, zc], rep: [8, 8] },
  ];
  return { partes, camara: { objetivo: [0, 1.5, 0], distancia: 0.95 }, conManiqui: true };
}

function bufanda(prenda: Prenda, o: Opciones): Modelo {
  const k = ctx3d(prenda, o);
  const { cu } = k;
  const zf = (y: number, x: number) => cu.z(y, x, 1, 0.022);
  const curva = new CatmullRomCurve3(
    [
      new Vector3(0.06, 0.98, zf(0.98, 0.06)),
      new Vector3(0.064, 1.15, zf(1.15, 0.064)),
      new Vector3(0.07, 1.3, zf(1.3, 0.07)),
      new Vector3(0.085, 1.43, 0.09),
      new Vector3(0.115, 1.46, 0.0),
      new Vector3(0.06, 1.465, -0.085),
      new Vector3(-0.06, 1.465, -0.085),
      new Vector3(-0.115, 1.455, 0.0),
      new Vector3(-0.085, 1.42, 0.09),
      new Vector3(-0.07, 1.3, zf(1.3, 0.07)),
      new Vector3(-0.064, 1.12, zf(1.12, 0.064)),
      new Vector3(-0.06, 0.92, zf(0.92, 0.06)),
    ],
    false,
    "centripetal",
  );
  const partes: Parte[] = [
    { zona: "cuerpo", geo: cinta(curva, 0.1, 200), rep: [10, 170] },
    { zona: "flecos", geo: fleco(26, (i) => [0.06 + ((i % 13) - 6) * 0.0075, 0.98, zf(0.98, 0.06) + (i % 2) * 0.004], 0.1), rep: [4, 10] },
    { zona: "flecos", geo: fleco(26, (i) => [-0.06 + ((i % 13) - 6) * 0.0075, 0.92, zf(0.92, 0.06) + (i % 2) * 0.004], 0.1), rep: [4, 10] },
  ];
  return { partes, camara: camaraCuerpo(1.9, 1.15), conManiqui: true };
}

export function construirModelo(prenda: Prenda, o: Opciones): Modelo {
  switch (prenda.id) {
    case "blusa":
      return torso(prenda, o, "blusa");
    case "sueter":
      return torso(prenda, o, "sueter");
    case "musculosa":
      return musculosa(prenda, o);
    case "chaleco":
      return chaleco(prenda, o, false);
    case "cardigan":
      return chaleco(prenda, o, true);
    case "poncho":
      return poncho(prenda, o);
    case "chal":
      return chal(prenda, o);
    case "vestido":
      return vestido(prenda, o);
    case "falda":
      return falda(prenda, o, 0.22, false);
    case "pollera":
      return falda(prenda, o, 0.62, true);
    case "short":
      return short(prenda, o);
    case "bikini":
      return bikini(prenda, o);
    case "bolso":
      return bolso();
    case "gorro":
      return gorro();
    case "bufanda":
      return bufanda(prenda, o);
    default:
      return torso(prenda, o, "blusa");
  }
}
