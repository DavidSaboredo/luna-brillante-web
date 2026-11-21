import datos from "@/data/proyectos.json";

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

// Los diseños de Moda Crochet N.º 1 ya no se publican en la app (la revista se vende en Hotmart):
// estos datos solo indican en qué diseño se usa cada punto y alimentan la guía de símbolos.
const proyectos = datos.proyectos as Proyecto[];
export const guia = datos.guia as {
  leerDiagrama: string[];
  simbolos: { simbolo: string; nombre: string; abreviatura: string; punto: string }[];
  consejos: { titulo: string; texto: string }[];
  cuidado: string[];
};

/** Proyectos de la revista donde aparece un punto de la biblioteca. */
export function proyectosConPunto(idPunto: string) {
  return proyectos.filter((p) => p.puntosUsados.some((u) => u.punto === idPunto));
}
