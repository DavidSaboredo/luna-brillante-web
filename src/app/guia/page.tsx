import Link from "next/link";
import { buscarPunto } from "@/lib/puntos";
import { guia } from "@/lib/proyectos";
import { guiaRevista as g } from "@/lib/revista";
import { imagenMejorada } from "@/lib/imagenes";

export const metadata = { title: "Guía de puntos y símbolos · Luna Brillante" };

export default function PaginaGuia() {
  return (
    <div className="space-y-6">
      <Link href="/proyectos" className="text-sm text-tinta-suave hover:text-tinta">
        ← Volver a la revista
      </Link>
      <header>
        <h1 className="text-4xl">Guía de puntos y símbolos</h1>
        <p className="text-tinta-suave">Todo lo que necesitás para tejer los proyectos de la revista.</p>
      </header>

      <section className="tarjeta p-5">
        <h2 className="text-2xl">Símbolos y abreviaturas</h2>
        <div className="mt-3 divide-y divide-borde">
          {guia.simbolos.map((s) => {
            const punto = buscarPunto(s.punto);
            return (
              <div key={s.nombre} className="flex items-center gap-4 py-2.5">
                <span className="w-10 text-center font-mono text-2xl text-lavanda-fuerte">{s.simbolo}</span>
                <span className="flex-1">
                  {punto ? (
                    <Link href={`/puntos/${punto.id}`} className="underline decoration-lavanda underline-offset-4">
                      {s.nombre}
                    </Link>
                  ) : (
                    s.nombre
                  )}
                </span>
                <span className="font-mono text-sm text-tinta-suave">{s.abreviatura}</span>
              </div>
            );
          })}
        </div>
      </section>


      <section className="tarjeta p-5">
        <h2 className="text-2xl">Cómo lo dicen las tejedoras</h2>
        <p className="mt-1 text-sm text-tinta-suave">
          En las revistas argentinas los puntos tienen otros nombres que en los patrones en inglés. Esta tabla une los dos mundos.
        </p>
        <div className="mt-3 divide-y divide-borde">
          {g.equivalencias.map((e) => {
            const punto = buscarPunto(e.punto);
            return (
              <div key={e.revista} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
                <span className="flex-1 min-w-[12rem]">
                  {punto ? (
                    <Link href={`/puntos/${punto.id}`} className="underline decoration-lavanda underline-offset-4">
                      {e.revista}
                    </Link>
                  ) : (
                    e.revista
                  )}
                </span>
                <span className="font-mono text-sm text-tinta-suave">{e.abrev}</span>
                <span className="font-mono text-sm">{e.app}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tarjeta p-5">
        <h2 className="text-2xl">Palabras de tejedora</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
          {g.palabras.map((p) => (
            <div key={p.palabra}>
              <dt className="font-medium">{p.palabra}</dt>
              <dd className="text-sm text-tinta-suave">{p.significa}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="tarjeta p-5">
          <h2 className="text-2xl">Hacer una muestra</h2>
          <ol className="mt-3 space-y-2">
            {g.muestra.map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rosa text-sm">{i + 1}</span>
                <span className="pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="tarjeta p-5">
          <h2 className="text-2xl">Dar altura a la hilera</h2>
          <p className="mt-2 text-sm">
            Al terminar una hilera, girá la labor y hacé cadenetas para que el primer punto quede a la altura del resto.
          </p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-tinta-suave">
              <tr>
                <th className="py-1 font-normal">Si la hilera es de…</th>
                <th className="py-1 font-normal">Cadenetas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {g.alturaHilera.map((a) => (
                <tr key={a.punto}>
                  <td className="py-1.5">{a.punto}</td>
                  <td className="py-1.5 font-mono">{a.cadenas}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mt-5 text-lg">Para leer los diagramas</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {g.lecturaDiagramas.map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className="text-lavanda-fuerte">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="tarjeta overflow-x-auto p-5">
        <h2 className="text-2xl">{g.tablaMedidas.titulo}</h2>
        <table className="mt-3 w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="bg-rosa/60 text-left">
              {g.tablaMedidas.columnas.map((c) => (
                <th key={c} className="px-2 py-2 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {g.tablaMedidas.filas.map((fila) => (
              <tr key={fila[0]}>
                {fila.map((v, i) => (
                  <td key={i} className={`px-2 py-1.5 ${i === 0 ? "font-medium" : ""}`}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-tinta-suave">{g.tablaMedidas.nota}</p>
      </section>

      <section className="tarjeta p-5">
        <h2 className="text-2xl">Aguja y hebra: cómo tomarlas</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {g.agujaHebra.map((a) => (
            <div key={a.titulo} className="rounded-2xl bg-crema/60 p-3">
              <p className="font-medium">{a.titulo}</p>
              <p className="text-sm text-tinta-suave">{a.texto}</p>
            </div>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagenMejorada("/revista/pasos/aguja-y-hebra.webp")} alt="Cómo tomar la aguja y la hebra" loading="lazy" className="mt-3 w-full rounded-2xl" />
      </section>

      <section className="tarjeta p-5">
        <h2 className="text-2xl">Cómo unir las piezas</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {g.unir.map((u) => (
            <div key={u.titulo} className="rounded-2xl bg-crema/60 p-4">
              <p className="font-medium">{u.titulo}</p>
              <p className="mt-1 text-sm">{u.texto}</p>
            </div>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagenMejorada("/revista/pasos/union-prendas.webp")} alt="Opciones para unir prendas, paso a paso" loading="lazy" className="mt-3 w-full rounded-2xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagenMejorada("/revista/pasos/union-motivos.webp")} alt="Unión de motivos cuadrados, paso a paso" loading="lazy" className="mt-3 w-full rounded-2xl" />
        <h3 className="mt-5 text-lg">Terminaciones prolijas</h3>
        <ul className="mt-2 space-y-1.5 text-sm">
          {g.terminaciones.map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden className="text-lavanda-fuerte">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">💡 {g.moldes}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="tarjeta p-5">
          <h2 className="text-2xl">Cómo leer un diagrama</h2>
          <ol className="mt-3 space-y-2">
            {guia.leerDiagrama.map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavanda text-sm">
                  {i + 1}
                </span>
                <span className="pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="tarjeta p-5">
          <h2 className="text-2xl">Cuidado de tus prendas</h2>
          <ul className="mt-3 space-y-2">
            {guia.cuidado.map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className="text-menta-fuerte">
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {guia.consejos.map((c) => (
          <div key={c.titulo} className="tarjeta p-5">
            <h3 className="text-xl">{c.titulo}</h3>
            <p className="mt-1 text-sm">{c.texto}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
