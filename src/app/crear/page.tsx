"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useIdioma } from "@/components/Idioma";
import { textosPuntos } from "@/lib/textos-puntos";
import { fmt, nom, textosCrear, type ClaveCrear } from "@/lib/textos-crear";
import SelectorPunto from "@/components/SelectorPunto";
import Patron2D from "@/components/Patron2D";
import type { VistaCamara } from "@/components/Prenda3D";
import { rutaSimulacion, tieneSimulacion } from "@/lib/simulaciones";
import { medidasTalle, TALLES } from "@/lib/medidas";
import { buscarPunto, calcularCadenaBase, puntosParaPrenda, rutaIlustracion } from "@/lib/puntos";
import {
  AJUSTES,
  COLORES,
  GRUPOS,
  LARGOS,
  MANGAS,
  PRENDAS,
  TELAS,
  contexto,
  infoMaterial,
  opcionesPara,
  type Diseno,
  type EleccionZona,
  type Opciones,
  type Tecnica,
} from "@/lib/taller";

const Prenda3D = dynamic(() => import("@/components/Prenda3D"), {
  ssr: false,
  loading: () => <Cargando />,
});

function Cargando() {
  const { idioma } = useIdioma();
  return <div className="flex h-full items-center justify-center text-sm text-tinta-suave">{textosCrear[idioma]["crear.cargando3d"]}</div>;
}

const CLAVE_DISENOS = "disenos";

function leerDisenos(): Diseno[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_DISENOS) ?? "[]");
  } catch {
    return [];
  }
}

const VISTAS: { id: VistaCamara; nombre: string }[] = [
  { id: "frente", nombre: "Frente" },
  { id: "tres_cuartos", nombre: "3/4" },
  { id: "lado", nombre: "Lado" },
  { id: "espalda", nombre: "Espalda" },
];

type Pestana = "zona" | "medidas" | "piezas" | "armado" | "guardar";
const PESTANAS: { id: Pestana; nombre: ClaveCrear; icono: string }[] = [
  { id: "zona", nombre: "crear.pestZona", icono: "🧶" },
  { id: "medidas", nombre: "crear.pestMedidas", icono: "📏" },
  { id: "piezas", nombre: "crear.pestPiezas", icono: "✂" },
  { id: "armado", nombre: "crear.pestArmado", icono: "🪡" },
  { id: "guardar", nombre: "crear.pestGuardar", icono: "💾" },
];

export default function PaginaCrear() {
  return (
    <Suspense>
      <TallerPrenda />
    </Suspense>
  );
}

function Opcion<T extends string | number>({
  titulo,
  valor,
  opciones,
  onCambiar,
}: {
  titulo: string;
  valor: T;
  opciones: { id: T; nombre: string }[];
  onCambiar: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-tinta-suave">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {opciones.map((o) => (
          <button
            key={String(o.id)}
            onClick={() => onCambiar(o.id)}
            className={`chip !px-3 !py-1.5 ${valor === o.id ? "!border-lavanda-fuerte !bg-lavanda/40" : ""}`}
          >
            {o.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}

function Herramienta({ activo, onClick, titulo, children }: { activo?: boolean; onClick: () => void; titulo: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition ${
        activo ? "border-lavanda-fuerte bg-lavanda/40" : "border-transparent hover:bg-crema"
      }`}
    >
      {children}
    </button>
  );
}

const Separador = () => <span className="mx-1 h-6 w-px bg-borde" aria-hidden />;

function TallerPrenda() {
  const { idioma } = useIdioma();
  const k = (c: ClaveCrear, v?: Record<string, string | number>) => (v ? fmt(textosCrear[idioma][c], v) : textosCrear[idioma][c]);
  const n = (t: string) => nom(t, idioma);
  const nombrePunto = (p: { name: { es: string; en: string } }) => (idioma === "es" ? p.name.es : p.name.en);
  const params = useSearchParams();
  const visor = useRef<HTMLDivElement>(null);
  const [prendaId, setPrendaId] = useState(PRENDAS[0].id);
  const [opciones, setOpciones] = useState<Opciones>(opcionesPara(PRENDAS[0]));
  const [zonas, setZonas] = useState<Record<string, EleccionZona>>({});
  const [zonaActiva, setZonaActiva] = useState(PRENDAS[0].zonas[0].id);
  const [nombre, setNombre] = useState("");
  const [notas, setNotas] = useState("");
  const [guardados, setGuardados] = useState<Diseno[]>([]);
  const [vista, setVista] = useState<Tecnica>("crochet");
  const [camara, setCamara] = useState<VistaCamara>("tres_cuartos");
  const [maniqui, setManiqui] = useState(false);
  const [girar, setGirar] = useState(false);
  const [simular, setSimular] = useState(true);
  const [relleno, setRelleno] = useState<"textura" | "diagrama">("textura");
  const [pestana, setPestana] = useState<Pestana>("zona");
  const [puntosMuestra, setPuntosMuestra] = useState(20);
  const [filasMuestra, setFilasMuestra] = useState(11);
  const puntoInicialAplicado = useRef(false);

  useEffect(() => setGuardados(leerDisenos()), []);

  const prenda = PRENDAS.find((p) => p.id === prendaId)!;
  const zona = prenda.zonas.find((z) => z.id === zonaActiva) ?? prenda.zonas[0];
  const eleccion = zonas[zona.id];
  const info = eleccion && infoMaterial(eleccion.material);
  const ctx = useMemo(() => contexto(prenda, opciones), [prenda, opciones]);
  const medidas = medidasTalle(opciones.talle);
  const rutaSim = rutaSimulacion(prenda.id, opciones);
  const hayTela = tieneSimulacion(prenda.id);

  const seleccionarZona = (id: string, enZonas = zonas) => {
    setZonaActiva(id);
    setVista((enZonas[id] && infoMaterial(enZonas[id].material)?.tecnica) || "crochet");
  };

  /** Completa todas las zonas con un punto sugerido y una paleta, para ver el diseño enseguida. */
  const ejemplo = (p = prenda, o = opciones) => {
    const paleta = [COLORES[0].hex, COLORES[1].hex, COLORES[2].hex, COLORES[3].hex, COLORES[4].hex];
    const nuevas: Record<string, EleccionZona> = {};
    p.zonas.forEach((z, i) => {
      const candidatos = puntosParaPrenda.filter((x) => z.sugeridas.includes(x.category) && x.difficulty <= 3);
      const punto = candidatos.length ? candidatos[(i * 7 + o.talle) % candidatos.length] : buscarPunto("single_crochet")!;
      nuevas[z.id] = { material: punto.id, color: paleta[i % paleta.length] };
    });
    setZonas(nuevas);
  };

  // Enlaces directos: /crear?prenda=poncho&ejemplo=1&vista=espalda
  const paramsAplicados = useRef(false);
  useEffect(() => {
    if (paramsAplicados.current) return;
    paramsAplicados.current = true;
    const p = PRENDAS.find((x) => x.id === params.get("prenda"));
    if (p) {
      setPrendaId(p.id);
      const talle = Number(params.get("talle"));
      const o = opcionesPara(p, TALLES.some((t) => t.talle === talle) ? { talle } : undefined);
      setOpciones(o);
      setZonaActiva(p.zonas[0].id);
      if (params.get("ejemplo")) ejemplo(p, o);
    }
    const v = params.get("vista") as VistaCamara | null;
    if (v && VISTAS.some((x) => x.id === v)) setCamara(v);
    const t = params.get("pestana") as Pestana | null;
    if (t && PESTANAS.some((x) => x.id === t)) setPestana(t);
    if (params.get("relleno") === "diagrama") setRelleno("diagrama");
    if (params.get("sim") === "0") setSimular(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si llega desde la ficha de un punto (/crear?punto=...), se aplica a la zona donde mejor encaja
  useEffect(() => {
    const punto = buscarPunto(params.get("punto") ?? "");
    if (!punto || puntoInicialAplicado.current) return;
    puntoInicialAplicado.current = true;
    const destino = prenda.zonas.find((z) => z.sugeridas.includes(punto.category)) ?? prenda.zonas[0];
    setZonas((z) => ({ ...z, [destino.id]: { material: punto.id, color: COLORES[0].hex } }));
    setZonaActiva(destino.id);
    setVista("crochet");
  }, [params, prenda]);

  const cambiarPrenda = (id: string) => {
    const nueva = PRENDAS.find((p) => p.id === id)!;
    setPrendaId(id);
    setOpciones(opcionesPara(nueva, { talle: opciones.talle }));
    setZonas({});
    setZonaActiva(nueva.zonas[0].id);
    setVista("crochet");
    setCamara("tres_cuartos");
  };

  const elegir = (cambio: Partial<EleccionZona>) =>
    setZonas((z) => ({
      ...z,
      [zona.id]: {
        ...(z[zona.id] ?? { material: vista === "tela" ? TELAS[0].id : "single_crochet", color: COLORES[0].hex }),
        ...cambio,
      },
    }));

  const cambiarOpcion = (c: Partial<Opciones>) => setOpciones((o) => ({ ...o, ...c }));

  const persistir = (lista: Diseno[]) => {
    setGuardados(lista);
    try {
      localStorage.setItem(CLAVE_DISENOS, JSON.stringify(lista));
    } catch {}
  };

  const guardar = () =>
    persistir([
      {
        id: crypto.randomUUID(),
        nombre: nombre.trim() || `${k("crear.mi")} ${n(prenda.nombre).toLowerCase()}`,
        prenda: prenda.id,
        zonas,
        notas,
        creado: new Date().toISOString(),
        opciones,
      },
      ...guardados,
    ]);

  const abrir = (d: Diseno) => {
    const p = PRENDAS.find((x) => x.id === d.prenda);
    if (!p) return;
    setPrendaId(d.prenda);
    setOpciones(opcionesPara(p, d.opciones));
    setZonas(d.zonas);
    setNombre(d.nombre);
    setNotas(d.notas);
    seleccionarZona(p.zonas[0].id, d.zonas);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const borrar = (id: string) => persistir(guardados.filter((d) => d.id !== id));

  const descargar = () => {
    const lienzo = visor.current?.querySelector("canvas");
    if (!lienzo) return;
    const a = document.createElement("a");
    a.download = `${(nombre.trim() || n(prenda.nombre)).toLowerCase().replace(/\s+/g, "-")}.png`;
    a.href = lienzo.toDataURL("image/png");
    a.click();
  };

  const completas = prenda.zonas.filter((z) => zonas[z.id] && infoMaterial(zonas[z.id].material)).length;
  const fotoPunto = info?.punto ? rutaIlustracion(info.punto) : null;
  const piezasZona = zona.piezas(ctx);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-4xl">{k("crear.titulo")}</h1>
          <p className="text-tinta-suave">{k("crear.sub")}</p>
        </div>
        <Link href="/puntadas" className="text-sm text-lavanda-fuerte underline">
          {k("crear.verHilo")}
        </Link>
      </header>

      {/* Prendas */}
      <div className="space-y-1.5">
        {GRUPOS.map((g) => (
          <div key={g.id} className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-xs uppercase tracking-wide text-tinta-suave">{n(g.nombre)}</span>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {PRENDAS.filter((p) => p.grupo === g.id).map((p) => (
                <button
                  key={p.id}
                  onClick={() => cambiarPrenda(p.id)}
                  className={`chip shrink-0 !py-1 ${p.id === prendaId ? "!bg-lavanda !border-lavanda" : ""}`}
                >
                  {p.icono} {n(p.nombre)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ventana de diseño: 3D + patrón plano */}
      <section className="tarjeta overflow-hidden !p-0">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-borde bg-papel px-2 py-1.5">
          <Herramienta onClick={() => ejemplo()} titulo={k("crear.ejemploTip")}>
            ✨ <span className="ml-1 hidden sm:inline">{k("crear.ejemplo")}</span>
          </Herramienta>
          <Separador />
          {VISTAS.map((v) => (
            <Herramienta key={v.id} activo={camara === v.id} onClick={() => setCamara(v.id)} titulo={k("crear.vista", { v: n(v.nombre).toLowerCase() })}>
              {n(v.nombre)}
            </Herramienta>
          ))}
          <Separador />
          <Herramienta activo={maniqui} onClick={() => setManiqui((v) => !v)} titulo={k("crear.maniquiTip")}>
            👤
          </Herramienta>
          <Herramienta
            activo={simular && !!rutaSim}
            onClick={() => setSimular((v) => !v)}
            titulo={hayTela ? (rutaSim ? k("crear.caidaTip1") : k("crear.caidaTip2")) : k("crear.caidaTip3")}
          >
            🧵 <span className="ml-1 hidden sm:inline">{rutaSim ? k("crear.caidaReal") : hayTela ? k("crear.caidaOtras") : k("crear.aproximada")}</span>
          </Herramienta>
          <Herramienta activo={girar} onClick={() => setGirar((v) => !v)} titulo={k("crear.girarTip")}>
            ↻
          </Herramienta>
          <Separador />
          <Herramienta activo={relleno === "textura"} onClick={() => setRelleno("textura")} titulo={k("crear.texturaTip")}>
            🧶 <span className="ml-1 hidden sm:inline">{k("crear.textura")}</span>
          </Herramienta>
          <Herramienta activo={relleno === "diagrama"} onClick={() => setRelleno("diagrama")} titulo={k("crear.diagramaTip")}>
            ▦ <span className="ml-1 hidden sm:inline">{k("crear.diagrama")}</span>
          </Herramienta>
          <Separador />
          <Herramienta onClick={descargar} titulo={k("crear.descargarTip")}>
            📷
          </Herramienta>
          <span className="ml-auto hidden px-2 text-xs text-tinta-suave md:block">
            {prenda.icono} {n(prenda.nombre)}
            {prenda.opciones.includes("talle") ? ` · ${k("crear.talleMin")} ${opciones.talle}` : ""} · {completas}/{prenda.zonas.length} {k("crear.zonasN")}
          </span>
        </div>

        <div className="grid md:grid-cols-2">
          <div ref={visor} className="relative h-[420px] touch-none border-b border-borde md:h-[540px] md:border-b-0 md:border-r">
            <Prenda3D
              prenda={prenda}
              opciones={opciones}
              zonas={zonas}
              zonaActiva={zona.id}
              onElegirZona={(id) => seleccionarZona(id)}
              conManiqui={maniqui}
              rutaSimulada={simular ? rutaSim : null}
              girar={girar}
              vista={camara}
            />
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-papel/90 px-3 py-1 text-xs shadow-sm">{k("crear.vista3d")}</span>
          </div>
          <div className="relative h-[420px] md:h-[540px]">
            <Patron2D
              prenda={prenda}
              opciones={opciones}
              zonas={zonas}
              zonaActiva={zona.id}
              onElegirZona={(id) => seleccionarZona(id)}
              relleno={relleno}
              puntosEn10={puntosMuestra}
              hilerasEn10={filasMuestra}
            />
          </div>
        </div>
        <p className="border-t border-borde bg-crema/60 px-3 py-1.5 text-center text-xs text-tinta-suave">
          {k("crear.ayuda")}
        </p>
      </section>

      {/* Zonas */}
      <div className="flex flex-wrap gap-2">
        {prenda.zonas.map((z) => (
          <button
            key={z.id}
            onClick={() => {
              seleccionarZona(z.id);
              setPestana("zona");
            }}
            className={`chip ${z.id === zona.id ? "!border-lavanda-fuerte !bg-papel" : ""}`}
          >
            <span
              className="mr-1.5 inline-block h-3 w-3 rounded-full border border-borde align-middle"
              style={{ background: zonas[z.id]?.color ?? "#fff" }}
            />
            {n(z.nombre)}
          </button>
        ))}
      </div>

      {/* Panel inferior con pestañas */}
      <section className="tarjeta overflow-hidden !p-0">
        <div className="flex gap-1 overflow-x-auto border-b border-borde bg-crema/60 px-2 pt-2">
          {PESTANAS.map((t) => (
            <button
              key={t.id}
              onClick={() => setPestana(t.id)}
              className={`shrink-0 rounded-t-xl px-4 py-2 text-sm transition ${
                pestana === t.id ? "bg-papel font-semibold shadow-[0_1px_0_#fff]" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              {t.icono} {k(t.nombre)}
            </button>
          ))}
        </div>

        <div className="p-5">
          {pestana === "zona" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div className="min-w-0 space-y-4">
                <div>
                  <h2 className="text-2xl">{n(zona.nombre)}</h2>
                  <p className="text-sm text-tinta-suave">
                    {info ? `${info.tecnica === "tela" ? k("crear.tela") : k("crear.crochet")}: ${info.tecnica === "tela" || !info.punto ? n(info.nombre) : nombrePunto(info.punto)}` : k("crear.elegiPunto")}
                  </p>
                </div>
                {info?.punto && (
                  <Link href={`/puntos/${info.punto.id}`} className="flex items-center gap-3 rounded-2xl border border-borde p-2 text-sm hover:border-lavanda-fuerte">
                    {fotoPunto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fotoPunto} alt={nombrePunto(info.punto)} className="h-16 w-16 rounded-xl object-cover" />
                    )}
                    <span>
                      <span className="block font-semibold">{nombrePunto(info.punto)}</span>
                      <span className="text-xs text-tinta-suave">{idioma === "es" ? info.punto.description.es : info.punto.description.en}</span>
                      <span className="block text-xs text-lavanda-fuerte">{k("crear.verPaso")}</span>
                    </span>
                  </Link>
                )}
                {piezasZona.length > 0 && (
                  <div className="rounded-xl bg-crema/70 p-3 text-sm">
                    <p className="mb-1 text-xs uppercase tracking-wide text-tinta-suave">{k("crear.piezasZona")}</p>
                    {piezasZona.map((p) => {
                      const cal = info?.punto?.repeat ? calcularCadenaBase(info.punto, p.ancho, puntosMuestra) : null;
                      return (
                        <p key={p.nombre}>
                          {p.cantidad > 1 ? `${p.cantidad} × ` : ""}
                          <strong>{n(p.nombre)}</strong> {p.ancho} × {p.alto} cm
                          {info?.tecnica === "crochet" && (
                            <span className="text-tinta-suave">
                              {" "}
                              · {k("crear.cadenaBase")} {cal ? cal.cadenas : Math.round((p.ancho * puntosMuestra) / 10)}
                            </span>
                          )}
                        </p>
                      );
                    })}
                  </div>
                )}
                <div>
                  <p className="mb-2 text-sm text-tinta-suave">{k("crear.colorHilo")}</p>
                  <div className="flex flex-wrap gap-2">
                    {COLORES.map((c) => (
                      <button
                        key={c.hex}
                        title={n(c.nombre)}
                        aria-label={n(c.nombre)}
                        onClick={() => elegir({ color: c.hex })}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          eleccion?.color === c.hex ? "scale-110 border-lavanda-fuerte" : "border-papel shadow"
                        }`}
                        style={{ background: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <div className="grid grid-cols-2 rounded-full bg-crema p-1 text-sm">
                  {(["crochet", "tela"] as Tecnica[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setVista(t)}
                      className={`rounded-full py-2 capitalize transition ${vista === t ? "bg-papel shadow-sm" : "text-tinta-suave"}`}
                    >
                      {t === "crochet" ? k("crear.tabCrochet") : k("crear.tabTela")}
                    </button>
                  ))}
                </div>
                {vista === "crochet" ? (
                  <SelectorPunto
                    key={`${prenda.id}-${zona.id}`}
                    sugeridas={zona.sugeridas}
                    seleccionado={info?.tecnica === "crochet" ? eleccion?.material : undefined}
                    onElegir={(id) => elegir({ material: id })}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {TELAS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => elegir({ material: m.id })}
                        className={`rounded-xl border p-3 text-left text-sm transition ${
                          eleccion?.material === m.id ? "border-lavanda-fuerte bg-lavanda/30" : "border-borde"
                        }`}
                      >
                        <span className="block font-semibold">{n(m.nombre)}</span>
                        <span className="text-xs text-tinta-suave">{n(m.descripcion)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {pestana === "medidas" && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <p className="text-sm text-tinta-suave">{n(prenda.descripcion)}</p>
                {prenda.opciones.includes("talle") && (
                  <Opcion
                    titulo={k("crear.talle")}
                    valor={opciones.talle}
                    opciones={TALLES.map((t) => ({ id: t.talle, nombre: String(t.talle) }))}
                    onCambiar={(talle) => cambiarOpcion({ talle })}
                  />
                )}
                {prenda.opciones.includes("manga") && (
                  <Opcion titulo={k("crear.mangas")} valor={opciones.manga} opciones={MANGAS.map((o) => ({ ...o, nombre: n(o.nombre) }))} onCambiar={(manga) => cambiarOpcion({ manga })} />
                )}
                {prenda.opciones.includes("largo") && (
                  <Opcion titulo={k("crear.largo")} valor={opciones.largo} opciones={LARGOS.map((o) => ({ ...o, nombre: n(o.nombre) }))} onCambiar={(largo) => cambiarOpcion({ largo })} />
                )}
                {prenda.opciones.includes("ajuste") && (
                  <Opcion titulo={k("crear.calce")} valor={opciones.ajuste} opciones={AJUSTES.map((o) => ({ ...o, nombre: n(o.nombre) }))} onCambiar={(ajuste) => cambiarOpcion({ ajuste })} />
                )}
                {!prenda.opciones.length && <p className="text-sm text-tinta-suave">{k("crear.fijas")}</p>}
              </div>
              <div className="space-y-4">
                {prenda.opciones.includes("talle") && (
                  <div className="rounded-xl bg-crema/70 p-3 text-sm">
                    <p>
                      {k("crear.medidasTalle", { t: opciones.talle, busto: medidas.busto, cadera: medidas.cadera, sisa: medidas.sisa, puno: medidas.puno })}
                    </p>
                    <p className="mt-1 text-tinta-suave">
                      {k("crear.largoPrenda")} <strong>{ctx.largo} cm</strong>
                      {ctx.manga > 0 ? ` · ${k("crear.manga")}: ${ctx.manga} cm` : ""} · {k("crear.calceMas", { h: ctx.holgura })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-sm font-semibold">{k("crear.tuMuestra")}</p>
                  <p className="mb-2 text-xs text-tinta-suave">{k("crear.muestraAyuda")}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <label className="space-y-1">
                      <span className="text-tinta-suave">{k("crear.puntos10")}</span>
                      <input
                        type="number"
                        min={6}
                        max={40}
                        value={puntosMuestra}
                        onChange={(e) => setPuntosMuestra(Math.max(6, Number(e.target.value) || 6))}
                        className="w-full rounded-xl border border-borde px-3 py-2 outline-none focus:border-lavanda-fuerte"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-tinta-suave">{k("crear.hileras10")}</span>
                      <input
                        type="number"
                        min={3}
                        max={40}
                        value={filasMuestra}
                        onChange={(e) => setFilasMuestra(Math.max(3, Number(e.target.value) || 3))}
                        className="w-full rounded-xl border border-borde px-3 py-2 outline-none focus:border-lavanda-fuerte"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pestana === "piezas" && (
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              {prenda.zonas.map((z) => {
                const piezas = z.piezas(ctx);
                if (!piezas.length) return null;
                const e = zonas[z.id];
                const m = e && infoMaterial(e.material);
                return (
                  <div key={z.id}>
                    <button onClick={() => seleccionarZona(z.id)} className="flex items-center gap-2 text-left text-sm font-semibold">
                      <span className="h-3 w-3 rounded-full border border-borde" style={{ background: e?.color ?? "#fff" }} />
                      {n(z.nombre)}
                      <span className="font-normal text-tinta-suave">
                        · {m ? (m.tecnica === "tela" ? k("crear.telaDe", { n: n(m.nombre).toLowerCase() }) : m.punto ? nombrePunto(m.punto) : m.nombre) : k("crear.sinDefinir")}
                      </span>
                    </button>
                    <ul className="mt-1 space-y-1 text-sm">
                      {piezas.map((p) => {
                        const pts = Math.round((p.ancho * puntosMuestra) / 10);
                        const hil = Math.round((p.alto * filasMuestra) / 10);
                        const cal = m?.punto && m.punto.repeat ? calcularCadenaBase(m.punto, p.ancho, puntosMuestra) : null;
                        return (
                          <li key={p.nombre} className="rounded-xl bg-crema/60 px-3 py-2">
                            <span className="font-medium">
                              {p.cantidad > 1 ? `${p.cantidad} × ` : ""}
                              {n(p.nombre)}
                            </span>{" "}
                            <span className="text-tinta-suave">
                              {p.ancho} × {p.alto} cm
                            </span>
                            <br />
                            {m?.tecnica === "tela" ? (
                              <span>{k("crear.cortar", { a: p.ancho + 2, b: p.alto + 2 })}</span>
                            ) : (
                              <span>
                                {k("crear.cadenaBaseDos")} <strong>{cal ? cal.cadenas : pts}</strong>
                                {cal ? ` ${k("crear.repeticiones", { r: cal.repeticiones, x: m!.punto!.repeat ? textosPuntos[idioma].puntos.multiplo(m!.punto!.repeat.multiple, m!.punto!.repeat.plus ?? 0).toLowerCase() : "" })}` : ""} · {hil} {k("crear.hileras")}
                              </span>
                            )}
                            {p.nota && <span className="block text-xs text-tinta-suave">{p.nota}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {pestana === "armado" && (
            <div>
              <ol className="space-y-2">
                {prenda.armado.map((t, i) => (
                  <li key={t} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-menta text-xs">{i + 1}</span>
                    <span className="pt-0.5">{t}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-tinta-suave">
                {k("crear.armadoPie")}{" "}
                <Link href="/guia" className="underline">
                  {k("crear.guiaLink")}
                </Link>
                .
              </p>
              {idioma !== "es" && <p className="mt-1 text-xs text-tinta-suave">{k("crear.avisoEs")}</p>}
            </div>
          )}

          {pestana === "guardar" && (
            <div className="space-y-5">
              <div className="mx-auto max-w-xl space-y-3">
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={k("crear.nombreDiseno")}
                  className="w-full rounded-xl border border-borde px-4 py-2.5 outline-none focus:border-lavanda-fuerte"
                />
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder={k("crear.notas")}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-borde px-4 py-2.5 outline-none focus:border-lavanda-fuerte"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={guardar}
                    disabled={!completas}
                    className="flex-1 rounded-full bg-lavanda-fuerte px-5 py-2.5 text-sm text-white disabled:opacity-40"
                  >
                    {k("crear.guardar")}
                  </button>
                </div>
                {!completas && <p className="text-xs text-tinta-suave">{k("crear.elegiAlMenos")}</p>}
              </div>

              {guardados.length > 0 && (
                <div>
                  <h2 className="mb-2 text-2xl">{k("crear.misDisenos")}</h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {guardados.map((d) => {
                      const p = PRENDAS.find((x) => x.id === d.prenda);
                      if (!p) return null;
                      const colores = p.zonas.map((z) => d.zonas[z.id]?.color).filter(Boolean) as string[];
                      return (
                        <div key={d.id} className="rounded-2xl border border-borde p-3">
                          <button onClick={() => abrir(d)} className="block w-full text-left">
                            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-crema text-4xl">{p.icono}</div>
                            <div className="mt-2 flex gap-1">
                              {colores.map((c, i) => (
                                <span key={i} className="h-4 flex-1 rounded-full border border-borde" style={{ background: c }} />
                              ))}
                            </div>
                            <p className="mt-2 truncate text-sm font-semibold">{d.nombre}</p>
                            <p className="text-xs text-tinta-suave">
                              {n(p.nombre)}
                              {d.opciones ? ` · ${k("crear.talleMin")} ${d.opciones.talle}` : ""}
                            </p>
                          </button>
                          <button onClick={() => borrar(d.id)} className="mt-1 w-full text-xs text-tinta-suave hover:text-rosa-fuerte">
                            {k("crear.eliminar")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
