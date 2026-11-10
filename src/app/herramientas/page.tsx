"use client";

import { useState } from "react";
import { useIdioma } from "@/components/Idioma";
import Contador from "@/components/Contador";
import CalculadoraLana from "@/components/CalculadoraLana";
import Terminos from "@/components/Terminos";
import Guias from "@/components/Guias";
import CopiaSeguridad from "@/components/CopiaSeguridad";

const PESTANAS = ["contador", "lana", "terminos", "guias"] as const;

export default function Herramientas() {
  const { t } = useIdioma();
  const [activa, setActiva] = useState<(typeof PESTANAS)[number]>("contador");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-4xl">{t.herr.titulo}</h1>
        <p className="mt-1 max-w-2xl text-tinta-suave">{t.herr.texto}</p>
      </header>

      <div role="tablist" className="grid grid-cols-4 gap-1 rounded-full border border-borde bg-papel p-1">
        {PESTANAS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={activa === p}
            onClick={() => setActiva(p)}
            className={`min-w-0 rounded-full px-1 py-2 text-xs min-[380px]:px-3 min-[380px]:text-sm ${activa === p ? "bg-lavanda text-tinta" : "text-tinta-suave"}`}
          >
            {t.herr.pestanas[p]}
          </button>
        ))}
      </div>

      <p className="rounded-2xl bg-papel px-4 py-3 text-sm">{t.herr.ayuda[activa]}</p>

      {activa === "contador" && <Contador />}
      {activa === "lana" && <CalculadoraLana />}
      {activa === "terminos" && <Terminos />}
      {activa === "guias" && <Guias />}

      <CopiaSeguridad />
    </div>
  );
}
