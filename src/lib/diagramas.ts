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

export const textosDiagramas = {
  es: {
    titulo: "Diagramas de Monica",
    sub: "Puntos fantasía, puntillas, motivos y esquemas de prendas de Luna Brillante. Tocá un diagrama para verlo grande.",
    volver: "← Volver a puntos",
    enlace: "📐 Diagramas de Monica →",
    grupos: { fantasia: "Puntos fantasía", puntilla: "Puntillas", motivo: "Motivos", esquema: "Esquemas de prendas" } as Record<Grupo, string>,
  },
  en: {
    titulo: "Monica's charts",
    sub: "Fancy stitches, lace edgings, motifs and garment schematics from Luna Brillante. Tap a chart to see it larger.",
    volver: "← Back to stitches",
    enlace: "📐 Monica's charts →",
    grupos: { fantasia: "Fancy stitches", puntilla: "Lace edgings", motivo: "Motifs", esquema: "Garment schematics" } as Record<Grupo, string>,
  },
  pt: {
    titulo: "Diagramas da Monica",
    sub: "Pontos fantasia, bicos, motivos e esquemas de peças da Luna Brillante. Toque em um diagrama para ver maior.",
    volver: "← Voltar aos pontos",
    enlace: "📐 Diagramas da Monica →",
    grupos: { fantasia: "Pontos fantasia", puntilla: "Bicos", motivo: "Motivos", esquema: "Esquemas de peças" } as Record<Grupo, string>,
  },
};
