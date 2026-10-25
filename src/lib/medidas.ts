import guia from "@/data/guia-revista.json";

/** Medidas de mujer por talle, de la «Tabla de medidas» de las revistas (en cm). */
export interface Medidas {
  talle: number;
  busto: number;
  cadera: number;
  /** Distancia de la cintura a la línea de cadera */
  posCadera: number;
  /** Profundidad de la sisa */
  sisa: number;
  puno: number;
  manga: number;
  total: number;
}

export const TALLES: Medidas[] = guia.tablaMedidas.filas.map((f) => ({
  talle: f[0],
  busto: f[1],
  cadera: f[2],
  posCadera: f[3],
  sisa: f[4],
  puno: f[5],
  manga: f[6],
  total: f[7],
}));

export function medidasTalle(talle: number): Medidas {
  return TALLES.find((t) => t.talle === talle) ?? TALLES[2];
}

/** Cintura estimada: la tabla de la revista no la trae. */
export function cintura(m: Medidas) {
  return Math.round(m.busto * 0.78);
}
