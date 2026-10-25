import Link from "next/link";
import { notFound } from "next/navigation";
import { Nivel } from "@/components/TarjetaPunto";
import { buscarPunto } from "@/lib/puntos";
import { buscarProyecto, fuenteRevista, notaRevista, proyectos } from "@/lib/proyectos";

export function generateStaticParams() {
  return proyectos.map((p) => ({ id: p.id }));
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span aria-hidden className="text-lavanda-fuerte">
            •
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function DetalleProyecto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = buscarProyecto(id);
  if (!p) notFound();

  const idx = proyectos.findIndex((x) => x.id === p.id);
  const anterior = proyectos[idx - 1];
  const siguiente = proyectos[idx + 1];

  return (
    <article className="space-y-6">
      <Link href="/proyectos" className="text-sm text-tinta-suave hover:text-tinta">
        ← Volver a la revista
      </Link>

      <header className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
        <div className="tarjeta overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.portada} alt={p.titulo} className="w-full object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-3">
          <p className="text-sm text-tinta-suave">
            Diseño N.º {p.numero} · {p.categoria} · pág. {p.pagina}
          </p>
          <h1 className="text-4xl md:text-5xl">{p.titulo}</h1>
          <p className="text-lg text-tinta-suave">{p.lema}</p>
          <p>{p.descripcion}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="chip">
              <Nivel nivel={p.nivelNum} /> {p.nivel}
            </span>
            {p.talles.map((t) => (
              <span key={t} className="chip">
                Talle {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          <section className="tarjeta p-5">
            <h2 className="text-2xl">Materiales</h2>
            <Lista items={p.materiales} />
          </section>

          <section className="tarjeta p-5">
            <h2 className="text-2xl">Medidas</h2>
            <Lista items={p.medidas} />
            <p className="mt-3 text-xs text-tinta-suave">{notaRevista}</p>
          </section>

          <section className="tarjeta p-5">
            <h2 className="text-2xl">Puntos que se usan</h2>
            <ul className="mt-2 space-y-1.5">
              {p.puntosUsados.map((u) => {
                const punto = u.punto ? buscarPunto(u.punto) : null;
                return (
                  <li key={u.texto} className="flex gap-2">
                    <span aria-hidden className="text-lavanda-fuerte">
                      •
                    </span>
                    {punto ? (
                      <Link
                        href={`/puntos/${punto.id}`}
                        className="underline decoration-lavanda underline-offset-4 hover:text-lavanda-fuerte"
                      >
                        {u.texto}
                      </Link>
                    ) : (
                      <span>{u.texto}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>

        <div className="space-y-4">
          <section className="tarjeta p-5">
            <h2 className="text-2xl">Cómo se teje</h2>
            <div className="mt-2 space-y-2">
              {p.explicacion.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </section>

          <section className="tarjeta p-5">
            <h2 className="text-2xl">{p.puntoFantasia.titulo}</h2>
            <p className="mt-2 text-tinta-suave">{p.puntoFantasia.texto}</p>
            <ol className="mt-4 space-y-3">
              {p.puntoFantasia.filas.map((f, i) => (
                <li key={f.t} className="rounded-2xl border border-borde bg-crema/40 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavanda text-sm">
                      {i + 1}
                    </span>
                    <h3 className="text-lg leading-tight">{f.t}</h3>
                  </div>
                  <p className="mt-2 font-mono text-sm leading-relaxed">{f.r}</p>
                </li>
              ))}
            </ol>
            {p.puntoFantasia.aviso && <p className="mt-4 rounded-xl bg-manteca/60 p-3 text-sm">⚠ {p.puntoFantasia.aviso}</p>}
          </section>

          {p.flores?.map((fl) => (
            <section key={fl.titulo} className="tarjeta p-5">
              <h2 className="text-2xl">{fl.titulo}</h2>
              <ol className="mt-3 space-y-2">
                {fl.pasos.map((paso, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rosa text-sm">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{paso}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          {p.imagenes.map((img) => (
            <figure key={img.src} className="tarjeta overflow-hidden p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="mx-auto w-full" loading="lazy" />
              <figcaption className="mt-2 text-center text-xs text-tinta-suave">{img.pie}</figcaption>
            </figure>
          ))}

          <section className="tarjeta p-5">
            <h2 className="text-2xl">Terminaciones</h2>
            <ol className="mt-3 space-y-2">
              {p.terminaciones.map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-menta text-sm">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{t}</span>
                </li>
              ))}
            </ol>
            {p.consejos.length > 0 && (
              <div className="mt-4 rounded-xl bg-manteca/60 p-3 text-sm">
                {p.consejos.map((c) => (
                  <p key={c}>💡 {c}</p>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <nav className="flex justify-between gap-3 text-sm">
        {anterior ? (
          <Link href={`/proyectos/${anterior.id}`} className="chip">
            ← {anterior.titulo}
          </Link>
        ) : (
          <span />
        )}
        {siguiente && (
          <Link href={`/proyectos/${siguiente.id}`} className="chip">
            {siguiente.titulo} →
          </Link>
        )}
      </nav>
      <p className="text-center text-xs text-tinta-suave">{fuenteRevista}</p>
    </article>
  );
}
