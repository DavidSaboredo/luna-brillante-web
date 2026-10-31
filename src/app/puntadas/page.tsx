"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { OpcionesVista } from "@/components/Puntadas3D";
import { PUNTADAS, type ParamsMuestra, type TipoPuntada } from "@/lib/hilo3d";
import { buscarPunto } from "@/lib/puntos";
import { COLORES } from "@/lib/taller";
import { nom, textosCrear, type ClaveCrear } from "@/lib/textos-crear";
import { useIdioma } from "@/components/Idioma";

const Puntadas3D = dynamic(() => import("@/components/Puntadas3D"), {
  ssr: false,
  loading: () => <Cargando />,
});

function Cargando() {
  const { idioma } = useIdioma();
  return <div className="flex h-full items-center justify-center text-sm text-tinta-suave">{textosCrear[idioma]["pun.cargando"]}</div>;
}

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
  const { idioma } = useIdioma();
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORES.map((c) => (
        <button
          key={c.hex}
          title={nom(c.nombre, idioma)}
          aria-label={nom(c.nombre, idioma)}
          onClick={() => onElegir(c.hex)}
          className={`h-7 w-7 rounded-full border-2 transition ${valor === c.hex ? "scale-110 border-lavanda-fuerte" : "border-papel shadow"}`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

function Visor() {
  const { idioma } = useIdioma();
  const k = (c: ClaveCrear) => textosCrear[idioma][c];
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
        <h1 className="text-4xl">{k("pun.titulo")}</h1>
        <p className="max-w-2xl text-tinta-suave">
          {k("pun.sub")}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PUNTADAS.map((p) => (
          <button key={p.id} onClick={() => setTipo(p.id)} className={`chip ${p.id === tipo ? "!bg-lavanda !border-lavanda" : ""}`}>
            {nom(p.nombre, idioma)}
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
                {vista.girar ? k("pun.parar") : k("pun.girar")}
              </button>
              <button onClick={descargar} className="rounded-full bg-papel/90 px-3 py-1 shadow-sm hover:bg-papel">
                {k("pun.descargar")}
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-tinta-suave">{k("pun.ayuda")}</p>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="tarjeta space-y-2 p-5">
            <h2 className="text-2xl">{nom(info.nombre, idioma)}</h2>
            <p className="text-sm">{nom(info.explicacion, idioma)}</p>
            {punto && (
              <Link href={`/puntos/${punto.id}`} className="inline-block text-sm text-lavanda-fuerte underline">
                {k("pun.verPaso")}
              </Link>
            )}
          </div>

          <div className="tarjeta space-y-4 p-5">
            <h2 className="text-xl">{k("pun.muestra")}</h2>
            {tipo !== "cadena" && (
              <Deslizador titulo={k("pun.hileras")} valor={filas} min={2} max={10} paso={1} onCambiar={setFilas} />
            )}
            <Deslizador titulo={tipo === "cadena" ? k("pun.eslabones") : k("pun.porHilera")} valor={columnas} min={3} max={14} paso={1} onCambiar={setColumnas} />
            <Deslizador titulo={k("pun.grosor")} valor={grosor} min={0.07} max={0.18} paso={0.005} onCambiar={setGrosor} formato={(v) => `${Math.round(v * 100) / 10} mm`} />
            <Deslizador titulo={k("pun.tension")} valor={tension} min={0} max={1} paso={0.05} onCambiar={setTension} formato={(v) => (v < 0.35 ? k("pun.floja") : v > 0.7 ? k("pun.apretada") : k("pun.pareja"))} />
            {tipo !== "cadena" && (
              <Deslizador titulo={k("pun.separar")} valor={separacion} min={0} max={1} paso={0.05} onCambiar={setSeparacion} formato={(v) => (v ? `${Math.round(v * 100)}%` : k("pun.juntas"))} />
            )}
          </div>

          <div className="tarjeta space-y-4 p-5">
            <h2 className="text-xl">{k("pun.hiloLuz")}</h2>
            <div>
              <p className="mb-1.5 text-sm text-tinta-suave">{k("pun.colorHilo")}</p>
              <Colores valor={vista.colorA} onElegir={(colorA) => cambiar({ colorA })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vista.bicolor} onChange={(e) => cambiar({ bicolor: e.target.checked })} className="accent-[var(--color-lavanda-fuerte)]" />
              {k("pun.bicolor")}
            </label>
            {vista.bicolor && (
              <div>
                <p className="mb-1.5 text-sm text-tinta-suave">{k("pun.segundo")}</p>
                <Colores valor={vista.colorB} onElegir={(colorB) => cambiar({ colorB })} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vista.relieve} onChange={(e) => cambiar({ relieve: e.target.checked })} className="accent-[var(--color-lavanda-fuerte)]" />
              {k("pun.relieve")}
            </label>
            {vista.relieve && (
              <Deslizador titulo={k("pun.fuerza")} valor={vista.intensidadRelieve} min={0.2} max={3} paso={0.1} onCambiar={(intensidadRelieve) => cambiar({ intensidadRelieve })} />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vista.alambre} onChange={(e) => cambiar({ alambre: e.target.checked })} className="accent-[var(--color-lavanda-fuerte)]" />
              {k("pun.malla")}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
