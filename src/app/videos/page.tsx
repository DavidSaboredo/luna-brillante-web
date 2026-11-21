"use client";

import { useEffect, useRef, useState } from "react";
import { useIdioma } from "@/components/Idioma";
import ReproductorVideo, { IconoPlay } from "@/components/VideoYoutube";
import { CANAL_URL, CATEGORIAS, VIDEOS, buscarVideo, enlaceYoutube, miniatura, textosVideos, type CategoriaVideo } from "@/lib/videos";

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

type Seleccion = { id: string; inicio: number; iniciar: boolean };

export default function Videos() {
  const { idioma } = useIdioma();
  const tv = textosVideos[idioma];
  const [categoria, setCategoria] = useState<CategoriaVideo | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [sel, setSel] = useState<Seleccion>({ id: VIDEOS[0].id, inicio: 0, iniciar: false });
  const zonaReproductor = useRef<HTMLElement>(null);

  // Link directo a un video: /videos#ID (lo usan la página de inicio y las guías)
  useEffect(() => {
    const v = buscarVideo(decodeURIComponent(window.location.hash.slice(1)));
    if (v) setSel({ id: v.id, inicio: 0, iniciar: false });
  }, []);

  const video = buscarVideo(sel.id) ?? VIDEOS[0];
  const texto = normalizar(busqueda.trim());
  const lista = VIDEOS.filter((v) => (categoria === "todos" || v.categoria === categoria) && (!texto || normalizar(v.titulo).includes(texto)));

  const elegir = (id: string, inicio = 0) => {
    setSel({ id, inicio, iniciar: true });
    window.history.replaceState(null, "", `#${id}`);
    zonaReproductor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">{tv.titulo}</h1>
        <p className="mt-1 max-w-2xl text-tinta-suave">
          {tv.sub} {tv.enEspanol}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <section ref={zonaReproductor} className="scroll-mt-24 space-y-3 lg:sticky lg:top-24">
          <ReproductorVideo key={`${sel.id}-${sel.inicio}`} video={video} etiqueta={tv.reproducir} inicio={sel.inicio} iniciar={sel.iniciar} />
          <div className="space-y-2">
            <h2 className="text-2xl leading-tight">{video.titulo}</h2>
            <p className="flex flex-wrap items-center gap-2 text-base">
              <span className="chip">⏱ {video.duracion}</span>
              <span className="chip">{tv.categorias[video.categoria]}</span>
              <a href={enlaceYoutube(video.id, sel.inicio)} target="_blank" rel="noopener noreferrer" className="chip">
                {tv.verEnYoutube} ↗
              </a>
            </p>
            {video.capitulos && video.capitulos.length > 0 && (
              <div>
                <p className="font-medium">{tv.capitulos}</p>
                <p className="mt-1 flex flex-wrap gap-2">
                  {video.capitulos.map((c) => (
                    <button key={c.inicio} type="button" onClick={() => elegir(video.id, c.inicio)} className="chip">
                      {Math.floor(c.inicio / 60)}:{String(c.inicio % 60).padStart(2, "0")} · {c.titulo}
                    </button>
                  ))}
                </p>
              </div>
            )}
            <p className="text-sm text-tinta-suave">{tv.privacidad}</p>
          </div>
          <a
            href={`${CANAL_URL}?sub_confirmation=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="tarjeta flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rosa text-tinta">
              <IconoPlay className="ml-0.5 h-5 w-5" />
            </span>
            <span>
              <span className="block font-titulo text-xl font-semibold">{tv.canal}</span>
              <span className="text-sm text-lavanda-fuerte">{tv.suscribite} ↗</span>
            </span>
          </a>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label={tv.titulo}>
            {(["todos", ...CATEGORIAS] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
                className={`chip ${categoria === c ? "!border-lavanda !bg-lavanda" : ""}`}
              >
                {c === "todos" ? tv.todos : tv.categorias[c]}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="sr-only">{tv.buscar}</span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={`🔍 ${tv.buscar}`}
              className="w-full rounded-full border border-borde bg-papel px-4 py-2.5 text-base outline-none focus:border-lavanda-fuerte"
            />
          </label>

          {lista.length === 0 ? (
            <p className="rounded-2xl bg-papel px-4 py-3 text-tinta-suave">{tv.sinResultados}</p>
          ) : (
            <ul className="space-y-2">
              {lista.map((v) => {
                const actual = v.id === sel.id;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => elegir(v.id)}
                      aria-current={actual}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition ${
                        actual ? "border-lavanda-fuerte bg-lavanda/40" : "border-borde bg-papel hover:border-lavanda"
                      }`}
                    >
                      <span className="relative block aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-borde sm:w-40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={miniatura(v.id)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        <span className="absolute bottom-1 right-1 rounded-full bg-tinta/85 px-1.5 text-xs text-crema">{v.duracion}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base leading-snug">{v.titulo}</span>
                        <span className="mt-1 block text-sm text-tinta-suave">
                          {actual && <IconoPlay className="mr-1 h-3.5 w-3.5 align-[-0.1em] text-lavanda-fuerte" />}
                          {tv.categorias[v.categoria]}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
