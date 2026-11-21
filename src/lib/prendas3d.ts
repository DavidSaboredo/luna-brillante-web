// Prendas del catálogo nuevo: tela y crochet combinados, como en las revistas.
// Cada una es una superficie continua sobre el maniquí (ver superficies3d.ts); las zonas se recortan de esa superficie,
// así que las uniones (hombros, sisas, cintura, escote) coinciden exacto en cualquier talle y con cualquier material.
import type { BufferGeometry } from "three";
import { Y_CINTURA, Y_HOMBRO, crearCuerpo, type Cuerpo } from "./cuerpo3d";
import type { Modelo, Parte } from "./modelo3d";
import { contexto, type Opciones, type Prenda } from "./taller";
import {
  TAU,
  alguna,
  bajo,
  botones,
  debajoDeEscote,
  delante,
  detras,
  escoteAgrandado,
  fueraDeSisa,
  largoManga,
  lerp,
  negar,
  sm,
  sobre,
  tablaCuello,
  tablaManga,
  tablaTorso,
  todas,
  uvEspalda,
  yEscote,
  zonaGeo,
  type Escote,
  type OpcManga,
  type OpcZona,
  type Q,
  type Region,
  type Sisa,
  type Tabla,
} from "./superficies3d";

/** Ids de las prendas que arma este módulo. */
export const PRENDAS_NUEVAS = ["blusa_entredos", "camisa_mangas", "campera_jean", "vestido_canesu", "kimono", "falda_franja"];

const camara = (y: number, distancia: number): Modelo["camara"] => ({ objetivo: [0, y, 0], distancia });

function base(prenda: Prenda, o: Opciones) {
  const c = contexto(prenda, o);
  const cu = crearCuerpo(c.m);
  // holgura radial (m) a partir de la holgura del contorno (cm)
  return { c, cu, h: c.holgura / TAU / 100 };
}

/** La sisa se agranda un poco con la holgura, como en un molde real. */
const sisaPara = (hol: number, extra = 0): Sisa => ({ tc: 1.6, dt: 0.44 + hol * 1.2, yc: 1.322 - hol * 0.6 - extra / 2, b: 0.066 + hol * 0.6 + extra / 2 });

class Partes {
  lista: Parte[] = [];
  agregar(zona: string, geo: BufferGeometry | null) {
    if (geo) this.lista.push({ zona, geo, rep: [100, 100] });
  }
  zona(zona: string, t: Tabla, regiones: Region[], o?: OpcZona) {
    this.agregar(zona, zonaGeo(t, regiones, o));
  }
}

/** En las mangas el motivo se teje desde el puño hacia el hombro: la UV vertical sube hacia el hombro. */
const uvManga = (q: Q): [number, number] => [q.U, -q.V];

/** Mangas en tramos: cada tramo [zona, desde, hasta] en metros desde la sisa. */
function mangas(p: Partes, cu: Cuerpo, torso: Tabla, sisa: Sisa, o: OpcManga, tramos: [string, number, number][]) {
  for (const lado of [1, -1] as const) {
    const { tabla } = tablaManga(cu, torso, sisa, lado, o);
    for (const [zona, desde, hasta] of tramos) {
      if (hasta - desde < 0.004) continue;
      p.zona(zona, tabla, [(q) => q.v - desde, (q) => hasta - q.v], { uv: uvManga });
    }
  }
}

/** Alturas repartidas para botones, entre dos alturas. */
const alturas = (desde: number, hasta: number, paso: number) => {
  const n = Math.max(1, Math.round((hasta - desde) / paso));
  return Array.from({ length: n + 1 }, (_, i) => lerp(desde, hasta, i / n));
};

// ---------------------------------------------------------------------------
// Blusa con entredós
// ---------------------------------------------------------------------------

function blusaEntredos(prenda: Prenda, o: Opciones): Modelo {
  const { c, cu, h } = base(prenda, o);
  const yH = Y_HOMBRO - c.largo / 100;
  const hol = h + 0.008;
  const torso = tablaTorso(cu, { y0: yH, y1: 1.415, holgura: hol, caida: 0.45, vuelo: { y: 1.0, pend: 0.12, ondas: 9, amp: 0.004 } });
  const sisa = sisaPara(hol);
  const E: Escote = { a: 0.075, frente: 0.065, espalda: 0.02 };
  const Eg = escoteAgrandado(E, 0.022);
  const RUEDO = 0.045,
    ENTRE = 0.035;
  const cuerpo = [fueraDeSisa(sisa), debajoDeEscote(Eg), sobre(yH + RUEDO)];
  const p = new Partes();
  p.zona("entredos", torso, [...cuerpo, delante, (q) => ENTRE - Math.abs(q.U)]);
  p.zona("delantero", torso, [...cuerpo, delante, (q) => Math.abs(q.U) - ENTRE]);
  p.zona("espalda", torso, [...cuerpo, detras], { uv: uvEspalda(torso) });
  p.zona("escote", torso, [fueraDeSisa(sisa), debajoDeEscote(E), negar(debajoDeEscote(Eg))]);
  p.zona("ruedo", torso, [bajo(yH + RUEDO)]);
  const largo = largoManga(cu, c.manga, c.m.manga);
  if (largo > 0)
    mangas(p, cu, torso, sisa, { largo, rIni: 0.064 + hol, rFin: 0.05 + hol, campana: 0.012 }, [
      ["mangas", 0, largo - 0.03],
      ["ruedo", largo - 0.03, largo],
    ]);
  return { partes: p.lista, camara: camara(1.1, 2.35), conManiqui: true };
}

// ---------------------------------------------------------------------------
// Cuello camisero (camisa y campera)
// ---------------------------------------------------------------------------

function cuello(p: Partes, zona: string, cu: Cuerpo, torso: Tabla, E: Escote, pie: number, caida: number, abertura: number, puntas: number) {
  const t = tablaCuello(cu, torso, E, { pie, caida, abertura, puntas });
  p.zona(zona, t, []);
}

/** Tapeta del frente con botones. */
function tapeta(p: Partes, zona: string, torso: Tabla, sisa: Sisa, E: Escote, ancho: number, yDesde: number, paso: number) {
  p.zona(zona, torso, [fueraDeSisa(sisa), debajoDeEscote(E), delante, sobre(yDesde), (q) => ancho - Math.abs(q.U)], { elevar: 0.0018 });
  const yTope = yEscote(torso, E, 0) - 0.018;
  p.agregar(
    zona,
    botones(
      torso,
      alturas(yDesde + 0.03, yTope, paso).map((y) => [0, y] as [number, number]),
    ),
  );
}

// ---------------------------------------------------------------------------
// Camisa con mangas desmontables
// ---------------------------------------------------------------------------

function camisaMangas(prenda: Prenda, o: Opciones): Modelo {
  const { c, cu, h } = base(prenda, o);
  const yH = Y_HOMBRO - c.largo / 100;
  const hol = h + 0.006;
  const torso = tablaTorso(cu, { y0: yH, y1: 1.415, holgura: hol, caida: 0.35, vuelo: { y: 0.98, pend: 0.08, ondas: 7, amp: 0.003 } });
  const sisa = sisaPara(hol);
  const E: Escote = { a: 0.068, frente: 0.03, espalda: 0.01 };
  const CANESU = 1.315;
  const p = new Partes();
  const cuerpo = [fueraDeSisa(sisa), debajoDeEscote(E)];
  p.zona("delantero", torso, [...cuerpo, delante]);
  p.zona("espalda", torso, [...cuerpo, detras, bajo(CANESU)], { uv: uvEspalda(torso) });
  p.zona("canesu", torso, [...cuerpo, detras, sobre(CANESU)], { uv: uvEspalda(torso) });
  tapeta(p, "delantero", torso, sisa, E, 0.016, yH, 0.075);
  cuello(p, "cuello", cu, torso, E, 0.028, 0.045, 0.16, 0.026);
  // la tira de unión queda siempre en la sisa: con «sin mangas» es la terminación de la sisa
  const UNION = 0.035;
  const largo = Math.max(UNION, largoManga(cu, c.manga, c.m.manga));
  const puno = largo > 0.3 ? 0.055 : 0.03;
  mangas(p, cu, torso, sisa, { largo, rIni: 0.058 + hol * 0.5, rFin: largo > 0.3 ? 0.042 + hol * 0.3 : 0.054 + hol * 0.4 }, [
    ["union", 0, UNION],
    ["mangas", UNION, largo - puno],
    ["punos", Math.max(UNION, largo - puno), largo],
  ]);
  return { partes: p.lista, camara: camara(1.1, 2.35), conManiqui: true };
}

// ---------------------------------------------------------------------------
// Campera de jean con aplicación
// ---------------------------------------------------------------------------

function camperaJean(prenda: Prenda, o: Opciones): Modelo {
  const { c, cu, h } = base(prenda, o);
  const yH = Y_HOMBRO - c.largo / 100;
  const hol = h + 0.018;
  const torso = tablaTorso(cu, { y0: yH, y1: 1.415, holgura: hol, caida: 0.3 });
  const sisa = sisaPara(hol, 0.01);
  const E: Escote = { a: 0.075, frente: 0.04, espalda: 0.012 };
  const CINTURA = 0.05;
  // canesú de espalda en punta, como en las camperas de jean
  const yCanesu = (x: number) => 1.3 - 0.035 * Math.max(0, 1 - Math.abs(x) / 0.12);
  const canesu: Region = (q) => q.y - yCanesu(q.x);
  const p = new Partes();
  const cuerpo = [fueraDeSisa(sisa), debajoDeEscote(E), sobre(yH + CINTURA)];
  p.zona("cuerpo", torso, [...cuerpo, delante]);
  p.zona("cuerpo", torso, [...cuerpo, detras, negar(canesu)], { uv: uvEspalda(torso) });
  p.zona("canesu", torso, [fueraDeSisa(sisa), debajoDeEscote(E), detras, canesu], { uv: uvEspalda(torso) });
  p.zona("punos_cintura", torso, [bajo(yH + CINTURA)]);
  // aplicación redonda en el centro de la espalda, apenas despegada: el motivo se centra en la pieza
  const yAp = lerp(yH + CINTURA, yCanesu(0), 0.52);
  const rAp = Math.min(0.11, (yCanesu(0) - yH - CINTURA) / 2 - 0.02);
  p.zona("aplicacion", torso, [detras, (q) => rAp - Math.hypot(q.x, q.y - yAp)], { elevar: 0.003, uv: (q) => [-q.x, q.y - yAp] });
  tapeta(p, "cuerpo", torso, sisa, E, 0.02, yH + CINTURA * 0.5, 0.085);
  // bolsillos con tapa en el pecho
  p.zona("cuerpo", torso, [delante, (q) => 0.036 - Math.abs(Math.abs(q.x) - 0.088), sobre(1.215), bajo(1.262)], { elevar: 0.0025 });
  cuello(p, "cuello", cu, torso, E, 0.03, 0.07, 0.3, 0.036);
  const largo = largoManga(cu, c.manga, c.m.manga);
  if (largo > 0)
    mangas(p, cu, torso, sisa, { largo, rIni: 0.058 + hol * 0.4, rFin: largo > 0.3 ? 0.046 + hol * 0.3 : 0.056 + hol * 0.35 }, [
      ["mangas", 0, largo - 0.05],
      ["punos_cintura", largo - 0.05, largo],
    ]);
  return { partes: p.lista, camara: camara(1.1, 2.35), conManiqui: true };
}

// ---------------------------------------------------------------------------
// Vestido con canesú de crochet
// ---------------------------------------------------------------------------

function vestidoCanesu(prenda: Prenda, o: Opciones): Modelo {
  const { c, cu, h } = base(prenda, o);
  const yH = Math.max(0.3, Y_HOMBRO - c.largo / 100);
  const hol = h + 0.004;
  const Y_TALLE = 1.08,
    Y_CANESU = 1.13,
    RUEDO = 0.06;
  const torso = tablaTorso(cu, { y0: yH, y1: 1.415, holgura: hol, caida: 1.0, vuelo: { y: Y_TALLE, pend: 0.26, ondas: 12, amp: 0.016 } });
  const sisa = sisaPara(hol);
  const E: Escote = { a: 0.085, frente: 0.08, espalda: 0.04 };
  const p = new Partes();
  p.zona("canesu", torso, [fueraDeSisa(sisa), debajoDeEscote(E), sobre(Y_CANESU)]);
  p.zona("cintura", torso, [sobre(Y_TALLE), bajo(Y_CANESU)]);
  p.zona("falda", torso, [sobre(yH + RUEDO), bajo(Y_TALLE)]);
  p.zona("ruedo", torso, [bajo(yH + RUEDO)]);
  const largo = largoManga(cu, c.manga, c.m.manga);
  if (largo > 0) mangas(p, cu, torso, sisa, { largo, rIni: 0.064 + hol, rFin: 0.054 + hol, campana: 0.016 }, [["mangas", 0, largo]]);
  return { partes: p.lista, camara: camara(0.95, 2.5), conManiqui: true };
}

// ---------------------------------------------------------------------------
// Kimono
// ---------------------------------------------------------------------------

function kimono(prenda: Prenda, o: Opciones): Modelo {
  const { c, cu, h } = base(prenda, o);
  const yH = Math.max(0.4, Y_HOMBRO - c.largo / 100);
  const hol = h + 0.025;
  const torso = tablaTorso(cu, { y0: yH, y1: 1.415, holgura: hol, caida: 0.15 });
  const sisa: Sisa = { tc: 1.6, dt: 0.5, yc: 1.29 - hol * 0.5, b: 0.1 + hol * 0.5 };
  const E: Escote = { a: 0.075, frente: 0.004, espalda: 0.02 };
  const SOL = 0.045,
    RUEDO = 0.05;
  const Eg = escoteAgrandado(E, SOL);
  // el frente queda abierto: se angosta hacia abajo
  const g = (y: number) => lerp(0.03, 0.075, sm(1.12, 1.4, y));
  const enFrente = (q: Q) => Math.abs(q.u) < Math.PI / 2;
  const abierto: Region = (q) => (enFrente(q) ? Math.abs(q.x) - g(q.y) : 1);
  const fueraSolapa: Region = (q) => (enFrente(q) ? Math.abs(q.x) - g(q.y) - SOL : 1);
  const solapa = alguna(
    todas(delante, abierto, negar(fueraSolapa), debajoDeEscote(E)),
    todas(detras, debajoDeEscote(E), negar(debajoDeEscote(Eg))),
  );
  const p = new Partes();
  p.zona("solapa", torso, [fueraDeSisa(sisa), solapa]);
  p.zona("delanteros", torso, [fueraDeSisa(sisa), debajoDeEscote(E), delante, fueraSolapa, sobre(yH + RUEDO)]);
  p.zona("espalda", torso, [fueraDeSisa(sisa), debajoDeEscote(Eg), detras, sobre(yH + RUEDO)], { uv: uvEspalda(torso) });
  p.zona("ruedo", torso, [bajo(yH + RUEDO), fueraSolapa]);
  const largo = largoManga(cu, c.manga, c.m.manga);
  if (largo > 0)
    mangas(p, cu, torso, sisa, { largo, rIni: 0.075 + hol * 0.5, rFin: 0.08 + hol * 0.5, campana: 0.02, colgado: 0.04 }, [
      ["mangas", 0, largo - 0.04],
      ["ruedo", largo - 0.04, largo],
    ]);
  return { partes: p.lista, camara: camara(1.0, 2.45), conManiqui: true };
}

// ---------------------------------------------------------------------------
// Falda semicampana con franja
// ---------------------------------------------------------------------------

function faldaFranja(prenda: Prenda, o: Opciones): Modelo {
  const { c, cu, h } = base(prenda, o);
  const yW = Y_CINTURA + 0.025;
  const yH = Math.max(0.3, Y_CINTURA - c.largo / 100);
  const PRETINA = 0.04,
    RUEDO = 0.06,
    FRANJA = 0.045;
  const torso = tablaTorso(cu, { y0: yH, y1: yW, holgura: h * 0.5 + 0.002, caida: 0, vuelo: { y: Y_CINTURA, pend: 0.36, ondas: 11, amp: 0.02 } });
  // la franja da toda la vuelta en diagonal: alta sobre una cadera, baja sobre la otra.
  // Es el corte de un plano inclinado, así cierra sola en la espalda sin saltos.
  const yMedio = (yW - PRETINA + yH + RUEDO) / 2;
  const amp = Math.max(0, (yW - PRETINA - yH - RUEDO) / 2 - FRANJA - 0.012);
  const franja: Region = (q) => {
    // ancho parejo medido en perpendicular a la franja, no en vertical
    const pend = (amp * Math.cos(q.u)) / Math.max(0.12, Math.hypot(q.x, q.z));
    return FRANJA * Math.sqrt(1 + pend * pend) - Math.abs(q.y - (yMedio + amp * Math.sin(q.u)));
  };
  const medio = [sobre(yH + RUEDO), bajo(yW - PRETINA)];
  const p = new Partes();
  p.zona("pretina", torso, [sobre(yW - PRETINA)]);
  p.zona("paneles", torso, [...medio, negar(franja)]);
  p.zona("franja", torso, [...medio, franja]);
  p.zona("ruedo", torso, [bajo(yH + RUEDO)]);
  return { partes: p.lista, camara: camara(0.85, 2.45), conManiqui: true };
}

export function construirPrendaNueva(prenda: Prenda, o: Opciones): Modelo | null {
  switch (prenda.id) {
    case "blusa_entredos":
      return blusaEntredos(prenda, o);
    case "camisa_mangas":
      return camisaMangas(prenda, o);
    case "campera_jean":
      return camperaJean(prenda, o);
    case "vestido_canesu":
      return vestidoCanesu(prenda, o);
    case "kimono":
      return kimono(prenda, o);
    case "falda_franja":
      return faldaFranja(prenda, o);
    default:
      return null;
  }
}
