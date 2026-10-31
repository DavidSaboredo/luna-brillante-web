"use client";

import { useIdioma } from "./Idioma";
import { revistasVenta } from "@/lib/catalogo";

export default function RevistasVenta() {
  const { idioma, t } = useIdioma();
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-3xl">{t.revista.todas}</h2>
        <p className="max-w-2xl text-tinta-suave">{t.revista.todasTexto}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {revistasVenta.map((r) => (
          <div key={r.comprar} className="tarjeta flex flex-col overflow-hidden">
            {r.portada && (
              <div className="aspect-[4/5] overflow-hidden bg-crema">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.portada} alt={r.titulo[idioma]} loading="lazy" className="h-full w-full object-cover object-top" />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <h3 className="text-xl leading-tight">{r.titulo[idioma]}</h3>
                <p className="text-sm text-tinta-suave">{r.detalle[idioma]}</p>
              </div>
              <a
                href={r.comprar}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto rounded-full bg-lavanda-fuerte px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                {t.revista.comprar}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
