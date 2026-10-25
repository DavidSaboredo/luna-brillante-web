// Datos del taller "Crear prenda": prendas, zonas, telas, medidas y cómo se ven los puntos.
// Las medidas por talle y las piezas (espalda, delantero, mangas…) salen de las revistas.
import { buscarPunto, textoRepeticion, type Punto } from "./puntos";
import { cintura, medidasTalle, type Medidas } from "./medidas";

export type Tecnica = "tela" | "crochet";
export type Manga = "sin" | "corta" | "tres_cuartos" | "larga";
export type Largo = "corto" | "medio" | "largo";
export type Ajuste = "ajustado" | "normal" | "suelto";
export type Grupo = "cuerpo" | "abajo" | "accesorios";

export interface Opciones {
  talle: number;
  manga: Manga;
  largo: Largo;
  ajuste: Ajuste;
}

export const OPCIONES_INICIALES: Opciones = { talle: 42, manga: "tres_cuartos", largo: "medio", ajuste: "normal" };

export const MANGAS: { id: Manga; nombre: string }[] = [
  { id: "sin", nombre: "Sin mangas" },
  { id: "corta", nombre: "Corta" },
  { id: "tres_cuartos", nombre: "3/4" },
  { id: "larga", nombre: "Larga" },
];
export const LARGOS: { id: Largo; nombre: string }[] = [
  { id: "corto", nombre: "Corto" },
  { id: "medio", nombre: "Medio" },
  { id: "largo", nombre: "Largo" },
];
export const AJUSTES: { id: Ajuste; nombre: string }[] = [
  { id: "ajustado", nombre: "Ajustado" },
  { id: "normal", nombre: "Normal" },
  { id: "suelto", nombre: "Suelto" },
];

/** Cómo se calculan las piezas de cada prenda a partir del talle y las opciones. */
export interface Contexto {
  m: Medidas;
  o: Opciones;
  /** Holgura total sumada al contorno (cm) */
  holgura: number;
  /** Largo de la prenda principal (cm), ya con la opción de largo aplicada */
  largo: number;
  /** Largo de la manga elegida (cm) */
  manga: number;
}

export interface Pieza {
  nombre: string;
  /** Ancho a tejer (cm) */
  ancho: number;
  /** Alto a tejer (cm) */
  alto: number;
  cantidad: number;
  nota?: string;
}

export interface Zona {
  id: string;
  nombre: string;
  /** Categorías de puntos que se sugieren primero para esta zona */
  sugeridas: string[];
  piezas: (c: Contexto) => Pieza[];
}

export interface Prenda {
  id: string;
  nombre: string;
  icono: string;
  grupo: Grupo;
  descripcion: string;
  /** Opciones que se pueden cambiar en esta prenda */
  opciones: ("talle" | "manga" | "largo" | "ajuste")[];
  defecto?: Partial<Opciones>;
  /** Largo base en cm (desde el hombro; desde la cintura en prendas de abajo) */
  largoBase: (m: Medidas) => number;
  zonas: Zona[];
  /** Orden de armado, tomado de las terminaciones de las revistas */
  armado: string[];
}

export interface Tela {
  id: string;
  nombre: string;
  descripcion: string;
}

/** `material` es el id de una tela o el id de un punto de la biblioteca. */
export interface EleccionZona {
  material: string;
  color: string;
}

export interface Diseno {
  id: string;
  nombre: string;
  prenda: string;
  zonas: Record<string, EleccionZona>;
  notas: string;
  creado: string;
  opciones?: Opciones;
}

const CUERPO = ["texturas", "calados", "variaciones_lazada", "relieve"];
const BORDES = ["bordes", "calados"];
const DELICADO = ["calados", "racimos", "flores", "motivos_cuadrados"];
const FIRME = ["texturas", "relieve", "variaciones_lazada"];
const ELASTICO = ["relieve", "variaciones_lazada", "texturas"];

const AJUSTE_CM: Record<Ajuste, number> = { ajustado: 2, normal: 8, suelto: 16 };
const LARGO_CM: Record<Largo, number> = { corto: -10, medio: 0, largo: 12 };

export function contexto(prenda: Prenda, o: Opciones): Contexto {
  const m = medidasTalle(o.talle);
  const factor: Record<Manga, number> = { sin: 0, corta: 0.4, tres_cuartos: 0.75, larga: 1 };
  return {
    m,
    o,
    holgura: AJUSTE_CM[o.ajuste],
    largo: Math.max(20, prenda.largoBase(m) + LARGO_CM[o.largo]),
    manga: Math.round(m.manga * factor[o.manga]),
  };
}

const anchoPanel = (c: Contexto) => Math.round((c.m.busto + c.holgura) / 2);
const anchoCadera = (c: Contexto) => Math.round((c.m.cadera + c.holgura) / 2);
const anchoCintura = (c: Contexto) => Math.round((cintura(c.m) + c.holgura) / 2);

const mangas = (c: Contexto): Pieza[] =>
  c.manga > 0
    ? [
        {
          nombre: "Manga",
          ancho: Math.round(c.m.busto * 0.34 + c.holgura / 2),
          alto: c.manga,
          cantidad: 2,
          nota: `baja hasta ${Math.round(c.m.puno + 3)} cm en el puño`,
        },
      ]
    : [];

const cuerpoTorso = (c: Contexto): Pieza[] => [
  { nombre: "Espalda", ancho: anchoPanel(c), alto: c.largo - 1, cantidad: 1 },
  { nombre: "Delantero", ancho: anchoPanel(c), alto: c.largo - 1, cantidad: 1 },
];

const BASE_TORSO = (m: Medidas) => m.total;

export const PRENDAS: Prenda[] = [
  {
    id: "blusa",
    nombre: "Blusa",
    icono: "👚",
    grupo: "cuerpo",
    descripcion: "Blusa calada con canesú, como la Brisa de Verano.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "tres_cuartos" },
    largoBase: BASE_TORSO,
    zonas: [
      { id: "mangas", nombre: "Mangas", sugeridas: DELICADO, piezas: mangas },
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: CUERPO, piezas: (c) => cuerpoTorso(c).map((p) => ({ ...p, alto: p.alto - 9 })) },
      { id: "canesu", nombre: "Canesú / cuello", sugeridas: DELICADO, piezas: (c) => [{ nombre: "Canesú", ancho: anchoPanel(c), alto: 9, cantidad: 2 }] },
      { id: "borde", nombre: "Borde inferior", sugeridas: BORDES, piezas: (c) => [{ nombre: "Borde", ancho: c.m.busto + c.holgura, alto: 5, cantidad: 1 }] },
    ],
    armado: [
      "Tejer espalda y delantero de abajo hacia arriba, en una sola pieza hasta la sisa.",
      "Dividir en delantero y espalda y seguir cada parte por separado.",
      "Unir los hombros.",
      "Tejer el borde del escote con una vuelta de abanicos.",
      "Coser o unir las mangas.",
      "Hacer el borde inferior de la blusa y de las mangas, esconder las hebras y bloquear.",
    ],
  },
  {
    id: "sueter",
    nombre: "Suéter",
    icono: "🧥",
    grupo: "cuerpo",
    descripcion: "Suéter de manga larga con cuello y puños elásticos.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "larga", ajuste: "normal" },
    largoBase: (m) => m.total + 4,
    zonas: [
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: CUERPO, piezas: cuerpoTorso },
      { id: "mangas", nombre: "Mangas", sugeridas: CUERPO, piezas: mangas },
      { id: "cuello", nombre: "Cuello", sugeridas: ELASTICO, piezas: (c) => [{ nombre: "Cuello", ancho: 48, alto: 8, cantidad: 1, nota: "se levantan puntos alrededor del escote" }] },
      { id: "puños", nombre: "Puños", sugeridas: ELASTICO, piezas: (c) => (c.manga > 0 ? [{ nombre: "Puño", ancho: Math.round(c.m.puno + 2), alto: 6, cantidad: 2 }] : []) },
      { id: "borde", nombre: "Borde inferior", sugeridas: ELASTICO, piezas: (c) => [{ nombre: "Borde", ancho: c.m.busto + c.holgura, alto: 6, cantidad: 1 }] },
    ],
    armado: [
      "Tejer el delantero, la espalda y las mangas por separado, según el esquema.",
      "Unir los hombros.",
      "Levantar puntos alrededor del escote y tejer 2 o 3 hileras (o el cuello elástico).",
      "Centrar y coser las mangas; cerrar todos los laterales.",
      "Ribetear el escote, los puños y los bordes inferiores.",
      "Esconder las hebras y bloquear la prenda.",
    ],
  },
  {
    id: "musculosa",
    nombre: "Musculosa",
    icono: "🎽",
    grupo: "cuerpo",
    descripcion: "Top con breteles, como el Top Granny o la remera con breteles.",
    opciones: ["talle", "largo", "ajuste"],
    defecto: { ajuste: "ajustado", manga: "sin" },
    largoBase: (m) => m.total - 8,
    zonas: [
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: [...DELICADO, "texturas"], piezas: (c) => cuerpoTorso(c).map((p) => ({ ...p, alto: p.alto - 11 })) },
      { id: "breteles", nombre: "Breteles", sugeridas: FIRME, piezas: () => [{ nombre: "Bretel", ancho: 4, alto: 45, cantidad: 2, nota: "4 o 5 cadenas de ancho, del largo deseado" }] },
      { id: "borde", nombre: "Borde", sugeridas: BORDES, piezas: (c) => [{ nombre: "Borde", ancho: c.m.busto + c.holgura, alto: 3, cantidad: 1 }] },
    ],
    armado: [
      "Tejer espalda y delantero por separado (o en granny squares, según el talle).",
      "Unir los laterales con punto bajo o aguja lanera.",
      "Tejer los breteles de 4 o 5 cadenas de ancho y coserlos adelante y atrás.",
      "Dar una vuelta de punto bajo alrededor del contorno; opcional, borde de conchas.",
    ],
  },
  {
    id: "chaleco",
    nombre: "Chaleco",
    icono: "🦺",
    grupo: "cuerpo",
    descripcion: "Chaleco abierto adelante, sin mangas.",
    opciones: ["talle", "largo", "ajuste"],
    defecto: { ajuste: "normal", manga: "sin" },
    largoBase: (m) => m.total + 6,
    zonas: [
      { id: "espalda", nombre: "Espalda", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Espalda", ancho: anchoPanel(c), alto: c.largo, cantidad: 1 }] },
      { id: "delanteros", nombre: "Delanteros", sugeridas: [...CUERPO, "motivos_cuadrados"], piezas: (c) => [{ nombre: "Delantero", ancho: Math.round(anchoPanel(c) / 2 + 2), alto: c.largo, cantidad: 2 }] },
      { id: "ribete", nombre: "Ribete", sugeridas: BORDES, piezas: (c) => [{ nombre: "Ribete del frente y el escote", ancho: 3, alto: c.largo * 2 + 40, cantidad: 1 }] },
    ],
    armado: [
      "Tejer la espalda y los dos delanteros por separado.",
      "Unir los hombros y cerrar los laterales.",
      "Ribetear el contorno de las sisas, el frente y el cuello con 1 hilera de medio punto.",
      "Esconder las hebras y bloquear.",
    ],
  },
  {
    id: "cardigan",
    nombre: "Cárdigan",
    icono: "🧶",
    grupo: "cuerpo",
    descripcion: "Saco abierto con mangas, como el cárdigan con un botón.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "larga", ajuste: "normal" },
    largoBase: (m) => m.total + 10,
    zonas: [
      { id: "espalda", nombre: "Espalda", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Espalda", ancho: anchoPanel(c), alto: c.largo, cantidad: 1 }] },
      { id: "delanteros", nombre: "Delanteros", sugeridas: [...CUERPO, "motivos_cuadrados"], piezas: (c) => [{ nombre: "Delantero", ancho: Math.round(anchoPanel(c) / 2 + 2), alto: c.largo, cantidad: 2 }] },
      { id: "mangas", nombre: "Mangas", sugeridas: CUERPO, piezas: mangas },
      { id: "ribete", nombre: "Ribete del frente", sugeridas: BORDES, piezas: (c) => [{ nombre: "Ribete", ancho: 3, alto: c.largo * 2 + 40, cantidad: 1 }] },
    ],
    armado: [
      "Tejer espalda, delanteros y mangas por separado.",
      "Unir los hombros. Coser las mangas y cerrar los laterales.",
      "Ribetear el frente, el cuello, los puños y los bordes inferiores.",
      "Si lleva botón, tejer una presilla (arco de cadenas del tamaño del botón).",
    ],
  },
  {
    id: "poncho",
    nombre: "Poncho",
    icono: "🪭",
    grupo: "cuerpo",
    descripcion: "Poncho de cuadrados o de una pieza, con cuello y flecos.",
    opciones: ["talle", "largo"],
    defecto: {},
    largoBase: () => 70,
    zonas: [
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: [...DELICADO, "texturas"], piezas: (c) => [{ nombre: "Paño", ancho: Math.round(c.largo * 1.4), alto: Math.round(c.largo * 1.4), cantidad: 2, nota: "delantero y espalda; o motivos cuadrados unidos" }] },
      { id: "cuello", nombre: "Cuello", sugeridas: ELASTICO, piezas: () => [{ nombre: "Cuello", ancho: 52, alto: 10, cantidad: 1 }] },
      { id: "flecos", nombre: "Flecos", sugeridas: BORDES, piezas: () => [{ nombre: "Flecos", ancho: 140, alto: 12, cantidad: 1, nota: "hebras de 25 a 30 cm" }] },
    ],
    armado: [
      "Tejer los dos paños (o los motivos cuadrados) y unirlos dejando la abertura del cuello.",
      "Levantar puntos alrededor del escote y tejer el cuello.",
      "Colocar los flecos en el borde inferior: 3 o 4 hebras dobladas por la mitad, pasadas con la aguja y atadas.",
      "Bloquear y emparejar los flecos.",
    ],
  },
  {
    id: "chal",
    nombre: "Chal triangular",
    icono: "🔺",
    grupo: "accesorios",
    descripcion: "Chal en triángulo con flecos, como el Chal Encanto.",
    opciones: [],
    defecto: {},
    largoBase: () => 80,
    zonas: [
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: DELICADO, piezas: (c) => [{ nombre: "Chal", ancho: 160, alto: c.largo, cantidad: 1, nota: "se empieza por el centro y se aumenta a los lados" }] },
      { id: "borde", nombre: "Borde", sugeridas: BORDES, piezas: () => [{ nombre: "Puntilla", ancho: 3, alto: 260, cantidad: 1 }] },
      { id: "flecos", nombre: "Flecos", sugeridas: BORDES, piezas: () => [{ nombre: "Flecos", ancho: 6, alto: 28, cantidad: 40, nota: "hebras de 25 a 30 cm" }] },
    ],
    armado: [
      "Empezar en el centro: 4 cadenas cerradas con punto raso, luego los abanicos centrales.",
      "Girar en cada vuelta, aumentando en el centro y en los dos extremos hasta el tamaño deseado.",
      "Cortar hebras de 25 a 30 cm, doblarlas por la mitad y pasarlas por los espacios de los lados inferiores.",
      "Atar, emparejar y bloquear.",
    ],
  },
  {
    id: "vestido",
    nombre: "Vestido",
    icono: "👗",
    grupo: "cuerpo",
    descripcion: "Vestido con corpiño, cintura y falda de vuelo.",
    opciones: ["talle", "largo", "ajuste"],
    defecto: { ajuste: "ajustado", largo: "medio" },
    largoBase: (m) => m.total + 38,
    zonas: [
      { id: "tirantes", nombre: "Tirantes", sugeridas: FIRME, piezas: () => [{ nombre: "Tirante", ancho: 4, alto: 40, cantidad: 2 }] },
      { id: "corpino", nombre: "Corpiño", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Corpiño", ancho: Math.round((c.m.busto + c.holgura) / 2), alto: 24, cantidad: 2 }] },
      { id: "falda", nombre: "Falda", sugeridas: DELICADO, piezas: (c) => [{ nombre: "Falda", ancho: Math.round((c.m.cadera + c.holgura) / 2 + 20), alto: c.largo - 30, cantidad: 2, nota: "vuelo con aumentos" }] },
      { id: "cintura", nombre: "Cintura", sugeridas: ["relieve", "variaciones_lazada"], piezas: (c) => [{ nombre: "Cintura", ancho: anchoCintura(c), alto: 4, cantidad: 2 }] },
      { id: "ruedo", nombre: "Ruedo", sugeridas: BORDES, piezas: () => [{ nombre: "Ruedo", ancho: 150, alto: 6, cantidad: 1 }] },
    ],
    armado: [
      "Tejer el corpiño (delantero y espalda) y la falda por separado o de corrido desde la cintura.",
      "Unir los laterales y levantar los puntos de la cintura.",
      "Coser o tejer los tirantes.",
      "Dar el borde del ruedo y bloquear.",
    ],
  },
  {
    id: "falda",
    nombre: "Falda",
    icono: "🩰",
    grupo: "abajo",
    descripcion: "Falda recta o con vuelo, con pretina y volado.",
    opciones: ["talle", "largo", "ajuste"],
    defecto: { ajuste: "normal", largo: "medio" },
    largoBase: () => 58,
    zonas: [
      { id: "pretina", nombre: "Pretina", sugeridas: ["relieve", "variaciones_lazada"], piezas: (c) => [{ nombre: "Pretina", ancho: cintura(c.m) + 4, alto: 5, cantidad: 1 }] },
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Panel", ancho: anchoCadera(c), alto: c.largo - 12, cantidad: 2 }] },
      { id: "volado", nombre: "Volado", sugeridas: BORDES, piezas: (c) => [{ nombre: "Volado", ancho: c.m.cadera + 40, alto: 12, cantidad: 1 }] },
    ],
    armado: [
      "Tejer la pretina a lo ancho (hilera de ida y vuelta) y cerrarla en redondo.",
      "Levantar los puntos de la pretina y tejer el cuerpo hacia abajo, aumentando para el vuelo.",
      "Tejer el volado o la puntilla del ruedo.",
      "Pasar un elástico o cordón por la pretina y bloquear.",
    ],
  },
  {
    id: "pollera",
    nombre: "Pollera con lazo",
    icono: "💃",
    grupo: "abajo",
    descripcion: "Pollera de vuelo con lazo en la cintura, como la «Gracia y movimiento».",
    opciones: ["talle", "largo"],
    defecto: { largo: "medio" },
    largoBase: () => 52,
    zonas: [
      { id: "pretina", nombre: "Pretina", sugeridas: ["relieve", "variaciones_lazada"], piezas: (c) => [{ nombre: "Pretina", ancho: cintura(c.m) + 4, alto: 6, cantidad: 1 }] },
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: [...DELICADO, "texturas"], piezas: (c) => [{ nombre: "Panel", ancho: Math.round(c.m.cadera / 2 + 25), alto: c.largo - 14, cantidad: 2, nota: "aumentos cada pocas hileras" }] },
      { id: "volado", nombre: "Volado", sugeridas: BORDES, piezas: (c) => [{ nombre: "Volado", ancho: Math.round(c.m.cadera + 80), alto: 14, cantidad: 1 }] },
      { id: "lazo", nombre: "Lazo", sugeridas: FIRME, piezas: () => [{ nombre: "Lazo", ancho: 5, alto: 150, cantidad: 1 }] },
    ],
    armado: [
      "Tejer la pretina y el cuerpo en redondo, aumentando para el vuelo.",
      "Tejer el volado inferior (o una guarda calada).",
      "Hacer el lazo: una tira de 5 puntos de ancho por 150 cm.",
      "Pasar el lazo por los ojales de la pretina y bloquear.",
    ],
  },
  {
    id: "short",
    nombre: "Short",
    icono: "🩳",
    grupo: "abajo",
    descripcion: "Short de crochet con pretina; también para decorar un short de jean.",
    opciones: ["talle", "largo", "ajuste"],
    defecto: { ajuste: "normal", largo: "medio" },
    largoBase: () => 42,
    zonas: [
      { id: "pretina", nombre: "Pretina", sugeridas: ELASTICO, piezas: (c) => [{ nombre: "Pretina", ancho: cintura(c.m) + 4, alto: 5, cantidad: 1 }] },
      { id: "piernas", nombre: "Piernas", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Pierna", ancho: Math.round(c.m.cadera / 2 + 6), alto: c.largo - 5, cantidad: 2 }] },
      { id: "puños", nombre: "Puños", sugeridas: BORDES, piezas: (c) => [{ nombre: "Puño", ancho: Math.round(c.m.cadera / 2 + 8), alto: 5, cantidad: 2 }] },
    ],
    armado: [
      "Tejer las dos piernas por separado.",
      "Coser la entrepierna y unir las dos piernas.",
      "Levantar los puntos de la cintura y tejer la pretina; pasar un elástico.",
      "Terminar los bajos con una puntilla.",
    ],
  },
  {
    id: "bikini",
    nombre: "Bikini",
    icono: "👙",
    grupo: "abajo",
    descripcion: "Corpiño de tazas y bombacha con tiras, como el bikini «a puro sol».",
    opciones: ["talle"],
    defecto: {},
    largoBase: () => 20,
    zonas: [
      { id: "tazas", nombre: "Tazas", sugeridas: [...DELICADO, "texturas"], piezas: () => [{ nombre: "Taza", ancho: 15, alto: 13, cantidad: 2, nota: "triángulo: aumentando desde la punta" }] },
      { id: "bombacha", nombre: "Bombacha", sugeridas: [...DELICADO, "texturas"], piezas: (c) => [{ nombre: "Bombacha", ancho: 23, alto: 20, cantidad: 1, nota: "empieza en la entrepierna" }] },
      { id: "tiras", nombre: "Tiras", sugeridas: FIRME, piezas: () => [{ nombre: "Tira", ancho: 3, alto: 65, cantidad: 4, nota: "cordones de cadeneta o punto bajo" }] },
    ],
    armado: [
      "Tejer las dos tazas (triángulos) y la parte delantera de la bombacha.",
      "Tejer las tiras para atar: de cadenas o de punto bajo.",
      "Pasar las tiras por la última vuelta de cada pieza y anudar.",
    ],
  },
  {
    id: "bolso",
    nombre: "Bolso",
    icono: "👜",
    grupo: "accesorios",
    descripcion: "Bolso de motivos unidos, como el Natural Pocket.",
    opciones: [],
    defecto: {},
    largoBase: () => 24,
    zonas: [
      { id: "asa", nombre: "Asas", sugeridas: FIRME, piezas: () => [{ nombre: "Asa", ancho: 3, alto: 55, cantidad: 2, nota: "o asas de cuero con herrajes" }] },
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: [...FIRME, "motivos", "motivos_cuadrados", "calados"], piezas: () => [{ nombre: "Frente o espalda", ancho: 32, alto: 24, cantidad: 2 }] },
      { id: "solapa", nombre: "Borde superior", sugeridas: ["flores", "racimos", "motivos_cuadrados"], piezas: () => [{ nombre: "Borde", ancho: 90, alto: 5, cantidad: 1, nota: "4 o 5 vueltas de punto alto" }] },
      { id: "base", nombre: "Base", sugeridas: FIRME, piezas: () => [{ nombre: "Base", ancho: 32, alto: 12, cantidad: 1 }] },
    ],
    armado: [
      "Tejer los motivos (17 en el Natural Pocket): 6 al frente, 6 atrás, 2 a los lados y 3 en la base.",
      "Unirlos con aguja lanera por el revés, tomando solo las hebras traseras.",
      "Tejer 4 o 5 vueltas de punto alto en el borde superior, con 2 puntos en las esquinas.",
      "Fijar las asas con remaches o coserlas firme; agregar forro de tela si querés.",
    ],
  },
  {
    id: "gorro",
    nombre: "Gorro",
    icono: "🧢",
    grupo: "accesorios",
    descripcion: "Gorro tejido en redondo con puño y pompón.",
    opciones: [],
    defecto: {},
    largoBase: () => 22,
    zonas: [
      { id: "copa", nombre: "Copa", sugeridas: CUERPO, piezas: () => [{ nombre: "Copa", ancho: 54, alto: 18, cantidad: 1, nota: "en redondo, empezando por el anillo mágico" }] },
      { id: "puño", nombre: "Puño", sugeridas: ELASTICO, piezas: () => [{ nombre: "Puño", ancho: 52, alto: 6, cantidad: 1 }] },
      { id: "pompon", nombre: "Pompón", sugeridas: ["racimos", "flores"], piezas: () => [{ nombre: "Pompón", ancho: 8, alto: 8, cantidad: 1 }] },
    ],
    armado: [
      "Empezar con anillo mágico y aumentar 6 puntos por vuelta hasta el diámetro deseado.",
      "Tejer la altura sin aumentos y terminar con el puño elástico.",
      "Agregar el pompón y esconder las hebras.",
    ],
  },
  {
    id: "bufanda",
    nombre: "Bufanda",
    icono: "🧣",
    grupo: "accesorios",
    descripcion: "Bufanda larga con flecos, como las bufandas con flores.",
    opciones: [],
    defecto: {},
    largoBase: () => 170,
    zonas: [
      { id: "cuerpo", nombre: "Cuerpo", sugeridas: [...CUERPO, "motivos_cuadrados"], piezas: (c) => [{ nombre: "Bufanda", ancho: 22, alto: c.largo, cantidad: 1 }] },
      { id: "borde", nombre: "Borde", sugeridas: BORDES, piezas: () => [{ nombre: "Borde", ancho: 3, alto: 400, cantidad: 1 }] },
      { id: "flecos", nombre: "Flecos", sugeridas: BORDES, piezas: () => [{ nombre: "Flecos", ancho: 22, alto: 15, cantidad: 2 }] },
    ],
    armado: [
      "Tejer una tira de 20 a 25 cm de ancho y el largo deseado.",
      "Colocar los flecos en las dos puntas: hebras dobladas por la mitad, pasadas con la aguja y atadas.",
      "Bloquear y emparejar los flecos.",
    ],
  },
];

export const GRUPOS: { id: Grupo; nombre: string }[] = [
  { id: "cuerpo", nombre: "Parte de arriba" },
  { id: "abajo", nombre: "Parte de abajo" },
  { id: "accesorios", nombre: "Accesorios" },
];

export function opcionesPara(prenda: Prenda, base?: Partial<Opciones>): Opciones {
  return { ...OPCIONES_INICIALES, ...prenda.defecto, ...base };
}

export const TELAS: Tela[] = [
  { id: "lino", nombre: "Lino", descripcion: "Fresco y natural, ideal para verano." },
  { id: "algodon", nombre: "Algodón", descripcion: "Suave y fácil de coser." },
  { id: "gasa", nombre: "Gasa / muselina", descripcion: "Liviana y con caída." },
  { id: "tul", nombre: "Tul", descripcion: "Transparente, aporta volumen." },
  { id: "denim", nombre: "Denim", descripcion: "Firme, combina con crochet rústico." },
];

export const COLORES = [
  { nombre: "Lavanda", hex: "#d9cdf0" },
  { nombre: "Rosa", hex: "#f6d5dc" },
  { nombre: "Menta", hex: "#cfe8dc" },
  { nombre: "Manteca", hex: "#f7e9bd" },
  { nombre: "Cielo", hex: "#d3e4f3" },
  { nombre: "Durazno", hex: "#f9d9c4" },
  { nombre: "Crudo", hex: "#f3ece1" },
  { nombre: "Salvia", hex: "#b9cbb1" },
  { nombre: "Terracota", hex: "#c98b6b" },
  { nombre: "Azul", hex: "#6f93c4" },
  { nombre: "Verde", hex: "#7aa27a" },
  { nombre: "Bordó", hex: "#a14a5a" },
];

/** Textura que se dibuja en el modelo para cada punto. */
function texturaDePunto(p: Punto) {
  if (["shell_stitch", "fan_stitch", "scallop_edging"].includes(p.id)) return "concha";
  if (["granny_stitch", "granny_square", "corner_to_corner"].includes(p.id)) return "granny";
  const porCategoria: Record<string, string> = {
    calados: "red",
    racimos: "motas",
    especiales: "motas",
    relieve: "relieve",
    bordes: "concha",
    motivos: "granny",
    motivos_cuadrados: "granny",
    flores: "flores",
    tunecino: "tunecino",
  };
  return porCategoria[p.category] ?? "bajo";
}

export interface InfoMaterial {
  nombre: string;
  tecnica: Tecnica;
  textura: string;
  punto?: Punto;
}

export function infoMaterial(id: string): InfoMaterial | undefined {
  const tela = TELAS.find((t) => t.id === id);
  if (tela) return { nombre: tela.nombre, tecnica: "tela", textura: tela.id };
  const punto = buscarPunto(id);
  if (punto) return { nombre: punto.name.es, tecnica: "crochet", textura: texturaDePunto(punto), punto };
}

export function nombreColor(hex: string) {
  return COLORES.find((c) => c.hex === hex)?.nombre ?? hex;
}

/** Descripción en texto del diseño, para mandársela a Luna IA. */
export function describirDiseno(prenda: Prenda, zonas: Record<string, EleccionZona>, notas: string, opciones?: Opciones) {
  const lineas = prenda.zonas.map((z) => {
    const e = zonas[z.id];
    const m = e && infoMaterial(e.material);
    if (!m) return `- ${z.nombre}: sin definir`;
    const detalle = m.punto ? `crochet en ${m.nombre}${m.punto.repeat ? ` (${textoRepeticion(m.punto)?.toLowerCase()})` : ""}` : `tela de ${m.nombre.toLowerCase()}`;
    return `- ${z.nombre}: ${detalle}, color ${nombreColor(e.color).toLowerCase()}`;
  });
  const medidas = opciones
    ? `Talle ${opciones.talle}${prenda.opciones.includes("manga") ? `, manga ${MANGAS.find((m) => m.id === opciones.manga)?.nombre.toLowerCase()}` : ""}${prenda.opciones.includes("ajuste") ? `, calce ${opciones.ajuste}` : ""}${prenda.opciones.includes("largo") ? `, largo ${opciones.largo}` : ""}.`
    : "";
  return [
    `Diseñé mi ${prenda.nombre.toLowerCase()} combinando tela y crochet:`,
    medidas,
    ...lineas,
    notas ? `Notas: ${notas}` : "",
    "¿Me puedes dar los patrones de las partes en crochet y guiarme paso a paso para armarla y unirla con la tela?",
  ]
    .filter(Boolean)
    .join("\n");
}
