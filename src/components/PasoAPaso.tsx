"use client";

import { abreviaturasEn, pasoAPaso } from "@/lib/vueltas";
import { txLista, type Punto } from "@/lib/puntos";
import { textosPuntos } from "@/lib/textos-puntos";
import { useIdioma } from "./Idioma";

export default function PasoAPaso({ punto }: { punto: Punto }) {
  const { idioma } = useIdioma();
  const k = textosPuntos[idioma].paso;
  const { intro, vueltas, origen } = pasoAPaso(punto);
  const ingles = idioma === "en";
  const glosario = ingles ? [] : abreviaturasEn(vueltas.map((v) => v.receta).join(" · "));
  const tips = txLista(punto.tips, idioma);

  return (
    <section className="tarjeta p-5">
      <h2 className="text-2xl">{k.titulo}</h2>

      {ingles ? (
        <ol className="mt-4 space-y-4">
          {punto.steps.en.map((paso, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-borde bg-crema/40 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavanda text-sm">{i + 1}</span>
              <span className="pt-0.5">{paso}</span>
            </li>
          ))}
        </ol>
      ) : (
        <>
          {intro && <p className="mt-2 text-tinta-suave">{intro}</p>}
          <ol className="mt-4 space-y-4">
            {vueltas.map((v, i) => (
              <li key={i} className="rounded-2xl border border-borde bg-crema/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavanda text-sm">
                    {i + 1}
                  </span>
                  <h3 className="text-lg leading-tight">{v.titulo}</h3>
                </div>

                <p className="mt-3 rounded-xl bg-papel px-3 py-2 font-mono text-sm leading-relaxed">{v.receta}</p>
                <p className="mt-2">
                  <span className="text-xs uppercase tracking-wide text-tinta-suave">{k.enPalabras}</span>
                  {v.explicacion}
                </p>
                {v.resultado && (
                  <p className="mt-2 text-sm text-lavanda-fuerte">
                    <span aria-hidden>✓ </span>
                    {k.alTerminar} {v.resultado}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {tips.length > 0 && (
        <div className="mt-4 rounded-xl bg-manteca/60 p-3 text-sm">
          {tips.map((t) => (
            <p key={t}>💡 {t}</p>
          ))}
        </div>
      )}

      {glosario.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-tinta-suave">{k.abreviaturas}</summary>
          <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {glosario.map((g) => (
              <div key={g.abbr} className="flex gap-2">
                <dt className="w-20 shrink-0 font-mono">{g.abbr}</dt>
                <dd>{g.singular}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {!ingles && origen === "traducido" && <p className="mt-4 text-xs text-tinta-suave">{k.nota}</p>}
    </section>
  );
}
