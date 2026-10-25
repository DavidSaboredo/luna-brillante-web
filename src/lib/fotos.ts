import datos from "@/data/fotos.json";
import { imagenMejorada } from "@/lib/imagenes";

export interface FotoReal {
  archivo: string;
  leyenda: string;
  autor: string;
  licencia: string;
  urlLicencia: string | null;
  pagina: string;
  original?: string;
  tipo?: "foto" | "diagrama";
}

const fotos = datos as Record<string, FotoReal[]>;

/** Fotos reales (Wikimedia Commons, descargadas a public/fotos) de un punto. */
export function fotosReales(id: string): FotoReal[] {
  return (fotos[id] ?? []).map((foto) => ({
    ...foto,
    original: foto.archivo,
    archivo: imagenMejorada(foto.archivo),
    tipo: foto.archivo.endsWith("-2.webp") ? "diagrama" : "foto",
  }));
}

export function fotoPrincipal(id: string): FotoReal | null {
  return fotosReales(id)[0] ?? null;
}
