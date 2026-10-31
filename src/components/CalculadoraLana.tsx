"use client";

import { useState } from "react";
import { useIdioma } from "./Idioma";

// Metros aproximados con lana de grosor medio, talle M.
const PRENDAS = { bufanda: 250, gorro: 120, chal: 500, manta: 700, top: 650, sueter: 1200, chaqueta: 1400, bolso: 300 } as const;
const TALLES = { S: 0.88, M: 1, L: 1.15, XL: 1.3 } as const;
const GROSORES = { fina: 1.35, media: 1, gruesa: 0.75 } as const;

const campo = "mt-1 w-full rounded-full border border-borde bg-crema px-4 py-2.5 text-base text-tinta";

const num = (v: string) => Math.max(0, Math.min(9999, Number(v.replace(",", ".")) || 0));

export default function CalculadoraLana() {
  const { t } = useIdioma();
  const l = t.herr.lana;

  const [p10, setP10] = useState("");
  const [v10, setV10] = useState("");
  const [ancho, setAncho] = useState("");
  const [largo, setLargo] = useState("");
  const puntos = Math.round((num(p10) / 10) * num(ancho));
  const vueltas = Math.round((num(v10) / 10) * num(largo));

  const [prenda, setPrenda] = useState<keyof typeof PRENDAS>("chal");
  const [talle, setTalle] = useState<keyof typeof TALLES>("M");
  const [grosor, setGrosor] = useState<keyof typeof GROSORES>("media");
  const [porOvillo, setPorOvillo] = useState("100");
  const metros = Math.round((PRENDAS[prenda] * TALLES[talle] * GROSORES[grosor] * 1.1) / 10) * 10;
  const ovillos = num(porOvillo) > 0 ? Math.ceil(metros / num(porOvillo)) : 0;

  return (
    <div className="space-y-5">
      <section className="tarjeta space-y-3 p-5">
        <h3 className="text-2xl">{l.muestraTitulo}</h3>
        <p className="text-sm text-tinta-suave">{l.muestraTexto}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-tinta-suave">
            {l.puntos10}
            <input type="number" inputMode="decimal" min={0} value={p10} onChange={(e) => setP10(e.target.value)} className={campo} />
          </label>
          <label className="text-xs text-tinta-suave">
            {l.vueltas10}
            <input type="number" inputMode="decimal" min={0} value={v10} onChange={(e) => setV10(e.target.value)} className={campo} />
          </label>
          <label className="text-xs text-tinta-suave">
            {l.ancho}
            <input type="number" inputMode="decimal" min={0} value={ancho} onChange={(e) => setAncho(e.target.value)} className={campo} />
          </label>
          <label className="text-xs text-tinta-suave">
            {l.largo}
            <input type="number" inputMode="decimal" min={0} value={largo} onChange={(e) => setLargo(e.target.value)} className={campo} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-lavanda p-3">
            <p className="text-xs">{l.resultadoPuntos}</p>
            <p className="font-titulo text-4xl font-semibold">{puntos || "–"}</p>
          </div>
          <div className="rounded-2xl bg-rosa p-3">
            <p className="text-xs">{l.resultadoVueltas}</p>
            <p className="font-titulo text-4xl font-semibold">{vueltas || "–"}</p>
          </div>
        </div>
      </section>

      <section className="tarjeta space-y-3 p-5">
        <h3 className="text-2xl">{l.lanaTitulo}</h3>
        <p className="text-sm text-tinta-suave">{l.lanaTexto}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-tinta-suave">
            {l.prenda}
            <select value={prenda} onChange={(e) => setPrenda(e.target.value as keyof typeof PRENDAS)} className={campo}>
              {Object.keys(PRENDAS).map((k) => (
                <option key={k} value={k}>
                  {l.prendas[k as keyof typeof PRENDAS]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-tinta-suave">
            {l.talle}
            <select value={talle} onChange={(e) => setTalle(e.target.value as keyof typeof TALLES)} className={campo}>
              {Object.keys(TALLES).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-tinta-suave">
            {l.grosor}
            <select value={grosor} onChange={(e) => setGrosor(e.target.value as keyof typeof GROSORES)} className={campo}>
              {Object.keys(GROSORES).map((k) => (
                <option key={k} value={k}>
                  {l[k as keyof typeof GROSORES]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-tinta-suave">
            {l.metrosOvillo}
            <input type="number" inputMode="numeric" min={1} value={porOvillo} onChange={(e) => setPorOvillo(e.target.value)} className={campo} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-manteca p-3">
            <p className="text-xs">{l.metros}</p>
            <p className="font-titulo text-4xl font-semibold">{metros} m</p>
          </div>
          <div className="rounded-2xl bg-menta p-3">
            <p className="text-xs">{l.ovillos}</p>
            <p className="font-titulo text-4xl font-semibold">{ovillos || "–"}</p>
          </div>
        </div>
        <p className="text-xs text-tinta-suave">{l.incluye}</p>
      </section>
    </div>
  );
}
