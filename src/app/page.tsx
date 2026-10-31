"use client";

import Link from "next/link";
import LogoLuna from "@/components/LogoLuna";
import TarjetaPunto from "@/components/TarjetaPunto";
import { buscarPunto, puntos } from "@/lib/puntos";
import { useIdioma } from "@/components/Idioma";

const DESTACADOS = ["shell_stitch", "puff_stitch", "v_stitch", "granny_square"]
  .map(buscarPunto)
  .filter((p) => p !== undefined);


export default function Inicio() {
  const { t } = useIdioma();
  const SECCIONES = [
    { href: "/herramientas", titulo: t.nav.herramientas, texto: t.inicio.herrTexto, icono: "✚", fondo: "bg-menta" },
    { href: "/puntos", titulo: t.nav.puntos, texto: t.inicio.puntosTexto(puntos.length), icono: "✿", fondo: "bg-rosa" },
    { href: "/proyectos", titulo: t.nav.revista, texto: t.inicio.revistaTexto, icono: "❀", fondo: "bg-manteca" },
    { href: "/crear", titulo: t.nav.crear, texto: t.inicio.crearTexto, icono: "✂", fondo: "bg-lavanda" },
  ];
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-lavanda via-rosa to-manteca p-7 md:p-12">
        <div className="absolute -right-6 -top-6 opacity-60 md:right-8 md:top-6">
          <LogoLuna size={140} />
        </div>
        <p className="text-sm tracking-[0.3em] text-tinta-suave">{t.inicio.bienvenida}</p>
        <h1 className="mt-2 max-w-md text-5xl leading-[1.05] md:text-6xl">{t.inicio.titulo}</h1>
        <p className="mt-3 max-w-md">
          {t.inicio.texto}
        </p>
        <Link
          href="/herramientas"
          className="mt-6 inline-block rounded-full bg-tinta px-6 py-3 text-sm text-crema transition hover:opacity-90"
        >
          ✚ {t.inicio.boton}
        </Link>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SECCIONES.map((s) => (
          <Link key={s.href} href={s.href} className="tarjeta flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${s.fondo}`}>
              {s.icono}
            </span>
            <span>
              <span className="block font-titulo text-2xl font-semibold">{s.titulo}</span>
              <span className="text-sm text-tinta-suave">{s.texto}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl">{t.inicio.empezar}</h2>
          <Link href="/puntos" className="text-sm text-lavanda-fuerte">
            {t.inicio.verTodos}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {DESTACADOS.map((p) => (
            <TarjetaPunto key={p.id} punto={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
