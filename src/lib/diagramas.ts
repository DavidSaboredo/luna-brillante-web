import type { Idioma } from "@/lib/textos";

// Diagramas que pasó la tejedora de Luna Brillante. Los que no tienen nombre propio van numerados.
export type Grupo = "fantasia" | "puntilla" | "motivo" | "esquema";

export interface Diagrama {
  archivo: string;
  nombre: Record<Idioma, string>;
}

const numerado = (archivo: string, es: string, en: string, pt: string, n: number): Diagrama => ({
  archivo: `/diagramas/${archivo}.webp`,
  nombre: { es: `${es} ${n}`, en: `${en} ${n}`, pt: `${pt} ${n}` },
});

const fijo = (archivo: string, es: string, en: string, pt: string): Diagrama => ({
  archivo: `/diagramas/${archivo}.webp`,
  nombre: { es, en, pt },
});

const serie = (cuantos: number, prefijo: string, es: string, en: string, pt: string): Diagrama[] =>
  Array.from({ length: cuantos }, (_, i) =>
    numerado(`${prefijo}-${String(i + 1).padStart(2, "0")}`, es, en, pt, i + 1),
  );

export const diagramas: Record<Grupo, Diagrama[]> = {
  fantasia: serie(25, "fantasia", "Punto fantasía", "Fantasy stitch", "Ponto fantasia"),
  puntilla: [
    ...serie(9, "puntilla", "Puntilla", "Lace edging", "Bico"),
    ...[10, 11, 12].map((n) => numerado(`puntilla-${n}`, "Puntilla", "Lace edging", "Bico", n)),
  ],
  motivo: [
    numerado("motivo-1", "Motivo", "Motif", "Motivo", 1),
    numerado("motivo-2", "Motivo", "Motif", "Motivo", 2),
    fijo("flor-6-petalos", "Flor de 6 pétalos", "Six-petal flower", "Flor de 6 pétalas"),
    numerado("motivo-3", "Motivo", "Motif", "Motivo", 3),
    numerado("motivo-4", "Motivo", "Motif", "Motivo", 4),
    numerado("motivo-5", "Motivo", "Motif", "Motivo", 5),
  ],
  esquema: [
    fijo("esquema-1", "Espalda", "Back", "Costas"),
    fijo("esquema-2", "Manga", "Sleeve", "Manga"),
    fijo("esquema-3", "Media delantera", "Half front", "Meia frente"),
    fijo("esquema-4", "Vestido de nena, talle 3", "Girl's dress, size 3", "Vestido de menina, tamanho 3"),
    fijo("esquema-5", "Chaleco de niño, talle 3", "Boy's vest, size 3", "Colete de menino, tamanho 3"),
  ],
};

/** Diagramas de fantasía ya ubicados en la ficha de su punto (id de punto -> número de diagrama). */
const porPunto: Record<string, number> = {
  filet_with_fan_rows: 3,
  crossed_dc_grid: 4,
  crossed_dc_arch_mesh: 6,
  dc_triangles: 7,
  crossed_dc_bands: 8,
  fan_diamonds_dc: 9,
  fan_v_columns: 10,
  chained_v_stitch: 11,
  braided_crossed_dc: 12,
  long_leaf_stitch: 14,
  butterfly_filet: 15,
  big_fan_arch_lace: 16,
  wheel_filet: 17,
  diagonal_cross_relief: 18,
  fans_on_dc: 20,
  spring_filet: 21,
  arch_dc_garbanzo_lace: 22,
  slanted_dc_diamonds: 23,
  solomon_net: 24,
  solomon_dc_bands: 25,
};

export const diagramaDeRevista = (id: string): Diagrama | undefined => {
  const n = porPunto[id];
  return n ? diagramas.fantasia[n - 1] : undefined;
};

const ubicados = new Set(Object.values(porPunto));
/** Diagramas de fantasía que todavía no tienen punto propio en la biblioteca. */
export const fantasiaSinPunto: Diagrama[] = diagramas.fantasia.filter((_, i) => !ubicados.has(i + 1));

export const textosDiagramas = {
  es: {
    titulo: "Diagramas de Monica",
    sub: "Puntos fantasía, puntillas, motivos y esquemas de prendas de Luna Brillante. Tocá un diagrama para verlo grande.",
    volver: "← Volver a puntos",
    deRevista: "Diagrama de la revista (pasado por Monica)",
    enlace: "📐 Diagramas de Monica →",
    grupos: { fantasia: "Puntos fantasía", puntilla: "Puntillas", motivo: "Motivos", esquema: "Esquemas de prendas" } as Record<Grupo, string>,
  },
  en: {
    titulo: "Monica's charts",
    sub: "Fancy stitches, lace edgings, motifs and garment schematics from Luna Brillante. Tap a chart to see it larger.",
    volver: "← Back to stitches",
    deRevista: "Chart from the magazine (shared by Monica)",
    enlace: "📐 Monica's charts →",
    grupos: { fantasia: "Fancy stitches", puntilla: "Lace edgings", motivo: "Motifs", esquema: "Garment schematics" } as Record<Grupo, string>,
  },
  pt: {
    titulo: "Diagramas da Monica",
    sub: "Pontos fantasia, bicos, motivos e esquemas de peças da Luna Brillante. Toque em um diagrama para ver maior.",
    volver: "← Voltar aos pontos",
    deRevista: "Diagrama da revista (enviado pela Monica)",
    enlace: "📐 Diagramas da Monica →",
    grupos: { fantasia: "Pontos fantasia", puntilla: "Bicos", motivo: "Motivos", esquema: "Esquemas de peças" } as Record<Grupo, string>,
  },
};
