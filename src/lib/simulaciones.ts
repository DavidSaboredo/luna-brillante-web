import indice from "@/data/simulaciones.json";
import { PRENDAS, opcionesPara, type Opciones } from "./taller";

const disponibles = indice as Record<string, number[]>;

/**
 * Ruta del archivo con la tela ya simulada en Blender, o null si no existe para esta prenda, talle y opciones.
 * La simulación se hizo con las opciones por defecto de cada prenda (mangas, largo y calce); si el usuario las cambia,
 * se vuelve a la forma aproximada.
 */
export function rutaSimulacion(prendaId: string, o: Opciones): string | null {
  const prenda = PRENDAS.find((p) => p.id === prendaId);
  const talles = disponibles[prendaId];
  if (!prenda || !talles?.includes(o.talle)) return null;
  const base = opcionesPara(prenda, { talle: o.talle });
  if (base.manga !== o.manga || base.largo !== o.largo || base.ajuste !== o.ajuste) return null;
  return `/modelos/prendas/${prendaId}_${o.talle}.glb`;
}

/** ¿Hay simulación de esta prenda en algún talle? (para mostrar el botón) */
export function tieneSimulacion(prendaId: string): boolean {
  return (disponibles[prendaId]?.length ?? 0) > 0;
}
