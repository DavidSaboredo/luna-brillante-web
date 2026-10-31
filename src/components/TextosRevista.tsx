"use client";

import Link from "next/link";
import { useIdioma } from "./Idioma";

export function EncabezadoRevista({ fuente }: { fuente: string }) {
  const { t } = useIdioma();
  return (
    <header>
      <h1 className="text-4xl">{t.revista.titulo}</h1>
      <p className="text-tinta-suave">{fuente}</p>
      <p className="mt-2 max-w-2xl">{t.revista.intro}</p>
    </header>
  );
}

export function EnlaceGuia() {
  const { t } = useIdioma();
  return (
    <Link href="/guia" className="tarjeta flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-manteca text-2xl">📖</span>
      <span>
        <span className="block font-titulo text-2xl font-semibold">{t.revista.guiaTitulo}</span>
        <span className="text-sm text-tinta-suave">{t.revista.guiaTexto}</span>
      </span>
    </Link>
  );
}
