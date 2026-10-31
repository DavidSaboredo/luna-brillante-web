"use client";

import { useState } from "react";
import { useIdioma } from "@/components/Idioma";
import Contador from "@/components/Contador";
import CalculadoraLana from "@/components/CalculadoraLana";
import Terminos from "@/components/Terminos";
import CopiaSeguridad from "@/components/CopiaSeguridad";

const PESTANAS = ["contador", "lana", "terminos"] as const;

export default function Herramientas() {
  const { t } = useIdioma();
  const [activa, setActiva] = useState<(typeof PESTANAS)[number]>("contador");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-4xl">{t.herr.titulo}</h1>
        <p className="mt-1 max-w-2xl text-tinta-suave">{t.herr.texto}</p>
      </header>

      <div role="tablist" className="flex gap-1 rounded-full border border-borde bg-papel p-1">
        {PESTANAS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={activa === p}
            onClick={() => setActiva(p)}
            className={`flex-1 rounded-full px-3 py-2 text-sm ${activa === p ? "bg-lavanda text-tinta" : "text-tinta-suave"}`}
          >
            {t.herr.pestanas[p]}
          </button>
        ))}
      </div>

      {activa === "contador" && <Contador />}
      {activa === "lana" && <CalculadoraLana />}
      {activa === "terminos" && <Terminos />}

      <CopiaSeguridad />
    </div>
  );
}
