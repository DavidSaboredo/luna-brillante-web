"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TarjetaPunto from "@/components/TarjetaPunto";
import { categorias, coincide, niveles, puntos } from "@/lib/puntos";

export default function PaginaPuntos() {
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
        <h1 className="text-4xl">Puntos</h1>
        <p className="text-tinta-suave">{puntos.length} puntos con foto, diagrama y paso a paso</p>
        <Link href="/puntadas" className="mt-2 inline-block text-sm text-lavanda-fuerte underline">
          🧵 Mirá cómo se enlaza el hilo en 3D →
        </Link>
      </header>

      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar: concha, puff, vareta, granny…"
        className="w-full rounded-full border border-borde bg-papel px-5 py-3 outline-none focus:border-lavanda-fuerte"
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setCategoria(null)}
          className={`chip shrink-0 ${!categoria ? "!border-lavanda !bg-lavanda" : ""}`}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoria(categoria === c.id ? null : c.id)}
            className={`chip shrink-0 ${categoria === c.id ? "!border-lavanda !bg-lavanda" : ""}`}
          >
            {c.name.es}
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
            {n.nombre}
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
          No encontramos puntos con esa búsqueda. ¿Y si se lo preguntas a Luna IA? ✦
        </p>
      )}
    </div>
  );
}
