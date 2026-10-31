"use client";

import { useState } from "react";
import { useIdioma } from "./Idioma";
import { agujas, terminos } from "@/lib/terminos";

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Terminos() {
  const { t } = useIdioma();
  const k = t.herr.terminos;
  const [q, setQ] = useState("");
  const filtro = sinTildes(q.trim());
  const filas = terminos.filter((x) => !filtro || sinTildes(Object.values(x).join(" ")).includes(filtro));
  const columnas = [
    ["es", k.columnas.es],
    ["en", k.columnas.en],
    ["uk", k.columnas.uk],
    ["pt", k.columnas.pt],
  ] as const;

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-2xl">{k.titulo}</h3>
        <p className="text-sm text-tinta-suave">{k.texto}</p>
        <p className="rounded-2xl bg-manteca p-3 text-sm">{k.aviso}</p>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={k.buscar}
          aria-label={k.buscar}
          className="w-full rounded-full border border-borde bg-papel px-4 py-2.5 text-base"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {filas.map((f) => (
            <dl key={f.es} className="tarjeta grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-4 text-sm">
              {columnas.map(([id, nombre]) => (
                <div key={id} className="contents">
                  <dt className="text-xs text-tinta-suave">{nombre}</dt>
                  <dd className="font-semibold">{f[id]}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
        {filas.length === 0 && <p className="text-tinta-suave">{k.sinResultados}</p>}
      </section>

      <section className="space-y-3">
        <h3 className="text-2xl">{k.agujasTitulo}</h3>
        <div className="tarjeta overflow-hidden">
          <table className="w-full text-center text-sm">
            <thead className="bg-crema text-xs text-tinta-suave">
              <tr>
                <th className="p-2">{k.mm}</th>
                <th className="p-2">{k.us}</th>
              </tr>
            </thead>
            <tbody>
              {agujas.map((a) => (
                <tr key={a.mm} className="border-t border-borde">
                  <td className="p-2">{a.mm} mm</td>
                  <td className="p-2">{a.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
