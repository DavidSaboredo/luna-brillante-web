"use client";

import { useEffect, useState } from "react";
import { useIdioma } from "./Idioma";

type Proyecto = { id: string; nombre: string; vuelta: number; puntos: number; objetivo: number; nota: string };

const CLAVE = "contador-proyectos";

const nuevoId = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {}
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const vibrar = () => {
  try {
    navigator.vibrate?.(15);
  } catch {}
};

export default function Contador() {
  const { t } = useIdioma();
  const c = t.herr.contador;
  const [lista, setLista] = useState<Proyecto[]>([]);
  const [listo, setListo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [borrando, setBorrando] = useState<string | null>(null);

  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
      if (Array.isArray(guardado)) setLista(guardado);
    } catch {}
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    } catch {}
  }, [lista, listo]);

  const cambiar = (id: string, parche: Partial<Proyecto>) =>
    setLista((l) => l.map((p) => (p.id === id ? { ...p, ...parche } : p)));

  const sumar = (id: string, campo: "vuelta" | "puntos", delta: number) =>
    setLista((l) => l.map((p) => (p.id === id ? { ...p, [campo]: Math.max(0, p[campo] + delta) } : p)));

  const crear = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nombre.trim().slice(0, 60);
    if (!n) return;
    setLista((l) => [{ id: nuevoId(), nombre: n, vuelta: 0, puntos: 0, objetivo: 0, nota: "" }, ...l]);
    setNombre("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={crear} className="tarjeta flex flex-col gap-2 p-4 sm:flex-row">
        <label className="sr-only" htmlFor="nombre-proyecto">
          {c.nombre}
        </label>
        <input
          id="nombre-proyecto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={60}
          placeholder={c.nombreEjemplo}
          className="min-w-0 flex-1 rounded-full border border-borde bg-crema px-4 py-2.5 text-base"
        />
        <button className="rounded-full bg-lavanda-fuerte px-5 py-2.5 text-sm font-semibold text-white">+ {c.crear}</button>
      </form>

      {listo && lista.length === 0 && <p className="text-tinta-suave">{c.vacio}</p>}

      {lista.map((p) => {
        const terminado = p.objetivo > 0 && p.vuelta >= p.objetivo;
        return (
          <article key={p.id} className="tarjeta space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-2xl leading-tight">{p.nombre}</h3>
              {borrando === p.id ? (
                <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                  <span className="text-tinta-suave">{c.confirmarBorrar}</span>
                  <span className="flex gap-2">
                    <button
                      onClick={() => {
                        setLista((l) => l.filter((x) => x.id !== p.id));
                        setBorrando(null);
                      }}
                      className="rounded-full bg-lavanda-fuerte px-4 py-2 font-semibold text-white"
                    >
                      {c.borrar}
                    </button>
                    <button onClick={() => setBorrando(null)} className="rounded-full border border-borde bg-papel px-4 py-2">
                      {c.cancelar}
                    </button>
                  </span>
                </div>
              ) : (
                <button onClick={() => setBorrando(p.id)} className="shrink-0 px-2 py-2 text-sm text-tinta-suave underline">
                  {c.borrar}
                </button>
              )}
            </div>

            <div className="text-center" aria-live="polite">
              <p className="text-xs uppercase tracking-widest text-tinta-suave">{c.vuelta}</p>
              <p className="font-titulo text-7xl font-semibold leading-none">{p.vuelta}</p>
              {p.objetivo > 0 && (
                <p className="mt-1 text-sm text-tinta-suave">
                  {c.de} {p.objetivo}
                </p>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 min-[420px]:flex-row min-[420px]:gap-3">
              <button
                onClick={() => {
                  vibrar();
                  sumar(p.id, "vuelta", -1);
                }}
                className="h-12 flex-1 rounded-full border border-borde bg-papel px-3 text-base font-semibold min-[420px]:h-16"
              >
                − {c.restar}
              </button>
              <button
                onClick={() => {
                  vibrar();
                  sumar(p.id, "vuelta", 1);
                }}
                className="h-16 flex-[1.6] rounded-full bg-lavanda-fuerte px-3 text-lg font-semibold text-white"
              >
                + {c.sumar}
              </button>
            </div>

            {p.objetivo > 0 && (
              <div className="h-2 overflow-hidden rounded-full bg-crema">
                <div className="h-full bg-lavanda-fuerte" style={{ width: `${Math.min(100, (p.vuelta / p.objetivo) * 100)}%` }} />
              </div>
            )}
            {terminado && <p className="text-center font-semibold text-lavanda-fuerte">{c.terminado}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-crema p-3 text-center">
                <p className="text-xs text-tinta-suave">{c.puntos}</p>
                <div className="mt-1 flex items-center justify-center gap-3">
                  <button aria-label={c.restarPuntos} onClick={() => sumar(p.id, "puntos", -1)} className="h-9 w-9 rounded-full border border-borde bg-papel text-lg">
                    −
                  </button>
                  <span className="w-10 text-xl font-semibold">{p.puntos}</span>
                  <button aria-label={c.sumarPuntos} onClick={() => sumar(p.id, "puntos", 1)} className="h-9 w-9 rounded-full border border-borde bg-papel text-lg">
                    +
                  </button>
                </div>
              </div>
              <label className="rounded-2xl bg-crema p-3 text-center text-xs text-tinta-suave">
                {c.objetivo}
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9999}
                  value={p.objetivo || ""}
                  placeholder="—"
                  onChange={(e) => cambiar(p.id, { objetivo: Math.max(0, Math.min(9999, Number(e.target.value) || 0)) })}
                  className="mt-1 w-full rounded-full border border-borde bg-papel px-3 py-1.5 text-center text-base text-tinta"
                />
              </label>
            </div>

            <label className="block text-xs text-tinta-suave">
              {c.nota}
              <textarea
                value={p.nota}
                onChange={(e) => cambiar(p.id, { nota: e.target.value.slice(0, 500) })}
                placeholder={c.notaEjemplo}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-borde bg-crema px-3 py-2 text-base text-tinta"
              />
            </label>

            <button onClick={() => cambiar(p.id, { vuelta: 0, puntos: 0 })} className="py-2 text-sm text-tinta-suave underline">
              {c.reiniciar}
            </button>
          </article>
        );
      })}
    </div>
  );
}
