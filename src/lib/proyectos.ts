import datos from "@/data/proyectos.json";
import { imagenMejorada } from "@/lib/imagenes";

export interface PuntoUsado {
  texto: string;
  punto: string | null;
}

export interface Proyecto {
  id: string;
  numero: number;
  pagina: number;
  titulo: string;
  lema: string;
  nivel: string;
  nivelNum: number;
  categoria: string;
  talles: string[];
  descripcion: string;
  portada: string;
  imagenes: { src: string; alt: string; pie: string }[];
  materiales: string[];
  puntosUsados: PuntoUsado[];
  medidas: string[];
  explicacion: string[];
  puntoFantasia: { titulo: string; texto: string; filas: { t: string; r: string }[]; aviso?: string };
  flores?: { titulo: string; pasos: string[] }[];
  terminaciones: string[];
  consejos: string[];
}

export const fuenteRevista = datos.meta.fuente;
export const notaRevista = datos.meta.nota;
export const proyectos = (datos.proyectos as Proyecto[]).map((proyecto) => ({
  ...proyecto,
  portada: imagenMejorada(proyecto.portada),
  imagenes: proyecto.imagenes.map((imagen) => ({ ...imagen, src: imagenMejorada(imagen.src) })),
}));
export const guia = datos.guia as {
  leerDiagrama: string[];
  simbolos: { simbolo: string; nombre: string; abreviatura: string; punto: string }[];
  consejos: { titulo: string; texto: string }[];
  cuidado: string[];
};

export function buscarProyecto(id: string) {
  return proyectos.find((p) => p.id === id);
}

/** Proyectos de la revista donde aparece un punto de la biblioteca. */
export function proyectosConPunto(idPunto: string) {
  return proyectos.filter((p) => p.puntosUsados.some((u) => u.punto === idPunto));
}
