"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TarjetaPunto from "@/components/TarjetaPunto";
import { categorias, CATEGORIA_GRANNY, coincide, esGranny, niveles, puntos, tx } from "@/lib/puntos";
import { useIdioma } from "@/components/Idioma";
import { textosPuntos } from "@/lib/textos-puntos";
import { textosDiagramas } from "@/lib/diagramas";

// Los granny son estructuras armadas con puntos: tienen su propia sección y no se mezclan con los puntos sueltos.
const categoriasPuntos = categorias.filter((c) => c.id !== CATEGORIA_GRANNY);
const totalPuntos = puntos.filter((p) => !esGranny(p)).length;

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
  const grannies = resultado.filter(esGranny);
  const sueltos = resultado.filter((p) => !esGranny(p));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">{k.titulo}</h1>
        <p className="text-tinta-suave">{k.sub(totalPuntos)}</p>
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
        {categoriasPuntos.map((c) => (
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

      {grannies.length > 0 && (
        <section aria-labelledby="titulo-granny" className="space-y-4 rounded-[var(--radius-suave)] bg-manteca/60 p-4 md:p-6">
          <div>
            <h2 id="titulo-granny" className="text-3xl">
              {k.granny}
            </h2>
            <p className="mt-1 max-w-2xl text-tinta-suave">{k.grannyTexto}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {grannies.map((p) => (
              <TarjetaPunto key={p.id} punto={p} />
            ))}
          </div>
        </section>
      )}

      {sueltos.length > 0 && (
        <section aria-labelledby={grannies.length ? "titulo-biblioteca" : undefined} className="space-y-4">
          {grannies.length > 0 && (
            <h2 id="titulo-biblioteca" className="text-3xl">
              {k.biblioteca}
            </h2>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {sueltos.map((p) => (
              <TarjetaPunto key={p.id} punto={p} />
            ))}
          </div>
        </section>
      )}

      {!resultado.length && <p className="tarjeta p-8 text-center text-tinta-suave">{k.vacio}</p>}
    </div>
  );
}
