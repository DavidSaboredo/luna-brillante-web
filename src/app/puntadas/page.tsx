"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { OpcionesVista } from "@/components/Puntadas3D";
import { PUNTADAS, type ParamsMuestra, type TipoPuntada } from "@/lib/hilo3d";
import { buscarPunto } from "@/lib/puntos";
import { COLORES } from "@/lib/taller";

const Puntadas3D = dynamic(() => import("@/components/Puntadas3D"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-tinta-suave">Tejiendo en 3D…</div>,
});

export default function PaginaPuntadas() {
  return (
    <Suspense>
      <Visor />
    </Suspense>
  );
}

function Deslizador({
  titulo,
  valor,
  min,
  max,
  paso,
  onCambiar,
  formato,
}: {
  titulo: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  onCambiar: (v: number) => void;
  formato?: (v: number) => string;
}) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-tinta-suave">
        <span>{titulo}</span>
        <span>{formato ? formato(valor) : valor}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onCambiar(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--color-lavanda-fuerte)]"
      />
    </label>
  );
}

function Colores({ valor, onElegir }: { valor: string; onElegir: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORES.map((c) => (
        <button
          key={c.hex}
          title={c.nombre}
          aria-label={c.nombre}
          onClick={() => onElegir(c.hex)}
          className={`h-7 w-7 rounded-full border-2 transition ${valor === c.hex ? "scale-110 border-lavanda-fuerte" : "border-papel shadow"}`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

function Visor() {
  const params = useSearchParams();
  const visor = useRef<HTMLDivElement>(null);
  const inicial = PUNTADAS.find((p) => p.id === params.get("tipo") || p.punto === params.get("punto"))?.id ?? "bajo";
  const [tipo, setTipo] = useState<TipoPuntada>(inicial);
  const [filas, setFilas] = useState(5);
  const [columnas, setColumnas] = useState(7);
  const [grosor, setGrosor] = useState(0.115);
  const [tension, setTension] = useState(0.5);
  const [separacion, setSeparacion] = useState(0);
  const [vista, setVista] = useState<OpcionesVista>({
    colorA: COLORES[9].hex,
    colorB: COLORES[6].hex,
    bicolor: true,
    relieve: true,
    intensidadRelieve: 1.6,
    alambre: false,
    girar: false,
  });

  const info = PUNTADAS.find((p) => p.id === tipo)!;
  const punto = buscarPunto(info.punto);
  const muestra = useMemo<ParamsMuestra>(
    () => ({ tipo, filas, columnas, grosor, tension, separacion }),
    [tipo, filas, columnas, grosor, tension, separacion],
  );
  const cambiar = (c: Partial<OpcionesVista>) => setVista((v) => ({ ...v, ...c }));

  const descargar = () => {
    const lienzo = visor.current?.querySelector("canvas");
    if (!lienzo) return;
    const a = document.createElement("a");
    a.download = `puntada-${tipo}.png`;
    a.href = lienzo.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl">Puntadas en 3D</h1>
        <p className="max-w-2xl text-tinta-suave">
          Mirá cómo el hilo se enlaza: cada puntada es un hilo retorcido que atraviesa la lazada de la hilera de abajo.
          Acercate con la rueda y girá la muestra para ver las lazadas por detrás.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PUNTADAS.map((p) => (
          <button key={p.id} onClick={() => setTipo(p.id)} className={`chip ${p.id === tipo ? "!bg-lavanda !border-lavanda" : ""}`}>
            {p.nombre}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <div className="tarjeta relative overflow-hidden">
            <div ref={visor} className="h-[440px] w-full touch-none md:h-[600px]">
              <Puntadas3D muestra={muestra} vista={vista} />
            </div>
            <div className="absolute right-3 top-3 flex flex-col gap-1.5 text-xs">
              <button onClick={() => cambiar({ girar: !vista.girar })} className="rounded-full bg-papel/90 px-3 py-1 shadow-sm hover:bg-papel">
                {vista.girar ? "Parar giro" : "Girar sola"}
              </button>
              <button onClick={descargar} className="rounded-full bg-papel/90 px-3 py-1 shadow-sm hover:bg-papel">
                Descargar imagen
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-tinta-suave">Arrastrá para girar · rueda o pellizco para acercar</p>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="tarjeta space-y-2 p-5">
            <h2 className="text-2xl">{info.nombre}</h2>
            <p className="text-sm">{info.explicacion}</p>
            {punto && (
              <Link href={`/puntos/${punto.id}`} className="inline-block text-sm text-lavanda-fuerte underline">
                Ver el paso a paso →
              </Link>
            )}
          </div>

          <div className="tarjeta space-y-4 p-5">
            <h2 className="text-xl">Muestra</h2>
            {tipo !== "cadena" && (
              <Deslizador titulo="Hileras" valor={filas} min={2} max={10} paso={1} onCambiar={setFilas} />
            )}
            <Deslizador titulo={tipo === "cadena" ? "Eslabones (÷2)" : "Puntadas por hilera"} valor={columnas} min={3} max={14} paso={1} onCambiar={setColumnas} />
            <Deslizador titulo="Grosor del hilo" valor={grosor} min={0.07} max={0.18} paso={0.005} onCambiar={setGrosor} formato={(v) => `${Math.round(v * 100) / 10} mm`} />
            <Deslizador titulo="Tensión" valor={tension} min={0} max={1} paso={0.05} onCambiar={setTension} formato={(v) => (v < 0.35 ? "floja" : v > 0.7 ? "apretada" : "pareja")} />
            {tipo !== "cadena" && (
              <Deslizador titulo="Separar hileras" valor={separacion} min={0} max={1} paso={0.05} onCambiar={setSeparacion} formato={(v) => (v ? `${Math.round(v * 100)}%` : "juntas")} />
            )}
          </div>

          <div className="tarjeta space-y-4 p-5">
            <h2 className="text-xl">Hilo y luz</h2>
            <div>
              <p className="mb-1.5 text-sm text-tinta-suave">Color del hilo</p>
              <Colores valor={vista.colorA} onElegir={(colorA) => cambiar({ colorA })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vista.bicolor} onChange={(e) => cambiar({ bicolor: e.target.checked })} className="accent-[var(--color-lavanda-fuerte)]" />
              Hileras en dos colores (se ve mejor el enlace)
            </label>
            {vista.bicolor && (
              <div>
                <p className="mb-1.5 text-sm text-tinta-suave">Segundo color</p>
                <Colores valor={vista.colorB} onElegir={(colorB) => cambiar({ colorB })} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vista.relieve} onChange={(e) => cambiar({ relieve: e.target.checked })} className="accent-[var(--color-lavanda-fuerte)]" />
              Relieve del hilo (normal map)
            </label>
            {vista.relieve && (
              <Deslizador titulo="Fuerza del relieve" valor={vista.intensidadRelieve} min={0.2} max={3} paso={0.1} onCambiar={(intensidadRelieve) => cambiar({ intensidadRelieve })} />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vista.alambre} onChange={(e) => cambiar({ alambre: e.target.checked })} className="accent-[var(--color-lavanda-fuerte)]" />
              Ver la malla (alambre)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
