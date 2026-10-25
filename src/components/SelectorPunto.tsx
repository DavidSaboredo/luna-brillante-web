"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Nivel } from "./TarjetaPunto";
import { categorias, coincide, nombreCategoria, puntosParaPrenda, rutaIlustracion, textoRepeticion } from "@/lib/puntos";

const CATEGORIAS_PRENDA = categorias.filter((c) => puntosParaPrenda.some((p) => p.category === c.id));

/** Lista buscable de puntos de la biblioteca, empezando por los sugeridos para la zona. */
export default function SelectorPunto({
  sugeridas,
  seleccionado,
  onElegir,
}: {
  sugeridas: string[];
  seleccionado?: string;
  onElegir: (id: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<string>("sugeridos");

  const lista = useMemo(
    () =>
      puntosParaPrenda.filter((p) => {
        if (texto.trim()) return coincide(p, texto);
        if (filtro === "sugeridos") return sugeridas.includes(p.category);
        return filtro === "todos" || p.category === filtro;
      }),
    [texto, filtro, sugeridas],
  );

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar punto…"
        className="w-full rounded-xl border border-borde px-4 py-2.5 text-sm outline-none focus:border-lavanda-fuerte"
      />
      {!texto.trim() && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 text-xs">
          {[{ id: "sugeridos", nombre: "✦ Sugeridos" }, { id: "todos", nombre: "Todos" }]
            .concat(CATEGORIAS_PRENDA.map((c) => ({ id: c.id, nombre: c.name.es })))
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setFiltro(c.id)}
                className={`chip shrink-0 !py-1 !text-xs ${filtro === c.id ? "!border-lavanda !bg-lavanda" : ""}`}
              >
                {c.nombre}
              </button>
            ))}
        </div>
      )}
      <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {lista.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onElegir(p.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm transition ${
                seleccionado === p.id ? "border-lavanda-fuerte bg-lavanda/30" : "border-borde hover:bg-crema"
              }`}
            >
              {rutaIlustracion(p) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rutaIlustracion(p)!} alt="" loading="lazy" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
              )}
              <span className="flex-1">
                <span className="block font-semibold">{p.name.es}</span>
                <span className="text-xs text-tinta-suave">
                  {nombreCategoria(p.category)}
                  {p.repeat && ` · ${textoRepeticion(p)}`}
                </span>
              </span>
              <Nivel nivel={p.difficulty} />
            </button>
          </li>
        ))}
        {!lista.length && <li className="p-3 text-sm text-tinta-suave">No hay puntos con ese nombre.</li>}
      </ul>
      {seleccionado && (
        <Link href={`/puntos/${seleccionado}`} className="block text-xs text-lavanda-fuerte">
          Ver cómo se teje este punto →
        </Link>
      )}
    </div>
  );
}
