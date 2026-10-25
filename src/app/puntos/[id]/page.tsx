import Link from "next/link";
import { notFound } from "next/navigation";
import CalculadoraCadena from "@/components/CalculadoraCadena";
import PasoAPaso from "@/components/PasoAPaso";
import PasosRevista from "@/components/PasosRevista";
import { Nivel } from "@/components/TarjetaPunto";
import { proyectosConPunto } from "@/lib/proyectos";
import {
  SE_TEJE,
  buscarPunto,
  fondoCategoria,
  nombreCategoria,
  puntos,
  rutaDiagrama,
  rutaIlustracion,
  textoRepeticion,
} from "@/lib/puntos";

export function generateStaticParams() {
  return puntos.map((p) => ({ id: p.id }));
}

function EnlacesPuntos({ titulo, ids }: { titulo: string; ids: string[] }) {
  const lista = ids.map(buscarPunto).filter((p) => p !== undefined);
  if (!lista.length) return null;
  return (
    <div>
      <p className="mb-2 text-sm text-tinta-suave">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {lista.map((p) => (
          <Link key={p.id} href={`/puntos/${p.id}`} className="chip hover:border-lavanda-fuerte">
            {p.name.es}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function DetallePunto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const punto = buscarPunto(id);
  if (!punto) notFound();

  const repeticion = textoRepeticion(punto);
  const ilustracion = rutaIlustracion(punto);
  const enRevista = proyectosConPunto(punto.id);
  const datos = [
    ["Nivel", punto.difficulty_label.es],
    ["Abreviatura", punto.abbreviation.es],
    ["En inglés", `${punto.name.en} (${punto.abbreviation.us})`],
    ["Se teje", SE_TEJE[punto.worked_in]],
    ...(repeticion ? [["Cadena base", repeticion]] : []),
  ];

  return (
    <article className="space-y-6">
      <Link href="/puntos" className="text-sm text-tinta-suave hover:text-tinta">
        ← Volver a puntos
      </Link>

      <header className={`rounded-[var(--radius-suave)] p-6 md:p-8 ${fondoCategoria(punto.category)}`}>
        <p className="flex items-center gap-2 text-sm">
          {nombreCategoria(punto.category)} · <Nivel nivel={punto.difficulty} />
        </p>
        <h1 className="mt-1 text-4xl md:text-5xl">{punto.name.es}</h1>
        {punto.aka.es.length > 0 && <p className="mt-1 text-sm">También: {punto.aka.es.join(", ")}</p>}
        <p className="mt-3 max-w-2xl">{punto.description.es}</p>
      </header>

      <section className={`grid gap-4 ${ilustracion ? "md:grid-cols-2" : ""}`}>
        {ilustracion && (
          <figure className="tarjeta overflow-hidden bg-gradient-to-b from-crema to-papel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ilustracion} alt={`${punto.name.es}: modelado 3D del punto`} className="aspect-[4/3] w-full object-contain" />
            <figcaption className="px-3 py-2 text-xs text-tinta-suave">
              Modelado 3D en Blender · hilo de tres cabos, visto de frente
            </figcaption>
          </figure>
        )}
        <figure className="tarjeta flex flex-col justify-center overflow-x-auto p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rutaDiagrama(punto)} alt={`Diagrama: ${punto.name.es}`} className="mx-auto max-h-80 min-w-[320px]" />
          <figcaption className="mt-2 text-center text-xs text-tinta-suave">
            Diagrama · se lee de abajo hacia arriba
          </figcaption>
        </figure>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          <dl className="tarjeta divide-y divide-borde p-2 text-sm">
            {datos.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-3 py-2.5">
                <dt className="text-tinta-suave">{k}</dt>
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
              ✂ Usar en Crear prenda
            </Link>
            <Link
              href={`/asistente?pregunta=${encodeURIComponent(`Tengo una duda con el ${punto.name.es}: `)}`}
              className="rounded-full border border-lavanda-fuerte px-5 py-3 text-center text-sm text-lavanda-fuerte"
            >
              ✦ Preguntar a Luna IA
            </Link>
          </div>
        </aside>

        <div className="space-y-4">
          <PasoAPaso punto={punto} />

          <PasosRevista idPunto={punto.id} />

          <section className="tarjeta space-y-4 p-5">
            <div>
              <p className="mb-2 text-sm text-tinta-suave">Ideal para</p>
              <div className="flex flex-wrap gap-2">
                {punto.uses.es.map((u) => (
                  <span key={u} className="chip">
                    {u}
                  </span>
                ))}
              </div>
            </div>
            <EnlacesPuntos titulo="Conviene saber antes" ids={punto.prerequisites} />
            <EnlacesPuntos titulo="Puntos relacionados" ids={punto.related} />
            {enRevista.length > 0 && (
              <div>
                <p className="mb-2 text-sm text-tinta-suave">Lo vas a usar en la revista</p>
                <div className="flex flex-wrap gap-2">
                  {enRevista.map((r) => (
                    <Link key={r.id} href={`/proyectos/${r.id}`} className="chip hover:border-lavanda-fuerte">
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
