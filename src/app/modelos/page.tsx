"use client";

import { useEffect, useState } from "react";
import { useIdioma } from "@/components/Idioma";
import { MODELOS } from "@/lib/modelos";

const CATS = ["puntos", "squares", "puntillas", "filet", "mandalas-y-carpetas", "otros-motivos-y-prendas"] as const;

const T = {
  es: {
    titulo: "Modelos y diagramas",
    sub: "Muestras tejidas y diagramas de referencia para inspirarte. Tocá una imagen para verla en grande.",
    cerrar: "Cerrar",
    cats: { puntos: "Puntos", squares: "Cuadrados", puntillas: "Puntillas", filet: "Filet", "mandalas-y-carpetas": "Mandalas y carpetas", "otros-motivos-y-prendas": "Otros motivos" },
  },
  en: {
    titulo: "Models and charts",
    sub: "Worked swatches and reference charts to inspire you. Tap an image to see it larger.",
    cerrar: "Close",
    cats: { puntos: "Stitches", squares: "Squares", puntillas: "Edgings", filet: "Filet", "mandalas-y-carpetas": "Mandalas and doilies", "otros-motivos-y-prendas": "Other motifs" },
  },
  pt: {
    titulo: "Modelos e gráficos",
    sub: "Amostras tecidas e gráficos de referência para se inspirar. Toque numa imagem para ver maior.",
    cerrar: "Fechar",
    cats: { puntos: "Pontos", squares: "Quadrados", puntillas: "Bicos", filet: "Filé", "mandalas-y-carpetas": "Mandalas e toalhinhas", "otros-motivos-y-prendas": "Outros motivos" },
  },
} as const;

export default function Modelos() {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const [cat, setCat] = useState<(typeof CATS)[number]>("puntos");
  const [abierta, setAbierta] = useState<string | null>(null);
  const lista = MODELOS[cat];

  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(null);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierta]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">{t.titulo}</h1>
        <p className="mt-1 max-w-2xl text-tinta-suave">{t.sub}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        {CATS.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`rounded-full px-4 py-2.5 text-base transition ${cat === c ? "bg-lavanda text-tinta" : "bg-papel text-tinta-suave hover:bg-lavanda/50"}`}
          >
            {t.cats[c]} <span className="opacity-60">({MODELOS[c].length})</span>
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {lista.map((m) => {
          const src = `/modelos/${cat}/${m.archivo}`;
          return (
            <li key={m.archivo}>
              <button onClick={() => setAbierta(src)} className="block w-full overflow-hidden rounded-2xl border border-borde bg-white text-left transition hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={m.titulo} loading="lazy" className="aspect-square w-full object-contain" />
                <span className="block px-3 py-2 text-base">{m.titulo}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {abierta && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setAbierta(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-base" onClick={() => setAbierta(null)}>
            {t.cerrar} ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={abierta} alt="" className="max-h-full max-w-full rounded-xl bg-white object-contain" />
        </div>
      )}
    </div>
  );
}
