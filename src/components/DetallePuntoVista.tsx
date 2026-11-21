"use client";

import Link from "next/link";
import CalculadoraCadena from "@/components/CalculadoraCadena";
import PasoAPaso from "@/components/PasoAPaso";
import PasosRevista from "@/components/PasosRevista";
import { Nivel } from "@/components/TarjetaPunto";
import { useIdioma } from "@/components/Idioma";
import { textosPuntos } from "@/lib/textos-puntos";
import { fotosTejedora } from "@/lib/fotos-tejedora";
import { diagramaDeRevista, diagramasPorVueltas, textosDiagramas } from "@/lib/diagramas";
import {
  buscarPunto,
  fondoCategoria,
  nombreCategoria,
  rutaDiagrama,
  rutaIlustracion,
  tx,
  txLista,
  type Punto,
} from "@/lib/puntos";

type Revista = { id: string; titulo: string };

function EnlacesPuntos({ titulo, ids }: { titulo: string; ids: string[] }) {
  const { idioma } = useIdioma();
  const lista = ids.map(buscarPunto).filter((p) => p !== undefined);
  if (!lista.length) return null;
  return (
    <div>
      <p className="mb-2 text-sm text-tinta-suave">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {lista.map((p) => (
          <Link key={p.id} href={`/puntos/${p.id}`} className="chip hover:border-lavanda-fuerte">
            {tx(p.name, idioma)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DetallePuntoVista({ punto, enRevista }: { punto: Punto; enRevista: Revista[] }) {
  const { idioma } = useIdioma();
  const k = textosPuntos[idioma].puntos;
  const nombre = tx(punto.name, idioma);
  // Si Monica tejió una muestra, arriba va su foto real en lugar del modelado 3D.
  const [fotoReal, ...otrasMuestras] = fotosTejedora(punto.id);
  const ilustracion = fotoReal ? null : rutaIlustracion(punto);
  const deRevista = diagramaDeRevista(punto.id);
  // Los puntos armados en etapas traen una lámina por tramo de vueltas en lugar de un solo diagrama.
  const laminas = diagramasPorVueltas(punto.id);
  const diagramaUnico = laminas.length === 0;
  const seTeje = { rows: k.filas, rounds: k.redondo, "n/a": "—" }[punto.worked_in];
  const aka = txLista(punto.aka, idioma);
  const datos: [string, string][] = [
    [k.nivelDato, tx(punto.difficulty_label, idioma)],
    [k.abreviatura, idioma === "en" ? punto.abbreviation.us : punto.abbreviation.es],
    [k.enIngles, `${punto.name.en} (${punto.abbreviation.us})`],
    [k.seTeje, seTeje],
    ...(punto.repeat ? ([[k.cadenaBase, k.multiplo(punto.repeat.multiple, punto.repeat.plus)]] as [string, string][]) : []),
  ];

  return (
    <article className="space-y-6">
      <Link href="/puntos" className="text-sm text-tinta-suave hover:text-tinta">
        {k.volver}
      </Link>

      <header className={`rounded-[var(--radius-suave)] p-6 md:p-8 ${fondoCategoria(punto.category)}`}>
        <p className="flex items-center gap-2 text-sm">
          {nombreCategoria(punto.category, idioma)} · <Nivel nivel={punto.difficulty} />
        </p>
        <h1 className="mt-1 text-4xl md:text-5xl">{nombre}</h1>
        {aka.length > 0 && (
          <p className="mt-1 text-sm">
            {k.tambien}: {aka.join(", ")}
          </p>
        )}
        <p className="mt-3 max-w-2xl">{tx(punto.description, idioma)}</p>
      </header>

      <section className={`grid gap-4 ${(fotoReal || ilustracion) && diagramaUnico ? "md:grid-cols-2" : ""}`}>
        {fotoReal && (
          <figure className="tarjeta overflow-hidden">
            {/* Fotos recortadas sin fondo: se ven enteras sobre un fondo suave. */}
            <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-crema to-papel ${diagramaUnico ? "" : "md:aspect-[2/1]"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoReal.archivo} alt={`${nombre}: ${fotoReal.leyenda[idioma]}`} className="relative h-full w-full object-contain p-5 drop-shadow-[0_6px_10px_rgba(60,40,30,0.25)]" />
            </div>
            <figcaption className="px-3 py-2 text-xs text-tinta-suave">
              {k.muestraReal} · {fotoReal.leyenda[idioma]}
            </figcaption>
          </figure>
        )}
        {ilustracion && (
          <figure className="tarjeta overflow-hidden bg-gradient-to-b from-crema to-papel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ilustracion} alt={`${nombre}: 3D`} className="aspect-[4/3] w-full object-contain" />
            <figcaption className="px-3 py-2 text-xs text-tinta-suave">{k.modelado}</figcaption>
          </figure>
        )}
        {diagramaUnico && (
          <figure className="tarjeta flex flex-col justify-center overflow-x-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rutaDiagrama(punto)} alt={nombre} className="mx-auto max-h-80 min-w-[320px]" />
            <figcaption className="mt-2 text-center text-xs text-tinta-suave">{k.diagrama}</figcaption>
          </figure>
        )}
      </section>

      {laminas.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-2xl">{k.diagramasVueltas}</h2>
            <p className="text-sm text-tinta-suave">{k.diagramasVueltasTexto}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {laminas.map((l) => (
              <figure key={l.archivo} className="tarjeta overflow-hidden">
                <a href={l.archivo} target="_blank" rel="noopener noreferrer" className="block bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.archivo} alt={`${nombre}: ${l.nombre[idioma]}`} loading="lazy" className="w-full transition hover:opacity-90" />
                </a>
                <figcaption className="px-3 py-2 text-sm">{l.nombre[idioma]}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {deRevista && (
        <section className="space-y-2">
          <h2 className="text-xl">{textosDiagramas[idioma].deRevista}</h2>
          <figure className="tarjeta overflow-hidden">
            <a href={deRevista.archivo} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deRevista.archivo} alt={`${nombre}: ${deRevista.nombre[idioma]}`} loading="lazy" className="max-h-[28rem] w-full bg-papel object-contain" />
            </a>
          </figure>
        </section>
      )}

      {otrasMuestras.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl">{k.muestraReal}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otrasMuestras.map((m) => (
              <figure key={m.archivo} className="tarjeta overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.archivo} alt={`${nombre}: ${m.leyenda[idioma]}`} loading="lazy" className="max-h-[28rem] w-full bg-gradient-to-b from-crema to-papel object-contain p-4 drop-shadow-[0_6px_10px_rgba(60,40,30,0.25)]" />
                <figcaption className="px-3 py-2 text-xs text-tinta-suave">{m.leyenda[idioma]}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          <dl className="tarjeta divide-y divide-borde p-2 text-sm">
            {datos.map(([a, v]) => (
              <div key={a} className="flex justify-between gap-4 px-3 py-2.5">
                <dt className="text-tinta-suave">{a}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>

          {punto.repeat && <CalculadoraCadena punto={punto} />}

          <div className="flex flex-col gap-2">
            <Link
              href={`/crear?punto=${punto.id}`}
              className="rounded-full bg-lavanda-fuerte px-5 py-3 text-center text-sm text-white"
            >
              {k.usarCrear}
            </Link>
          </div>
        </aside>

        <div className="space-y-4">
          <PasoAPaso punto={punto} />

          <PasosRevista idPunto={punto.id} />

          <section className="tarjeta space-y-4 p-5">
            <div>
              <p className="mb-2 text-sm text-tinta-suave">{k.idealPara}</p>
              <div className="flex flex-wrap gap-2">
                {txLista(punto.uses, idioma).map((u) => (
                  <span key={u} className="chip">
                    {u}
                  </span>
                ))}
              </div>
            </div>
            <EnlacesPuntos titulo={k.convieneSaber} ids={punto.prerequisites} />
            <EnlacesPuntos titulo={k.relacionados} ids={punto.related} />
            {enRevista.length > 0 && (
              <div>
                <p className="mb-2 text-sm text-tinta-suave">{k.enRevista}</p>
                <div className="flex flex-wrap gap-2">
                  {enRevista.map((r) => (
                    <Link key={r.id} href="/proyectos" className="chip hover:border-lavanda-fuerte">
                      ❀ {r.titulo}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}
