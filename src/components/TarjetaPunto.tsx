"use client";

import Link from "next/link";
import { fondoCategoria, nombreCategoria, rutaDiagrama, rutaIlustracion, tx, type Punto } from "@/lib/puntos";
import { textosPuntos } from "@/lib/textos-puntos";
import { useIdioma } from "./Idioma";

export function Nivel({ nivel }: { nivel: number }) {
  const { idioma } = useIdioma();
  return (
    <span className="inline-flex gap-0.5" aria-label={textosPuntos[idioma].puntos.nivel(nivel)}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= nivel ? "bg-lavanda-fuerte" : "bg-borde"}`} />
      ))}
    </span>
  );
}

export default function TarjetaPunto({ punto }: { punto: Punto }) {
  const { idioma } = useIdioma();
  const nombre = tx(punto.name, idioma);
  const ilustracion = rutaIlustracion(punto);
  const portada = ilustracion;
  return (
    <Link href={`/puntos/${punto.id}`} className="tarjeta group block overflow-hidden transition hover:-translate-y-0.5">
      {portada ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-crema">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portada}
            alt={`${nombre}: 3D`}
            loading="lazy"
            className="h-full w-full object-contain p-1 transition duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className={`flex aspect-[4/3] items-center justify-center p-3 ${fondoCategoria(punto.category)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rutaDiagrama(punto)}
            alt={nombre}
            loading="lazy"
            className="max-h-full max-w-full rounded-lg bg-papel/80 p-1.5"
          />
        </div>
      )}
      <div className="space-y-1 p-4">
        <p className="text-xs text-tinta-suave">{nombreCategoria(punto.category, idioma)}</p>
        <h3 className="text-xl leading-tight">{nombre}</h3>
        <div className="flex items-center gap-2 pt-1 text-xs text-tinta-suave">
          <Nivel nivel={punto.difficulty} />
          {tx(punto.difficulty_label, idioma)}
        </div>
      </div>
    </Link>
  );
}
