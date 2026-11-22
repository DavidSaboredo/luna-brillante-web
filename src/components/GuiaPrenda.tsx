"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GUIAS } from "@/lib/guias";
import { BASICOS, DECORACIONES, GUIA_PRENDAS, PASOS_APLICAR } from "@/lib/guia-prendas";
import { CUELLO_SUGERIDO, ENTRADA_INICIAL, calcularSueter, type Escote, type EntradaSueter } from "@/lib/sueter";
import { enlaceYoutube, textosVideos, videosDeDecoracion, videosDePrenda, type Video } from "@/lib/videos";
import { useIdioma } from "./Idioma";
import ReproductorVideo, { IconoPlay } from "./VideoYoutube";

/** Video paso a paso de la prenda, con botones para cambiar si hay más de uno. */
function VideosDePrenda({ videos }: { videos: Video[] }) {
  const { idioma } = useIdioma();
  const tv = textosVideos[idioma];
  const [id, setId] = useState(videos[0].id);
  const video = videos.find((v) => v.id === id) ?? videos[0];

  return (
    <section className="space-y-3 rounded-2xl border border-borde bg-papel p-4">
      <h3 className="flex items-center gap-2 text-lg">
        <IconoPlay className="h-5 w-5 text-lavanda-fuerte" /> {tv.deLaPrenda}
      </h3>
      <p className="text-base text-tinta-suave">{tv.deLaPrendaSub}</p>
      <ReproductorVideo key={video.id} video={video} etiqueta={tv.reproducir} />
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
        <strong className="font-medium">{video.titulo}</strong>
        <span className="text-tinta-suave">⏱ {video.duracion}</span>
        <a href={enlaceYoutube(video.id)} target="_blank" rel="noopener noreferrer" className="text-sm text-lavanda-fuerte underline">
          {tv.verEnYoutube} ↗
        </a>
      </p>
      {videos.length > 1 && (
        <div>
          <p className="text-sm text-tinta-suave">{tv.otrosVideos}</p>
          <p className="mt-1 flex flex-wrap gap-2">
            {videos.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={v.id === video.id}
                onClick={() => setId(v.id)}
                className={`chip text-left ${v.id === video.id ? "!border-lavanda !bg-lavanda" : ""}`}
              >
                {v.titulo} · {v.duracion}
              </button>
            ))}
          </p>
        </div>
      )}
    </section>
  );
}

const CAMPOS: { id: keyof EntradaSueter; nombre: string; ayuda: string }[] = [
  { id: "pecho", nombre: "Pecho terminado (cm)", ayuda: "Contorno de pecho + lo suelto que lo quieras" },
  { id: "cuello", nombre: "Contorno del escote (cm)", ayuda: "Tiene que pasar por la cabeza" },
  { id: "brazo", nombre: "Contorno del brazo arriba (cm)", ayuda: "Medido en la parte más ancha" },
  { id: "profundidad", nombre: "Largo del canesú (cm)", ayuda: "Del cuello hasta la axila" },
  { id: "largoCuerpo", nombre: "Largo del cuerpo (cm)", ayuda: "De la axila hasta abajo" },
  { id: "largoManga", nombre: "Largo de la manga (cm)", ayuda: "De la axila al puño" },
];

const ESCOTES: { id: Escote; nombre: string }[] = [
  { id: "redondo", nombre: "Redondo" },
  { id: "v", nombre: "En V" },
  { id: "bote", nombre: "Bote" },
];

const CAMPO_ENTRADA = "mt-1 w-full rounded-full border border-borde bg-papel px-4 py-2.5 outline-none focus:border-lavanda-fuerte";

function SueterDesdeCuello({ puntos, vueltas }: { puntos: number; vueltas: number }) {
  const [e, setE] = useState<EntradaSueter>(ENTRADA_INICIAL);
  const entrada = { ...e, puntosEn10: puntos, vueltasEn10: vueltas };
  const r = useMemo(() => calcularSueter(entrada), [e, puntos, vueltas]); // eslint-disable-line react-hooks/exhaustive-deps
  const cambiar = (id: keyof EntradaSueter, v: string) => setE((a) => ({ ...a, [id]: Math.max(0, Number(v) || 0) }));
  const elegirEscote = (id: Escote) => setE((a) => ({ ...a, escote: id, cuello: CUELLO_SUGERIDO[id] }));
  const valido = puntos > 0 && vueltas > 0 && e.pecho > 0 && e.cuello > 0 && e.brazo > 0;

  return (
    <div className="space-y-4">
      <p className="text-tinta-suave">
        Se teje de arriba hacia abajo, en redondo, con aumentos de raglán (4 líneas). Usa la muestra que cargaste en Medidas.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de escote">
        {ESCOTES.map((x) => (
          <button key={x.id} onClick={() => elegirEscote(x.id)} className={`chip ${e.escote === x.id ? "!border-lavanda !bg-lavanda" : ""}`}>
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
              className={CAMPO_ENTRADA}
            />
            <span className="text-sm text-tinta-suave">{c.ayuda}</span>
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
              <strong>Cadena inicial:</strong> {r.cadenaInicial} cadenetas. Cerrala en redondo con un punto raso. Repartí así: {r.panelDelanteroInicial} puntos
              adelante, {r.mangaInicial} en una manga, {r.panelDelanteroInicial} atrás y {r.mangaInicial} en la otra manga. Marcá las 4 uniones con un hilo de color.
            </li>
            <li>
              <strong>Canesú:</strong> tejé {r.vueltasCanesu} vueltas. En {r.vueltasAumento} de ellas ({r.cadaCuantasVueltas}) aumentá 1 punto a cada lado de cada
              marca (8 aumentos por vuelta). Al terminar tenés {r.puntosFinalesCanesu} puntos: {r.delanteroFinal} adelante, {r.mangaFinal} en cada manga y{" "}
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
        </div>
      )}
    </div>
  );
}

const TEMAS: Record<string, string[]> = {
  sueter: ["empezar-sueter", "cuello", "terminaciones"],
  cardigan: ["empezar-sueter", "cuello", "terminaciones"],
  chaleco: ["empezar-sueter", "cuello", "terminaciones"],
  musculosa: ["empezar-sueter", "cuello", "terminaciones"],
  blusa: ["empezar-sueter", "cuello", "sisa-corte", "blusa-diagonal", "mandala-tela", "terminaciones"],
  falda: ["ampliar-pantalon", "listones-pantalon", "triangulo-oxford", "terminaciones"],
  pollera: ["ampliar-pantalon", "listones-pantalon", "triangulo-oxford", "terminaciones"],
  short: ["ampliar-pantalon", "listones-pantalon", "triangulo-oxford", "terminaciones"],
  blusa_entredos: ["sisa-corte", "terminaciones"],
  camisa_mangas: ["sisa-corte", "mandala-tela", "terminaciones"],
  campera_jean: ["mandala-tela", "terminaciones"],
  vestido_canesu: ["sisa-corte", "terminaciones"],
  kimono: ["mandala-tela", "terminaciones"],
  falda_franja: ["ampliar-pantalon", "terminaciones"],
};

/** Guía de una prenda: cálculo especial (si lo tiene) y consejos que aplican a ella. Se usa dentro de Crear prenda. */
export default function GuiaPrenda({ prendaId, puntos, vueltas }: { prendaId: string; puntos: number; vueltas: number }) {
  const ids = TEMAS[prendaId] ?? ["terminaciones"];
  const consejos = ids.map((id) => GUIAS.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => !!g);
  const raglan = prendaId === "sueter" || prendaId === "cardigan";
  const g = GUIA_PRENDAS[prendaId];
  const videos = videosDePrenda(prendaId);
  const tv = textosVideos[useIdioma().idioma];

  return (
    <div className="space-y-5">
      {videos.length > 0 && <VideosDePrenda key={prendaId} videos={videos} />}
      {g && (
        <section className="space-y-3 rounded-2xl border border-borde bg-papel p-4">
          <h3 className="text-lg">Para empezar</h3>
          <p className="flex flex-wrap gap-2 text-base">
            <span className="chip">Nivel: {g.nivel}</span>
            <span className="chip">⏱ {g.tiempo}</span>
          </p>
          <div>
            <p className="font-medium">Qué necesitás</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-base">
              {g.materiales.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">Paso a paso</p>
            <ol className="mt-1 list-decimal space-y-3 pl-5 text-base">
              {g.pasos.map((p) => (
                <li key={p.titulo}>
                  <strong>{p.titulo}.</strong> {p.texto}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="font-medium">Para que te quede bien</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-base">
              {g.cuidado.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <details className="rounded-2xl border border-borde p-4">
        <summary className="cursor-pointer py-1 text-lg">Palabras que vas a encontrar</summary>
        <dl className="mt-3 space-y-3 text-base">
          {BASICOS.map((b) => (
            <div key={b.termino}>
              <dt className="font-medium">{b.termino}</dt>
              <dd className="text-tinta-suave">{b.explicacion}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 flex flex-wrap gap-2">
          <Link href="/puntos/chain" className="chip">Cadeneta</Link>
          <Link href="/puntos/slip_stitch" className="chip">Punto raso</Link>
          <Link href="/puntos/single_crochet" className="chip">Punto bajo</Link>
          <Link href="/puntos/double_crochet" className="chip">Punto vareta</Link>
          <Link href="/puntos/magic_ring" className="chip">Anillo mágico</Link>
        </p>
      </details>
      {raglan && (
        <details open className="rounded-2xl border border-borde p-4">
          <summary className="cursor-pointer text-lg">Tejido desde el cuello (raglán)</summary>
          <div className="mt-3">
            <SueterDesdeCuello puntos={puntos} vueltas={vueltas} />
          </div>
        </details>
      )}
      <section className="space-y-2">
        <h3 className="text-lg">Consejos para esta prenda</h3>
        {consejos.map((c) => (
          <details key={c.id} className="rounded-2xl border border-borde bg-papel p-4">
            <summary className="cursor-pointer py-1 text-base font-medium">{c.titulo}</summary>
            <div className="mt-3 space-y-3 text-base">
              <p className="text-tinta-suave">{c.resumen}</p>
              <ol className="list-decimal space-y-2 pl-5">
                {c.pasos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
              {c.nota && <p className="rounded-2xl bg-rosa/30 px-4 py-3 text-sm">{c.nota}</p>}
              {c.puntos && (
                <p className="flex flex-wrap gap-2">
                  {c.puntos.map((p) => (
                    <Link key={p.id} href={`/puntos/${p.id}`} className="chip">
                      {p.nombre}
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </details>
        ))}
        <p className="flex flex-wrap gap-x-5 gap-y-1 pt-1">
          <Link href="/diagramas" className="text-sm text-lavanda-fuerte underline">
            📐 Puntillas y diagramas de Monica →
          </Link>
          <Link href="/videos" className="text-sm text-lavanda-fuerte underline">
            <IconoPlay className="h-3.5 w-3.5 align-[-0.1em]" /> {tv.verVideos}
          </Link>
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-borde bg-papel p-4">
        <h3 className="text-lg">Agregale un mandala o una figura</h3>
        {g && <p className="text-base">{g.decorar}</p>}
        <p className="text-base text-tinta-suave">Elegí una opción. Se teje aparte y después se cose a la prenda.</p>
        <div className="space-y-2">
          {DECORACIONES.map((d) => {
            const videoDeco = videosDeDecoracion(d.id)[0];
            return (
              <details key={d.id} className="rounded-2xl border border-borde p-4">
                <summary className="cursor-pointer py-1 text-base font-medium">
                  {d.icono} {d.nombre} <span className="text-tinta-suave">· {d.nivel}</span>
                  {videoDeco && (
                    <span className="text-lavanda-fuerte">
                      {" "}
                      · <IconoPlay className="h-3.5 w-3.5 align-[-0.1em]" />
                    </span>
                  )}
                </summary>
                <div className="mt-3 space-y-3 text-base">
                  <p>{d.como}</p>
                  {videoDeco && (
                    <div className="space-y-2">
                      <p className="text-sm text-tinta-suave">
                        <IconoPlay className="h-3.5 w-3.5 align-[-0.1em] text-lavanda-fuerte" /> {tv.videoDeco}: {videoDeco.titulo} ·{" "}
                        {videoDeco.duracion}
                      </p>
                      <ReproductorVideo video={videoDeco} etiqueta={tv.reproducir} />
                    </div>
                  )}
                  <p className="flex flex-wrap gap-2">
                    {d.puntos.map((p) => (
                      <Link key={p.id} href={`/puntos/${p.id}`} className="chip">
                        {p.nombre}
                      </Link>
                    ))}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
        <details className="rounded-2xl border border-borde p-4">
          <summary className="cursor-pointer py-1 text-base font-medium">Cómo coserlo a la prenda</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-base">
            {PASOS_APLICAR.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </details>
        <Link href="/diagramas" className="inline-block text-sm text-lavanda-fuerte underline">
          🌼 Ver más motivos en los diagramas de Monica →
        </Link>
      </section>
    </div>
  );
}
