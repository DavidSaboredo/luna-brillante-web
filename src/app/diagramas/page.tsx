"use client";

import Link from "next/link";
import { useIdioma } from "@/components/Idioma";
import { diagramas, textosDiagramas, type Grupo } from "@/lib/diagramas";

const ORDEN: Grupo[] = ["puntilla", "fantasia", "motivo", "esquema"];

export default function PaginaDiagramas() {
  const { idioma } = useIdioma();
  const k = textosDiagramas[idioma];

  return (
    <div className="space-y-8">
      <Link href="/puntos" className="text-sm text-tinta-suave hover:text-tinta">
        {k.volver}
      </Link>
      <header>
        <h1 className="text-4xl">{k.titulo}</h1>
        <p className="max-w-2xl text-tinta-suave">{k.sub}</p>
      </header>

      {ORDEN.map((g) => (
        <section key={g} className="space-y-3">
          <h2 className="text-2xl">{k.grupos[g]}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {diagramas[g].map((d) => (
              <figure key={d.archivo} className="tarjeta overflow-hidden">
                <a href={d.archivo} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.archivo} alt={d.nombre[idioma]} loading="lazy" className="h-56 w-full bg-papel object-contain" />
                </a>
                <figcaption className="px-3 py-2 text-sm">{d.nombre[idioma]}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
