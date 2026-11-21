"use client";

import { useIdioma } from "./Idioma";
import { revistasVenta } from "@/lib/catalogo";

/** Página de revistas: cada una con su tapa, qué contiene y el botón de compra en Hotmart. */
export default function RevistasVenta() {
  const { idioma, t } = useIdioma();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">{t.revista.todas}</h1>
        <p className="mt-1 max-w-2xl text-tinta-suave">{t.revista.todasTexto}</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {revistasVenta.map((r) => {
          const titulo = r.titulo[idioma];
          return (
            <article key={r.comprar} className="tarjeta flex flex-col overflow-hidden">
              {/* Las tapas tienen formatos distintos: se ven enteras sobre un fondo difuminado de la misma imagen. */}
              <div className="relative aspect-[4/5] overflow-hidden bg-crema">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.portada} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.portada} alt={titulo} loading="lazy" className="relative h-full w-full object-contain" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h2 className="text-2xl leading-tight">{titulo}</h2>
                <p className="text-base leading-snug text-tinta-suave">{r.detalle[idioma]}</p>
                <a
                  href={r.comprar}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.revista.comprar}: ${titulo}`}
                  className="mt-auto rounded-full bg-lavanda-fuerte px-4 py-3 text-center text-base font-semibold text-white transition hover:brightness-110"
                >
                  {t.revista.comprar} {"↗︎"}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
