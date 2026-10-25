import fotos from "@/data/fotos-revista.json";
import guia from "@/data/guia-revista.json";
import { imagenMejorada } from "@/lib/imagenes";

export interface PasoRevista {
  src: string;
  tipo: "foto" | "esquema";
  titulo: string;
  pasos: string[];
  extra?: string;
}

const porPunto = fotos as Record<string, PasoRevista>;

/** Fotos o esquemas paso a paso tomados de las revistas, por punto de la biblioteca. */
export function pasosRevista(idPunto: string): PasoRevista | null {
  const paso = porPunto[idPunto];
  return paso ? { ...paso, src: imagenMejorada(paso.src) } : null;
}

export const guiaRevista = guia;

/** Cómo llaman las tejedoras al punto (medio punto, vareta…). */
export function equivalenciaRevista(idPunto: string) {
  return guia.equivalencias.find((e) => e.punto === idPunto) ?? null;
}
