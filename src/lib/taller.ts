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
  /** Combinación de tela y crochet con la que arranca la prenda */
  inicial?: Record<string, EleccionZona>;
  /** Ya no se ofrece para diseños nuevos; se conserva solo para abrir diseños guardados */
  retirada?: boolean;
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
const DELICADO = ["calados", "racimos", "flores", "motivos_cuadrados", "granny"];
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

// ---------------------------------------------------------------------------
// Catálogo nuevo: tela y crochet combinados, como en las revistas
// ---------------------------------------------------------------------------

const CRUDO = "#f3ece1";
const tela = (material: string, color: string): EleccionZona => ({ material, color });
const r = Math.round;
/** Contorno de la sisa (cm): sirve para la tira de unión de las mangas. */
const contornoSisa = (c: Contexto) => r(c.m.sisa * 2 + 4);
const bordeManga = (c: Contexto, nombre: string, alto: number, extra = 6): Pieza[] =>
  c.manga > 0 ? [{ nombre, ancho: r(c.m.puno + extra), alto, cantidad: 2 }] : [];
const mangaRecta = (c: Contexto, descuento: number, ancho = c.m.busto * 0.34 + c.holgura / 2): Pieza[] =>
  c.manga - descuento > 2 ? [{ nombre: "Manga", ancho: r(ancho), alto: r(c.manga - descuento), cantidad: 2 }] : [];
/** Contorno del ruedo de una falda con vuelo (cm): se abre `pend` cm de radio por cada cm de largo. */
const ruedoConVuelo = (cinturaCm: number, largoCm: number, pend: number) => r(cinturaCm + Math.PI * 2 * pend * largoCm);
const SUAVE = ["calados", "bordes", "racimos"];

const NUEVAS: Prenda[] = [
  {
    id: "blusa_entredos",
    nombre: "Blusa con entredós",
    icono: "👚",
    grupo: "cuerpo",
    descripcion: "Blusa de lino o gasa con una tira de crochet calado al centro del delantero.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "corta" },
    largoBase: (m) => m.total - 4,
    zonas: [
      {
        id: "delantero",
        nombre: "Delantero",
        sugeridas: CUERPO,
        piezas: (c) => [{ nombre: "Delantero", ancho: anchoPanel(c) - 7, alto: c.largo - 5, cantidad: 1, nota: "en dos mitades, una a cada lado del entredós" }],
      },
      { id: "espalda", nombre: "Espalda", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Espalda", ancho: anchoPanel(c), alto: c.largo - 5, cantidad: 1 }] },
      {
        id: "entredos",
        nombre: "Entredós",
        sugeridas: SUAVE,
        piezas: (c) => [{ nombre: "Entredós", ancho: 7, alto: c.largo - 12, cantidad: 1, nota: "tira vertical al centro del delantero" }],
      },
      { id: "mangas", nombre: "Mangas", sugeridas: DELICADO, piezas: (c) => mangaRecta(c, 3) },
      { id: "escote", nombre: "Escote", sugeridas: BORDES, piezas: (c) => [{ nombre: "Ribete de escote", ancho: r(40 + (c.m.busto - 88) * 0.1), alto: 2.5, cantidad: 1 }] },
      {
        id: "ruedo",
        nombre: "Ruedo",
        sugeridas: BORDES,
        piezas: (c) => [
          { nombre: "Ruedo", ancho: Math.max(c.m.busto, c.m.cadera) + c.holgura + 6, alto: 4.5, cantidad: 1 },
          ...bordeManga(c, "Borde de manga", 3, 10),
        ],
      },
    ],
    armado: [
      "Cortar delantero (en dos mitades) y espalda en la tela; marcar el centro del delantero.",
      "Tejer el entredós del largo del delantero y coserlo entre las dos mitades, con un pespunte prolijo.",
      "Unir hombros y costados de la tela.",
      "Coser las mangas a la sisa, haciendo coincidir la marca del hombro.",
      "Tejer el ribete sobre el borde del escote: primero una vuelta de punto bajo y después el remate.",
      "Tejer el ruedo y el borde de las mangas, esconder las hebras y planchar la tela sin aplastar el crochet.",
    ],
    inicial: {
      delantero: tela("lino", "#d3e4f3"),
      espalda: tela("lino", "#d3e4f3"),
      entredos: tela("fan_stitch", CRUDO),
      mangas: tela("lino", "#d3e4f3"),
      escote: tela("shell_stitch", CRUDO),
      ruedo: tela("shell_stitch", CRUDO),
    },
  },
  {
    id: "camisa_mangas",
    nombre: "Camisa con mangas desmontables",
    icono: "👔",
    grupo: "cuerpo",
    descripcion: "Camisa de algodón o lino con canesú y tira de unión tejidos; las mangas se prenden en la sisa.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "larga" },
    largoBase: (m) => m.total - 2,
    zonas: [
      {
        id: "delantero",
        nombre: "Delantero",
        sugeridas: CUERPO,
        piezas: (c) => [{ nombre: "Delantero", ancho: anchoPanel(c) + 4, alto: c.largo, cantidad: 1, nota: "en dos mitades, con tapeta de 3 cm y botones" }],
      },
      { id: "espalda", nombre: "Espalda", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Espalda", ancho: anchoPanel(c), alto: c.largo - 7, cantidad: 1 }] },
      {
        id: "cuello",
        nombre: "Cuello",
        sugeridas: ["texturas", "calados"],
        piezas: (c) => [{ nombre: "Cuello", ancho: r(38 + (c.m.busto - 88) * 0.1), alto: 7, cantidad: 1, nota: "pie de 3 cm y solapa de 4 cm" }],
      },
      { id: "canesu", nombre: "Canesú de espalda", sugeridas: DELICADO, piezas: (c) => [{ nombre: "Canesú", ancho: anchoPanel(c) - 2, alto: 9, cantidad: 1 }] },
      { id: "mangas", nombre: "Mangas", sugeridas: CUERPO, piezas: (c) => mangaRecta(c, c.manga > 30 ? 9 : 6) },
      { id: "punos", nombre: "Puños", sugeridas: ELASTICO, piezas: (c) => bordeManga(c, "Puño", c.manga > 30 ? 5.5 : 3, 4) },
      {
        id: "union",
        nombre: "Tira de unión en la sisa",
        sugeridas: ["calados", "texturas", "bordes"],
        piezas: (c) => [{ nombre: "Tira de unión", ancho: contornoSisa(c), alto: 3.5, cantidad: 2, nota: "se cose a la sisa; la manga se prende con botones o broches" }],
      },
    ],
    armado: [
      "Cortar delanteros, espalda, mangas y cuello en la tela; entretelar tapeta y cuello.",
      "Tejer el canesú y coserlo a la espalda; unir hombros.",
      "Coser los costados y armar la tapeta con los ojales.",
      "Tejer la tira de unión sobre el borde de cada sisa: queda como terminación aunque la camisa se use sin mangas.",
      "Armar las mangas con su puño y prenderlas a la tira con botones chicos o broches.",
      "Coser el cuello, hacer el dobladillo y pegar los botones.",
    ],
    inicial: {
      delantero: tela("algodon", CRUDO),
      espalda: tela("algodon", CRUDO),
      cuello: tela("algodon", CRUDO),
      canesu: tela("filet_mesh", "#b9cbb1"),
      mangas: tela("algodon", CRUDO),
      punos: tela("algodon", CRUDO),
      union: tela("v_stitch", "#b9cbb1"),
    },
  },
  {
    id: "campera_jean",
    nombre: "Campera de jean con aplicación",
    icono: "🧥",
    grupo: "cuerpo",
    descripcion: "Campera de denim con canesú y una aplicación tejida en la espalda.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "larga", ajuste: "suelto" },
    largoBase: (m) => m.total - 10,
    zonas: [
      {
        id: "cuerpo",
        nombre: "Cuerpo",
        sugeridas: FIRME,
        piezas: (c) => [
          { nombre: "Espalda", ancho: anchoPanel(c), alto: c.largo - 15, cantidad: 1 },
          { nombre: "Delantero", ancho: r(anchoPanel(c) / 2 + 2), alto: c.largo - 5, cantidad: 2, nota: "con tapeta, botones y bolsillos con tapa" },
        ],
      },
      { id: "mangas", nombre: "Mangas", sugeridas: FIRME, piezas: (c) => mangaRecta(c, 5) },
      { id: "cuello", nombre: "Cuello", sugeridas: FIRME, piezas: (c) => [{ nombre: "Cuello", ancho: r(42 + (c.m.busto - 88) * 0.1), alto: 10, cantidad: 1 }] },
      { id: "canesu", nombre: "Canesú de espalda", sugeridas: DELICADO, piezas: (c) => [{ nombre: "Canesú", ancho: anchoPanel(c), alto: 12, cantidad: 1, nota: "en punta al centro" }] },
      {
        id: "aplicacion",
        nombre: "Aplicación en la espalda",
        sugeridas: ["granny", "motivos_cuadrados", "flores", "motivos"],
        piezas: () => [{ nombre: "Aplicación", ancho: 20, alto: 20, cantidad: 1, nota: "redonda o cuadrada; se cose sobre la espalda" }],
      },
      {
        id: "punos_cintura",
        nombre: "Puños y cintura",
        sugeridas: ELASTICO,
        piezas: (c) => [{ nombre: "Pretina", ancho: r(c.m.cadera + c.holgura + 4), alto: 5, cantidad: 1 }, ...bordeManga(c, "Puño", 5, 8)],
      },
    ],
    armado: [
      "Cortar el denim; si el canesú va tejido, cortar la espalda sin canesú y dejar 1 cm de costura.",
      "Tejer el canesú y coserlo a la espalda con pespunte doble, como las costuras del jean.",
      "Tejer la aplicación, bloquearla y coserla a mano en el centro de la espalda.",
      "Unir hombros y costados; armar la tapeta y los bolsillos del pecho.",
      "Pegar mangas, cuello, puños y pretina.",
      "Hacer los ojales y colocar los botones.",
    ],
    inicial: {
      cuerpo: tela("denim", "#6f93c4"),
      mangas: tela("denim", "#6f93c4"),
      cuello: tela("denim", "#6f93c4"),
      canesu: tela("fan_stitch", CRUDO),
      aplicacion: tela("granny_square", "#f9d9c4"),
      punos_cintura: tela("denim", "#6f93c4"),
    },
  },
  {
    id: "vestido_canesu",
    nombre: "Vestido con canesú de crochet",
    icono: "👗",
    grupo: "cuerpo",
    descripcion: "Vestido de gasa o algodón con canesú tejido, franja bajo el busto y ruedo de crochet.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "corta" },
    largoBase: (m) => m.total + 34,
    zonas: [
      {
        id: "canesu",
        nombre: "Canesú",
        sugeridas: DELICADO,
        piezas: (c) => [{ nombre: "Canesú", ancho: anchoPanel(c), alto: 25, cantidad: 2, nota: "delantero y espalda, del escote hasta debajo del busto" }],
      },
      {
        id: "falda",
        nombre: "Falda",
        sugeridas: CUERPO,
        piezas: (c) => [{ nombre: "Falda", ancho: r(ruedoConVuelo(c.m.busto * 0.86, c.largo - 30, 0.26) / 2), alto: c.largo - 36, cantidad: 2 }],
      },
      { id: "mangas", nombre: "Mangas", sugeridas: DELICADO, piezas: (c) => mangaRecta(c, 0) },
      {
        id: "cintura",
        nombre: "Franja de cintura",
        sugeridas: ["texturas", "calados", "relieve"],
        piezas: (c) => [{ nombre: "Franja de cintura", ancho: r(c.m.busto * 0.86 + c.holgura / 2), alto: 5, cantidad: 1 }],
      },
      {
        id: "ruedo",
        nombre: "Ruedo",
        sugeridas: BORDES,
        piezas: (c) => [{ nombre: "Ruedo", ancho: ruedoConVuelo(c.m.busto * 0.86, c.largo - 30, 0.26), alto: 6, cantidad: 1 }],
      },
    ],
    armado: [
      "Tejer el canesú delantero y el de espalda; unir los hombros.",
      "Tejer la franja de cintura y coserla al borde inferior del canesú.",
      "Cortar la falda en la tela, fruncirla apenas y coserla a la franja.",
      "Coser las mangas a la sisa y cerrar los costados.",
      "Tejer el ruedo sobre el borde de la falda: una vuelta de punto bajo y después el remate.",
      "Esconder las hebras, bloquear el crochet y planchar la tela.",
    ],
    inicial: {
      canesu: tela("staggered_shell_lace", CRUDO),
      falda: tela("gasa", "#f6d5dc"),
      mangas: tela("gasa", "#f6d5dc"),
      cintura: tela("v_stitch", CRUDO),
      ruedo: tela("shell_stitch", CRUDO),
    },
  },
  {
    id: "kimono",
    nombre: "Kimono",
    icono: "🥻",
    grupo: "cuerpo",
    descripcion: "Kimono abierto de gasa o muselina, con solapa y ruedo tejidos.",
    opciones: ["talle", "manga", "largo", "ajuste"],
    defecto: { manga: "tres_cuartos", ajuste: "suelto" },
    largoBase: (m) => m.total + 8,
    zonas: [
      { id: "espalda", nombre: "Espalda", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Espalda", ancho: anchoPanel(c) + 4, alto: c.largo - 5, cantidad: 1 }] },
      { id: "delanteros", nombre: "Delanteros", sugeridas: CUERPO, piezas: (c) => [{ nombre: "Delantero", ancho: r(anchoPanel(c) / 2 - 4), alto: c.largo - 5, cantidad: 2 }] },
      { id: "mangas", nombre: "Mangas anchas", sugeridas: DELICADO, piezas: (c) => mangaRecta(c, 4, c.m.busto * 0.45 + c.holgura) },
      {
        id: "solapa",
        nombre: "Solapa",
        sugeridas: SUAVE,
        piezas: (c) => [
          { nombre: "Solapa", ancho: 4.5, alto: r(c.largo * 2 + 20), cantidad: 1, nota: "una tira continua: sube por un delantero, rodea el cuello y baja por el otro" },
        ],
      },
      {
        id: "ruedo",
        nombre: "Ruedo",
        sugeridas: BORDES,
        piezas: (c) => [
          { nombre: "Ruedo", ancho: r(c.m.cadera + c.holgura + 10), alto: 5, cantidad: 1 },
          ...(c.manga > 0 ? [{ nombre: "Borde de manga", ancho: r(c.m.busto * 0.75), alto: 4, cantidad: 2 }] : []),
        ],
      },
    ],
    armado: [
      "Cortar espalda, delanteros y mangas en la tela; las mangas van rectas y anchas.",
      "Unir hombros, pegar las mangas y cerrar costados y mangas en una sola costura.",
      "Tejer el ruedo sobre el borde inferior y el de las mangas.",
      "Tejer la solapa en una tira continua y coserla desde el ruedo de un delantero, alrededor del cuello, hasta el otro.",
      "Esconder las hebras y planchar la tela al vapor, sin apoyar sobre el crochet.",
    ],
    inicial: {
      espalda: tela("gasa", "#b9cbb1"),
      delanteros: tela("gasa", "#b9cbb1"),
      mangas: tela("gasa", "#b9cbb1"),
      solapa: tela("chain_arc_mesh", CRUDO),
      ruedo: tela("picot_fans", CRUDO),
    },
  },
  {
    id: "falda_franja",
    nombre: "Falda semicampana con franja",
    icono: "💃",
    grupo: "abajo",
    descripcion: "Falda de lino o denim con una franja de crochet que la cruza en diagonal.",
    opciones: ["talle", "largo", "ajuste"],
    largoBase: () => 58,
    zonas: [
      {
        id: "pretina",
        nombre: "Pretina",
        sugeridas: ELASTICO,
        piezas: (c) => [{ nombre: "Pretina", ancho: r(cintura(c.m) + 3), alto: 4, cantidad: 1, nota: "con botón o elástico" }],
      },
      {
        id: "paneles",
        nombre: "Paneles",
        sugeridas: CUERPO,
        piezas: (c) => [{ nombre: "Panel", ancho: r(ruedoConVuelo(cintura(c.m), c.largo, 0.36) / 2), alto: c.largo - 10, cantidad: 2, nota: "delantero y trasero" }],
      },
      {
        id: "franja",
        nombre: "Franja",
        sugeridas: SUAVE,
        piezas: (c) => [
          {
            nombre: "Franja",
            ancho: 9,
            alto: r(Math.hypot((0.75 * (cintura(c.m) + ruedoConVuelo(cintura(c.m), c.largo, 0.36))) / 2, c.largo - 10)),
            cantidad: 1,
            nota: "se cose en diagonal sobre los paneles",
          },
        ],
      },
      { id: "ruedo", nombre: "Ruedo", sugeridas: BORDES, piezas: (c) => [{ nombre: "Ruedo", ancho: ruedoConVuelo(cintura(c.m), c.largo, 0.36), alto: 6, cantidad: 1 }] },
    ],
    armado: [
      "Cortar los dos paneles en la tela y unir un costado.",
      "Tejer la franja, bloquearla y coserla en diagonal: nace en la pretina de un lado y termina en el ruedo del otro.",
      "Cerrar el otro costado dejando la abertura para el cierre o el botón.",
      "Pegar la pretina.",
      "Tejer el ruedo sobre el borde de la tela y esconder las hebras.",
    ],
    inicial: {
      pretina: tela("lino", "#c98b6b"),
      paneles: tela("lino", "#c98b6b"),
      franja: tela("fan_stitch", CRUDO),
      ruedo: tela("shell_stitch", CRUDO),
    },
  },
];

export const PRENDAS: Prenda[] = [...NUEVAS];

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

/** Textura que se dibuja en el modelo (y en la miniatura del selector) para cada punto. */
const TEXTURA_DIRECTA: Record<string, string> = {
  single_crochet: "bajo",
  half_double_crochet: "bajo",
  double_crochet: "vareta",
  treble_crochet: "vareta",
  corner_to_corner: "vareta",
  linked_double_crochet: "vareta",
  granny_stitch: "granny_filas",
  granny_square: "granny",
  granny_square_flower: "granny",
  multicolor_granny_square: "granny",
  v_stitch: "uves",
  chained_v_stitch: "uves",
  v_stitch_dc_blocks: "uves",
  v_mesh_with_sc_crowns: "uves",
  woven_dc_mesh: "filete",
};

export function texturaDePunto(p: Punto) {
  const id = p.id;
  if (TEXTURA_DIRECTA[id]) return TEXTURA_DIRECTA[id];
  const lazo = ["calados", "bordes", "texturas", "relieve"].includes(p.category);
  if (lazo && /shell/.test(id)) return "concha";
  if (lazo && /fan|scallop/.test(id)) return "abanico";
  if (p.category === "calados") {
    if (/filet|checkerboard|aligned_blocks/.test(id)) return /block|checker|polka|aligned/.test(id) ? "filete_bloques" : "filete";
    if (/mesh|net|arch|lattice|solomon|bridges|ladder/.test(id)) return "red";
  }
  const porCategoria: Record<string, string> = {
    calados: "red",
    racimos: "motas",
    especiales: "motas",
    relieve: "relieve",
    bordes: "concha",
    motivos: "granny",
    motivos_cuadrados: "granny",
    granny: "granny",
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
