"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GUIAS } from "@/lib/guias";
import { CUELLO_SUGERIDO, ENTRADA_INICIAL, calcularSueter, type Escote, type EntradaSueter } from "@/lib/sueter";

const CAMPOS: { id: keyof EntradaSueter; nombre: string; ayuda: string }[] = [
  { id: "pecho", nombre: "Pecho terminado (cm)", ayuda: "Contorno de pecho + lo suelto que lo quieras" },
  { id: "cuello", nombre: "Contorno del escote (cm)", ayuda: "Tiene que pasar por la cabeza" },
  { id: "brazo", nombre: "Contorno del brazo arriba (cm)", ayuda: "Medido en la parte más ancha" },
  { id: "profundidad", nombre: "Largo del canesú (cm)", ayuda: "Del cuello hasta la axila" },
  { id: "largoCuerpo", nombre: "Largo del cuerpo (cm)", ayuda: "De la axila hasta abajo" },
  { id: "largoManga", nombre: "Largo de la manga (cm)", ayuda: "De la axila al puño" },
  { id: "puntosEn10", nombre: "Puntos en 10 cm", ayuda: "Medilo en tu muestra tejida" },
  { id: "vueltasEn10", nombre: "Vueltas en 10 cm", ayuda: "Medilo en tu muestra tejida" },
];

const ESCOTES: { id: Escote; nombre: string }[] = [
  { id: "redondo", nombre: "Redondo" },
  { id: "v", nombre: "En V" },
  { id: "bote", nombre: "Bote" },
];

export default function Guias() {
  const [e, setE] = useState<EntradaSueter>(ENTRADA_INICIAL);
  const r = useMemo(() => calcularSueter(e), [e]);

  const cambiar = (id: keyof EntradaSueter, v: string) => setE((a) => ({ ...a, [id]: Math.max(0, Number(v) || 0) }));
  const elegirEscote = (id: Escote) => setE((a) => ({ ...a, escote: id, cuello: CUELLO_SUGERIDO[id] }));
  const valido = e.puntosEn10 > 0 && e.vueltasEn10 > 0 && e.pecho > 0 && e.cuello > 0 && e.brazo > 0;

  return (
    <div className="space-y-8">
      <section className="tarjeta space-y-4 p-5">
        <h2 className="text-2xl">Suéter desde el cuello</h2>
        <p className="text-tinta-suave">
          Se teje de arriba hacia abajo, en redondo, con aumentos de raglán (4 líneas). Tejé primero una muestra de 10 x 10 cm
          con tu hilado y tu aguja (por ejemplo algodón mediano con aguja de 2,5 a 3 mm) y contá los puntos y las vueltas.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de escote">
          {ESCOTES.map((x) => (
            <button
              key={x.id}
              onClick={() => elegirEscote(x.id)}
              className={`chip ${e.escote === x.id ? "!border-lavanda !bg-lavanda" : ""}`}
            >
              {x.nombre}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPOS.map((c) => (
            <label key={c.id} className="block">
              <span className="text-sm">{c.nombre}</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={e[c.id] === 0 ? "" : (e[c.id] as number)}
                onChange={(ev) => cambiar(c.id, ev.target.value)}
                className="mt-1 w-full rounded-full border border-borde bg-papel px-4 py-2.5 outline-none focus:border-lavanda-fuerte"
              />
              <span className="text-xs text-tinta-suave">{c.ayuda}</span>
            </label>
          ))}
        </div>

        {!valido ? (
          <p className="text-tinta-suave">Completá todas las medidas para calcular.</p>
        ) : (
          <div className="space-y-3">
            {r.avisos.map((a) => (
              <p key={a} className="rounded-2xl bg-rosa/40 px-4 py-3 text-sm">
                {a}
              </p>
            ))}
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <strong>Cadena inicial:</strong> {r.cadenaInicial} cadenetas. Cerrala en redondo con un punto raso.
                Repartí así: {r.panelDelanteroInicial} puntos adelante, {r.mangaInicial} en una manga, {r.panelDelanteroInicial} atrás y{" "}
                {r.mangaInicial} en la otra manga. Marcá las 4 uniones con un hilo de color.
              </li>
              <li>
                <strong>Canesú:</strong> tejé {r.vueltasCanesu} vueltas. En {r.vueltasAumento} de ellas ({r.cadaCuantasVueltas}) aumentá 1 punto a cada lado
                de cada marca (8 aumentos por vuelta). Al terminar tenés {r.puntosFinalesCanesu} puntos: {r.delanteroFinal} adelante, {r.mangaFinal} en cada manga y{" "}
                {r.delanteroFinal} atrás.
              </li>
              <li>
                <strong>Separar mangas:</strong> dejá los puntos de cada manga en espera y armá {r.cadenasAxila} cadenetas en cada axila. Seguí el cuerpo en redondo con{" "}
                {r.puntosCuerpo} puntos.
              </li>
              <li>
                <strong>Cuerpo:</strong> tejé {r.vueltasCuerpo} vueltas rectas y terminá con una vuelta elástica (punto bajo en hebra trasera).
              </li>
              <li>
                <strong>Mangas:</strong> retomá los {r.mangaFinal} puntos y levantá {r.cadenasAxila} en la axila (total {r.puntosManga}). Tejé {r.vueltasManga} vueltas
                disminuyendo 2 puntos {r.cadaCuantasDisminucion} ({r.disminucionesManga} veces) hasta el puño.
              </li>
            </ol>
            <p className="text-xs text-tinta-suave">
              Probá la prenda en el cuerpo al terminar el canesú. Si hace falta, retrocedé unas vueltas antes de separar las mangas.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Cómo se hace</h2>
        <p className="rounded-2xl bg-papel px-4 py-3 text-sm text-tinta-suave">
          Borrador: Monica tiene que revisar estas guías antes de darlas por definitivas.
        </p>
        {GUIAS.map((g) => (
          <details key={g.id} className="tarjeta p-4">
            <summary className="cursor-pointer text-lg">{g.titulo}</summary>
            <p className="mt-2 text-tinta-suave">{g.resumen}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              {g.pasos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            {g.nota && <p className="mt-3 rounded-2xl bg-papel px-4 py-3 text-sm">{g.nota}</p>}
            {g.puntos && (
              <p className="mt-3 flex flex-wrap gap-2">
                {g.puntos.map((p) => (
                  <Link key={p.id} href={`/puntos/${p.id}`} className="chip">
                    {p.nombre}
                  </Link>
                ))}
              </p>
            )}
          </details>
        ))}
        <Link href="/diagramas" className="inline-block text-sm text-lavanda-fuerte underline">
          📐 Puntillas y diagramas de Monica →
        </Link>
      </section>
    </div>
  );
}
