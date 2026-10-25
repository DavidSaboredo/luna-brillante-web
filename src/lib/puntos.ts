import base from "@/data/puntos.json";
import { renderPunto3D } from "./modelos3d";
import { imagenMejorada } from "@/lib/imagenes";

type Texto = { es: string; en: string };
type Lista = { es: string[]; en: string[] };

export interface ImagenPunto {
  type: "photo" | "symbol" | "illustration";
  url: string;
  thumbnail_url: string;
  source_page: string;
  source: string;
  author: string | null;
  license: string | null;
  license_status: string;
  caption: Texto;
}

export interface Punto {
  id: string;
  name: Texto;
  aka: Lista;
  abbreviation: { es: string; us: string; uk: string };
  category: string;
  difficulty: number;
  difficulty_label: Texto;
  worked_in: "rows" | "rounds" | "n/a";
  repeat: { multiple: number; plus: number; note: Texto } | null;
  description: Texto;
  steps: Lista;
  tips: Lista;
  uses: Lista;
  tags: string[];
  prerequisites: string[];
  related: string[];
  diagram: { file: string; style: string };
  illustration?: { webp: string; width: number; height: number; alt: Texto };
  images: ImagenPunto[];
}

export interface Categoria {
  id: string;
  name: Texto;
}

export const puntos = base.stitches as Punto[];
export const categorias = base.categories as Categoria[];
export const niveles = base.difficulty_levels.map((n) => ({ nivel: n.level, nombre: n.name.es }));

export function buscarPunto(id: string) {
  return puntos.find((p) => p.id === id);
}

export function nombreCategoria(id: string) {
  return categorias.find((c) => c.id === id)?.name.es ?? id;
}

/** Ruta pública del diagrama SVG (los archivos están en public/diagramas). */
export function rutaDiagrama(p: Punto) {
  return `/diagramas/${p.diagram.file.split("/").pop()}`;
}

/** Imagen del punto: el modelado 3D hecho en Blender (public/puntos3d); si todavía no existe, la ilustración anterior. */
export function rutaIlustracion(p: Punto) {
  return renderPunto3D(p.id) ?? (p.illustration ? imagenMejorada(`/ilustraciones/${p.illustration.webp.split("/").pop()}`) : null);
}

export function textoRepeticion(p: Punto) {
  if (!p.repeat) return null;
  return p.repeat.plus ? `Múltiplo de ${p.repeat.multiple} + ${p.repeat.plus}` : `Múltiplo de ${p.repeat.multiple}`;
}

export const SE_TEJE: Record<Punto["worked_in"], string> = {
  rows: "En filas",
  rounds: "En redondo",
  "n/a": "—",
};

/** Color pastel de fondo según la categoría. */
const COLOR_CATEGORIA: Record<string, string> = {
  fundamentos: "bg-manteca",
  tecnicas: "bg-cielo",
  aumentos_disminuciones: "bg-cielo",
  variaciones_lazada: "bg-menta",
  relieve: "bg-lavanda",
  texturas: "bg-menta",
  racimos: "bg-rosa",
  calados: "bg-lavanda",
  motivos: "bg-rosa",
  bordes: "bg-manteca",
  especiales: "bg-rosa",
  tunecino: "bg-cielo",
  motivos_cuadrados: "bg-menta",
  flores: "bg-rosa",
};

export function fondoCategoria(id: string) {
  return COLOR_CATEGORIA[id] ?? "bg-lavanda";
}

const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Busca por nombre (es/en), otros nombres, abreviaturas y etiquetas. */
export function coincide(p: Punto, consulta: string) {
  const q = normalizar(consulta.trim());
  if (!q) return true;
  const texto = [
    p.name.es,
    p.name.en,
    ...p.aka.es,
    ...p.aka.en,
    p.abbreviation.es,
    p.abbreviation.us,
    ...p.tags,
  ].join(" ");
  return normalizar(texto).includes(q);
}

/** Técnicas e instrucciones de forma que no son un "tejido" para cubrir una zona de prenda. */
const NO_APTOS_PRENDA = new Set([
  "slip_knot",
  "magic_ring",
  "chain",
  "slip_stitch",
  "foundation_single_crochet",
  "foundation_double_crochet",
  "spiral_rounds",
  "crochet_cord",
  "double_treble_crochet",
  "triple_treble_crochet",
]);

export const puntosParaPrenda = puntos.filter(
  (p) => p.category !== "aumentos_disminuciones" && !NO_APTOS_PRENDA.has(p.id),
);

/**
 * Calcula la cadena base para un ancho dado, respetando el múltiplo del punto.
 * `puntosEn10cm` sale de la muestra tejida en ese punto.
 */
export function calcularCadenaBase(p: Punto, anchoCm: number, puntosEn10cm: number) {
  if (!p.repeat || anchoCm <= 0 || puntosEn10cm <= 0) return null;
  const { multiple, plus } = p.repeat;
  const necesarios = (anchoCm * puntosEn10cm) / 10;
  const repeticiones = Math.max(1, Math.round((necesarios - plus) / multiple));
  const cadenas = repeticiones * multiple + plus;
  return { cadenas, repeticiones, anchoReal: (cadenas * 10) / puntosEn10cm };
}
