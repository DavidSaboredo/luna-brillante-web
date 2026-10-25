import { abreviaturasEn, pasoAPaso } from "@/lib/vueltas";
import type { Punto } from "@/lib/puntos";

export default function PasoAPaso({ punto }: { punto: Punto }) {
  const { intro, vueltas, origen } = pasoAPaso(punto);
  const glosario = abreviaturasEn(vueltas.map((v) => v.receta).join(" · "));

  return (
    <section className="tarjeta p-5">
      <h2 className="text-2xl">Paso a paso, vuelta por vuelta</h2>
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
              <span className="text-xs uppercase tracking-wide text-tinta-suave">En palabras · </span>
              {v.explicacion}
            </p>
            {v.resultado && (
              <p className="mt-2 text-sm text-lavanda-fuerte">
                <span aria-hidden>✓ </span>
                Al terminar: {v.resultado}
              </p>
            )}
          </li>
        ))}
      </ol>

      {punto.tips.es.length > 0 && (
        <div className="mt-4 rounded-xl bg-manteca/60 p-3 text-sm">
          {punto.tips.es.map((t) => (
            <p key={t}>💡 {t}</p>
          ))}
        </div>
      )}

      {glosario.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-tinta-suave">Abreviaturas que se usan acá</summary>
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

      {origen === "traducido" && (
        <p className="mt-4 text-xs text-tinta-suave">
          La línea gris es la receta original; «En palabras» la dice sin abreviaturas. Si algo no queda claro, preguntale a Luna IA.
        </p>
      )}
    </section>
  );
}
