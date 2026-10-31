"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { IDIOMAS, textos, type Idioma, type Textos } from "@/lib/textos";

type Ctx = { idioma: Idioma; t: Textos; cambiar: (i: Idioma) => void };
const Contexto = createContext<Ctx>({ idioma: "es", t: textos.es, cambiar: () => {} });

export function ProveedorIdioma({ children }: { children: React.ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("es");

  useEffect(() => {
    try {
      const guardado = localStorage.getItem("idioma");
      const inicial =
        IDIOMAS.find((i) => i.id === guardado)?.id ?? IDIOMAS.find((i) => navigator.language.startsWith(i.id))?.id ?? "es";
      setIdioma(inicial);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  const cambiar = (i: Idioma) => {
    setIdioma(i);
    try {
      localStorage.setItem("idioma", i);
    } catch {}
  };

  return <Contexto.Provider value={{ idioma, t: textos[idioma], cambiar }}>{children}</Contexto.Provider>;
}

export const useIdioma = () => useContext(Contexto);

export function SelectorIdioma() {
  const { idioma, cambiar, t } = useIdioma();
  return (
    <div role="group" aria-label={t.nav.idioma} className="flex rounded-full border border-borde bg-papel p-0.5 text-sm">
      {IDIOMAS.map((i) => (
        <button
          key={i.id}
          onClick={() => cambiar(i.id)}
          aria-pressed={idioma === i.id}
          title={i.nombre}
          className={`rounded-full px-3 py-2 ${idioma === i.id ? "bg-lavanda-fuerte text-white" : "text-tinta-suave"}`}
        >
          {i.corto}
        </button>
      ))}
    </div>
  );
}
