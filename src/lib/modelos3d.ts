import ids from "@/data/puntos3d.json";

const disponibles = new Set(ids as string[]);

/** Render del punto modelado en 3D con Blender (public/puntos3d), o null si todavía no existe. */
export function renderPunto3D(id: string): string | null {
  return disponibles.has(id) ? `/puntos3d/${id}.webp` : null;
}
