"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoLuna from "./LogoLuna";

const SECCIONES = [
  { href: "/", label: "Inicio", icono: "☾" },
  { href: "/puntos", label: "Puntos", icono: "✿" },
  { href: "/proyectos", label: "Revista", icono: "❀" },
  { href: "/crear", label: "Crear prenda", icono: "✂" },
  { href: "/asistente", label: "Luna IA", icono: "✦" },
];

export default function Navegacion() {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  return (
    <>
      {/* Barra superior */}
      <header className="sticky top-0 z-20 border-b border-borde bg-crema/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <LogoLuna size={34} />
            <span className="font-titulo text-xl font-semibold leading-none">
              Luna Brillante
              <span className="block text-xs font-sans font-normal tracking-[0.25em] text-tinta-suave">
                TEJIDOS
              </span>
            </span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {SECCIONES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activa(s.href) ? "bg-lavanda text-tinta" : "text-tinta-suave hover:bg-papel"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Barra inferior en celulares */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-borde bg-papel/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                activa(s.href) ? "text-lavanda-fuerte" : "text-tinta-suave"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full text-lg ${
                  activa(s.href) ? "bg-lavanda" : ""
                }`}
              >
                {s.icono}
              </span>
              {s.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
