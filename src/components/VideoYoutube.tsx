"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useIdioma } from "./Idioma";
import { enlaceYoutube, miniatura, textosVideos, type Video } from "@/lib/videos";

/** Triángulo de "reproducir" dibujado (el carácter ▶ se ve como emoji en Windows y Android). */
export function IconoPlay({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`inline-block shrink-0 ${className}`}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />
    </svg>
  );
}

const ORIGEN_YT = "https://www.youtube-nocookie.com";
/** Tiempo sin noticias del reproductor antes de ofrecer verlo en YouTube. */
const ESPERA_MAXIMA = 12000;

/**
 * Reproductor liviano: muestra la miniatura y recién al tocar reproducir carga YouTube
 * (modo de privacidad mejorada, sin cookies hasta reproducir).
 * Si YouTube no responde o avisa un error (bloqueadores de anuncios, protección contra rastreo),
 * en lugar de un recuadro negro muestra un aviso con el enlace al video en YouTube.
 * Para cambiar de video o de capítulo, el componente padre le cambia la `key`.
 */
export default function ReproductorVideo({
  video,
  etiqueta,
  inicio = 0,
  iniciar = false,
}: {
  video: Video;
  etiqueta: string;
  inicio?: number;
  iniciar?: boolean;
}) {
  const tv = textosVideos[useIdioma().idioma];
  const [activo, setActivo] = useState(iniciar);
  const [intento, setIntento] = useState(0);
  const [falla, setFalla] = useState(false);
  const marco = useRef<HTMLIFrameElement>(null);

  // El reproductor de YouTube (enablejsapi=1) contesta por postMessage cuando está listo o si falla.
  useEffect(() => {
    if (!activo) return;
    let respondio = false;
    const alRecibir = (e: MessageEvent) => {
      if (e.origin !== ORIGEN_YT || e.source !== marco.current?.contentWindow) return;
      let datos: { event?: string } | null = null;
      try {
        datos = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (datos?.event === "onError") {
        respondio = true;
        setFalla(true);
      } else if (datos?.event && !respondio) {
        respondio = true;
        setFalla(false);
      }
    };
    window.addEventListener("message", alRecibir);
    const saludo = window.setInterval(() => {
      if (respondio) return window.clearInterval(saludo);
      marco.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), ORIGEN_YT);
    }, 500);
    const limite = window.setTimeout(() => {
      if (!respondio) setFalla(true);
    }, ESPERA_MAXIMA);
    return () => {
      window.removeEventListener("message", alRecibir);
      window.clearInterval(saludo);
      window.clearTimeout(limite);
    };
  }, [activo, intento]);

  const origen = typeof window === "undefined" ? "" : window.location.origin;
  const src =
    `${ORIGEN_YT}/embed/${video.id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1` +
    `&origin=${encodeURIComponent(origen)}${inicio ? `&start=${inicio}` : ""}`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-tinta">
      {activo ? (
        <>
          <iframe
            key={intento}
            ref={marco}
            src={src}
            title={video.titulo}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
          {falla && (
            <div
              role="alert"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto bg-tinta p-4 text-center text-crema sm:gap-3"
            >
              <p className="font-titulo text-lg font-semibold leading-tight sm:text-xl">{tv.noCarga}</p>
              <p className="max-w-md text-xs leading-snug text-crema/80 sm:text-sm">{tv.noCargaSub}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={enlaceYoutube(video.id, inicio)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-papel px-4 py-2 text-sm font-medium text-tinta"
                >
                  <IconoPlay className="h-4 w-4 text-lavanda-fuerte" />
                  {tv.verEnYoutube} {"↗︎"}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setFalla(false);
                    setIntento((n) => n + 1);
                  }}
                  className="rounded-full border border-crema/40 px-4 py-2 text-sm text-crema"
                >
                  {tv.reintentar}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setActivo(true)}
          aria-label={`${etiqueta}: ${video.titulo}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={miniatura(video.id, true)}
            alt=""
            // Si el video no tiene miniatura grande, YouTube devuelve una gris de 120 px: usamos la común.
            onLoad={(e) => {
              if (e.currentTarget.naturalWidth <= 120) e.currentTarget.src = miniatura(video.id);
            }}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-tinta/60 via-transparent to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-papel/95 text-lavanda-fuerte shadow-lg transition group-hover:scale-105 group-active:scale-95">
            <IconoPlay className="ml-1 h-7 w-7" />
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-tinta/85 px-2.5 py-0.5 text-sm text-crema">{video.duracion}</span>
        </button>
      )}
    </div>
  );
}

/** Tarjeta chica con miniatura, para listas de videos. */
export function TarjetaVideo({ video, href }: { video: Video; href: string }) {
  return (
    <Link href={href} className="tarjeta group block overflow-hidden transition hover:-translate-y-0.5">
      <span className="relative block aspect-video bg-borde">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={miniatura(video.id)} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-papel/90 text-lavanda-fuerte shadow">
          <IconoPlay className="ml-0.5 h-5 w-5" />
        </span>
        <span className="absolute bottom-2 right-2 rounded-full bg-tinta/85 px-2 py-0.5 text-xs text-crema">{video.duracion}</span>
      </span>
      <span className="block p-3 text-base leading-snug">{video.titulo}</span>
    </Link>
  );
}
