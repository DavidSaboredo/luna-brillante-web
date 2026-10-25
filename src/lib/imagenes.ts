import versiones from "@/data/imagenes-mejoradas.json";

const imagenes = versiones as Record<string, string>;

/** Usa la edición local cuando existe; conserva la ruta de nuevos originales. */
export function imagenMejorada(original: string): string {
  return imagenes[original] ?? original;
}
