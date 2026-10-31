"use client";

import { textosPaginas, type ClavePagina } from "@/lib/textos-paginas";
import { useIdioma } from "./Idioma";

/** Hook para textos fijos de páginas que se arman en el servidor. */
export function useTexto() {
  const { idioma } = useIdioma();
  return (k: ClavePagina, c?: string) => textosPaginas[idioma][k].replace("{c}", c ?? "");
}

/** Texto fijo traducido, para usar dentro de páginas del servidor. */
export default function Tx({ k, c }: { k: ClavePagina; c?: string }) {
  return <>{useTexto()(k, c)}</>;
}

/** Imagen cuyo texto alternativo se traduce. */
export function ImgTx({ src, k, className }: { src: string; k: ClavePagina; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={useTexto()(k)} loading="lazy" className={className} />;
}
