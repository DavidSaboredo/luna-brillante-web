"use client";

import { useState } from "react";
import { calcularCadenaBase, textoRepeticion, type Punto } from "@/lib/puntos";

/** Calcula cuántas cadenetas montar para un ancho, respetando el múltiplo del punto. */
export default function CalculadoraCadena({ punto }: { punto: Punto }) {
  const [ancho, setAncho] = useState("40");
  const [muestra, setMuestra] = useState("18");
  const r = calcularCadenaBase(punto, Number(ancho), Number(muestra));

  return (
    <div className="tarjeta space-y-3 p-5">
      <h2 className="text-2xl">Calculadora de cadena base</h2>
      <p className="text-sm text-tinta-suave">
        Este punto lleva {textoRepeticion(punto)?.toLowerCase()} cadenetas.
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="space-y-1">
          <span className="text-tinta-suave">Ancho que quieres (cm)</span>
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
          <span className="text-tinta-suave">Puntos en 10 cm (tu muestra)</span>
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
          Monta <strong>{r.cadenas} cadenetas</strong> ({r.repeticiones} repeticiones de {punto.repeat!.multiple}
          {punto.repeat!.plus ? ` + ${punto.repeat!.plus}` : ""}). Quedará de unos {r.anchoReal.toFixed(1)} cm.
        </p>
      ) : (
        <p className="text-sm text-tinta-suave">Completa ambos valores para calcular.</p>
      )}
    </div>
  );
}
