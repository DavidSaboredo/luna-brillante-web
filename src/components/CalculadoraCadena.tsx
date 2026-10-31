"use client";

import { useState } from "react";
import { calcularCadenaBase, type Punto } from "@/lib/puntos";
import { textosPuntos } from "@/lib/textos-puntos";
import { useIdioma } from "./Idioma";

/** Calcula cuántas cadenetas montar para un ancho, respetando el múltiplo del punto. */
export default function CalculadoraCadena({ punto }: { punto: Punto }) {
  const { idioma } = useIdioma();
  const k = textosPuntos[idioma];
  const c = k.calc;
  const [ancho, setAncho] = useState("40");
  const [muestra, setMuestra] = useState("18");
  const r = calcularCadenaBase(punto, Number(ancho), Number(muestra));

  return (
    <div className="tarjeta space-y-3 p-5">
      <h2 className="text-2xl">{c.titulo}</h2>
      <p className="text-sm text-tinta-suave">
        {c.lleva(k.puntos.multiplo(punto.repeat!.multiple, punto.repeat!.plus).toLowerCase())}
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="space-y-1">
          <span className="text-tinta-suave">{c.ancho}</span>
          <input
            type="number"
            min="1"
            inputMode="decimal"
            value={ancho}
            onChange={(e) => setAncho(e.target.value)}
            className="w-full rounded-xl border border-borde px-3 py-2 outline-none focus:border-lavanda-fuerte"
          />
        </label>
        <label className="space-y-1">
          <span className="text-tinta-suave">{c.muestra}</span>
          <input
            type="number"
            min="1"
            inputMode="decimal"
            value={muestra}
            onChange={(e) => setMuestra(e.target.value)}
            className="w-full rounded-xl border border-borde px-3 py-2 outline-none focus:border-lavanda-fuerte"
          />
        </label>
      </div>
      {r ? (
        <p className="rounded-xl bg-menta/50 p-3">
          {c.monta(r.cadenas, r.repeticiones, punto.repeat!.multiple, punto.repeat!.plus, r.anchoReal.toFixed(1))}
        </p>
      ) : (
        <p className="text-sm text-tinta-suave">{c.completa}</p>
      )}
    </div>
  );
}
