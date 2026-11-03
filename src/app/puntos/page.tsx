"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TarjetaPunto from "@/components/TarjetaPunto";
import { categorias, coincide, niveles, puntos, tx } from "@/lib/puntos";
import { useIdioma } from "@/components/Idioma";
import { textosPuntos } from "@/lib/textos-puntos";
import { textosDiagramas } from "@/lib/diagramas";

export default function PaginaPuntos() {
  const { idioma } = useIdioma();
  const k = textosPuntos[idioma].puntos;
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [nivel, setNivel] = useState<number | null>(null);

  const resultado = useMemo(
    () =>
      puntos.filter(
        (p) =>
          (!categoria || p.category === categoria) &&
          (!nivel || p.difficulty === nivel) &&
          coincide(p, texto),
      ),
    [texto, categoria, nivel],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">{k.titulo}</h1>
        <p className="text-tinta-suave">{k.sub(puntos.length)}</p>
        <Link href="/puntadas" className="mt-2 inline-block text-sm text-lavanda-fuerte underline">
          {k.enlace3d}
        </Link>
        <Link href="/diagramas" className="mt-2 block text-sm text-lavanda-fuerte underline">
          {textosDiagramas[idioma].enlace}
        </Link>
      </header>

      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={k.buscar}
        aria-label={k.buscar}
        className="w-full rounded-full border border-borde bg-papel px-5 py-3 outline-none focus:border-lavanda-fuerte"
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setCategoria(null)}
          className={`chip shrink-0 ${!categoria ? "!border-lavanda !bg-lavanda" : ""}`}
        >
          {k.todos}
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoria(categoria === c.id ? null : c.id)}
            className={`chip shrink-0 ${categoria === c.id ? "!border-lavanda !bg-lavanda" : ""}`}
          >
            {tx(c.name, idioma)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {niveles.map((n) => (
          <button
            key={n.nivel}
            onClick={() => setNivel(nivel === n.nivel ? null : n.nivel)}
            className={`chip ${nivel === n.nivel ? "!border-rosa !bg-rosa" : ""}`}
          >
            {tx(n.nombre, idioma)}
          </button>
        ))}
      </div>

      {resultado.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {resultado.map((p) => (
            <TarjetaPunto key={p.id} punto={p} />
          ))}
        </div>
      ) : (
        <p className="tarjeta p-8 text-center text-tinta-suave">
          {k.vacio}
        </p>
      )}
    </div>
  );
}
