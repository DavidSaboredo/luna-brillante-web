"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { patronPlano } from "@/lib/patrones2d";
import { crearTextura } from "@/lib/texturas3d";
import { contexto, infoMaterial, type EleccionZona, type Opciones, type Prenda } from "@/lib/taller";

interface Props {
  prenda: Prenda;
  opciones: Opciones;
  zonas: Record<string, EleccionZona>;
  zonaActiva?: string;
  onElegirZona: (id: string) => void;
  /** "textura" pinta como se ve el tejido; "diagrama" repite el diagrama real del punto */
  relleno: "textura" | "diagrama";
  puntosEn10: number;
  hilerasEn10: number;
}

const MARGEN = 10;

export default function Patron2D({ prenda, opciones, zonas, zonaActiva, onElegirZona, relleno, puntosEn10, hilerasEn10 }: Props) {
  const ctx = useMemo(() => contexto(prenda, opciones), [prenda, opciones]);
  const plano = useMemo(() => patronPlano(prenda, ctx), [prenda, ctx]);
  const [vista, setVista] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState<string | null>(null);
  const arrastre = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const base = useMemo(() => {
    const w = plano.ancho + MARGEN * 2,
      h = plano.alto + MARGEN * 2 + 12;
    return { w, h };
  }, [plano]);

  // al cambiar de prenda o de talle, se encuadra de nuevo
  useEffect(() => setVista({ x: 0, y: 0, k: 1 }), [prenda.id, opciones.talle]);

  const dataUrls = useMemo(() => {
    const m: Record<string, { textura?: string; tam: number }> = {};
    for (const z of prenda.zonas) {
      const e = zonas[z.id];
      const info = e && infoMaterial(e.material);
      if (!info) continue;
      try {
        const t = crearTextura(info.textura, e.color);
        m[z.id] = { textura: (t.map.image as HTMLCanvasElement).toDataURL("image/png"), tam: t.tamCm };
      } catch {
        m[z.id] = { tam: 4 };
      }
    }
    return m;
  }, [prenda, zonas]);

  const aplicar = (dx: number, dy: number) => {
    const el = svg.current;
    if (!el) return { dx: 0, dy: 0 };
    const r = el.getBoundingClientRect();
    return { dx: (dx / r.width) * (base.w / vista.k), dy: (dy / r.height) * (base.h / vista.k) };
  };

  const vb = `${f(vista.x - 0)} ${f(vista.y - 0)} ${f(base.w / vista.k)} ${f(base.h / vista.k)}`;
  function f(n: number) {
    return Math.round(n * 100) / 100;
  }

  return (
    <div className="relative h-full w-full select-none overflow-hidden" style={{ background: "#f4f7fb" }}>
      <svg
        ref={svg}
        viewBox={vb}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
        onWheel={(e) => {
          const k = Math.min(6, Math.max(0.6, vista.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
          setVista((v) => ({ ...v, k }));
        }}
        onPointerDown={(e) => {
          arrastre.current = { x: e.clientX, y: e.clientY, vx: vista.x, vy: vista.y };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!arrastre.current) return;
          const { dx, dy } = aplicar(e.clientX - arrastre.current.x, e.clientY - arrastre.current.y);
          setVista((v) => ({ ...v, x: arrastre.current!.vx - dx, y: arrastre.current!.vy - dy }));
        }}
        onPointerUp={() => (arrastre.current = null)}
        onPointerLeave={() => (arrastre.current = null)}
      >
        <defs>
          <pattern id="g1" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M1 0H0V1" fill="none" stroke="#c9d6e6" strokeWidth="0.04" />
          </pattern>
          <pattern id="g10" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="url(#g1)" />
            <path d="M10 0H0V10" fill="none" stroke="#a9bbd3" strokeWidth="0.1" />
          </pattern>
          {prenda.zonas.map((z) => {
            const e = zonas[z.id];
            const info = e && infoMaterial(e.material);
            if (!info) return null;
            const d = dataUrls[z.id];
            if (relleno === "diagrama" && info.punto) {
              return (
                <pattern key={z.id} id={`rel-${z.id}`} width="9" height="6.5" patternUnits="userSpaceOnUse">
                  <rect width="9" height="6.5" fill={e.color} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <image href={`/diagramas/${info.punto.diagram.file.split("/").pop()}`} x="0.3" y="0.3" width="8.4" height="5.9" preserveAspectRatio="xMidYMid meet" opacity="0.85" />
                </pattern>
              );
            }
            return (
              <pattern key={z.id} id={`rel-${z.id}`} width={d?.tam ?? 4} height={d?.tam ?? 4} patternUnits="userSpaceOnUse">
                <rect width={d?.tam ?? 4} height={d?.tam ?? 4} fill={e.color} />
                {d?.textura && <image href={d.textura} width={d.tam} height={d.tam} />}
              </pattern>
            );
          })}
          <marker id="flecha" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#4a4458" />
          </marker>
        </defs>

        <rect x={-500} y={-500} width={1500} height={1500} fill="url(#g10)" />

        <g transform={`translate(${MARGEN} ${MARGEN})`}>
          {plano.piezas.map((p) => {
            const e = zonas[p.zona];
            const info = e && infoMaterial(e.material);
            const activa = zonaActiva === p.zona;
            const hov = hover === p.zona;
            const pts = Math.round((p.pieza.ancho * puntosEn10) / 10);
            const hil = Math.round((p.pieza.alto * hilerasEn10) / 10);
            return (
              <g
                key={p.clave}
                transform={`translate(${p.x} ${p.y})`}
                className="cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onElegirZona(p.zona);
                }}
                onPointerEnter={() => setHover(p.zona)}
                onPointerLeave={() => setHover(null)}
              >
                <title>{`${p.pieza.nombre} · ${p.pieza.ancho} × ${p.pieza.alto} cm`}</title>
                <path d={p.d} transform="translate(0.7 0.9)" fill="#4a4458" opacity="0.12" />
                <path
                  d={p.d}
                  fill={info ? `url(#rel-${p.zona})` : "#ffffff"}
                  fillOpacity={info ? 1 : 0.9}
                  stroke={activa ? "#6a58a8" : hov ? "#8e7cc3" : "#4a4458"}
                  strokeWidth={activa ? 0.55 : 0.3}
                  strokeLinejoin="round"
                  strokeDasharray={info ? undefined : "1.2 0.9"}
                />
                {p.guias.map((g, i) => (
                  <path key={i} d={g} fill="none" stroke="#4a4458" strokeOpacity="0.35" strokeWidth="0.18" strokeDasharray="1 0.8" />
                ))}
                {/* dirección de las hileras */}
                {p.h > 14 && p.w > 8 && (
                  <path d={`M${f(p.w * 0.5)} ${f(p.h * 0.82)} V${f(p.h * 0.5)}`} stroke="#4a4458" strokeWidth="0.35" markerEnd="url(#flecha)" opacity="0.7" />
                )}
                {p.cortada && (
                  <path d={`M${f(p.w * 0.1)} ${f(p.h * 0.55)} l${f(p.w * 0.1)} -1.6 l${f(p.w * 0.1)} 3.2 l${f(p.w * 0.1)} -3.2`} fill="none" stroke="#4a4458" strokeWidth="0.35" />
                )}
                {/* etiqueta */}
                <g transform={`translate(${f(p.w / 2)} ${f(Math.min(p.h * 0.3, p.h - 4))})`}>
                  <rect x={-Math.min(p.w / 2 - 0.4, 15)} y={-3.4} width={Math.min(p.w - 0.8, 30)} height={p.w > 14 ? 8.6 : 5} rx="0.8" fill="#ffffff" fillOpacity="0.88" />
                  <text textAnchor="middle" y={0.4} fontSize={p.w > 14 ? 3 : 2} fill="#4a4458" fontWeight={600}>
                    {p.pieza.nombre}
                    {p.pieza.cantidad > 1 ? ` ×${p.pieza.cantidad}` : ""}
                  </text>
                  {p.w > 14 && (
                    <text textAnchor="middle" y={3.4} fontSize="2.3" fill="#6c6580">
                      {pts} pts × {hil} hil.
                    </text>
                  )}
                </g>
                {/* cotas */}
                <path d={`M0 ${f(p.h + 2)} H${f(p.w)}`} stroke="#6c6580" strokeWidth="0.15" markerStart="url(#flecha)" markerEnd="url(#flecha)" />
                <text x={f(p.w / 2)} y={f(p.h + 4.6)} textAnchor="middle" fontSize="1.9" fill="#6c6580">
                  {p.pieza.ancho} cm
                </text>
                <text x={-1.6} y={f(p.h / 2)} textAnchor="middle" fontSize="1.9" fill="#6c6580" transform={`rotate(-90 -1.6 ${f(p.h / 2)})`}>
                  {p.cortada ? `${p.pieza.alto} cm ≈` : `${p.pieza.alto} cm`}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-papel/90 px-3 py-1 text-xs shadow-sm">Patrón plano · cuadrícula 1 cm</div>
      <div className="absolute bottom-3 right-3 flex gap-1.5 text-xs">
        <button onClick={() => setVista((v) => ({ ...v, k: Math.min(6, v.k * 1.25) }))} className="rounded-full bg-papel/90 px-3 py-1 shadow-sm hover:bg-papel">
          ＋
        </button>
        <button onClick={() => setVista((v) => ({ ...v, k: Math.max(0.6, v.k / 1.25) }))} className="rounded-full bg-papel/90 px-3 py-1 shadow-sm hover:bg-papel">
          －
        </button>
        <button onClick={() => setVista({ x: 0, y: 0, k: 1 })} className="rounded-full bg-papel/90 px-3 py-1 shadow-sm hover:bg-papel">
          Ajustar
        </button>
      </div>
    </div>
  );
}
