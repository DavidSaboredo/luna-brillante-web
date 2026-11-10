"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GUIAS } from "@/lib/guias";
import { CUELLO_SUGERIDO, ENTRADA_INICIAL, calcularSueter, type Escote, type EntradaSueter } from "@/lib/sueter";
import { AJUSTES, GRUPOS, LARGOS, MANGAS, PRENDAS, contexto, opcionesPara, type Opciones } from "@/lib/taller";
import { TALLES } from "@/lib/medidas";

const CAMPOS: { id: keyof EntradaSueter; nombre: string; ayuda: string }[] = [
  { id: "pecho", nombre: "Pecho terminado (cm)", ayuda: "Contorno de pecho + lo suelto que lo quieras" },
  { id: "cuello", nombre: "Contorno del escote (cm)", ayuda: "Tiene que pasar por la cabeza" },
  { id: "brazo", nombre: "Contorno del brazo arriba (cm)", ayuda: "Medido en la parte más ancha" },
  { id: "profundidad", nombre: "Largo del canesú (cm)", ayuda: "Del cuello hasta la axila" },
  { id: "largoCuerpo", nombre: "Largo del cuerpo (cm)", ayuda: "De la axila hasta abajo" },
  { id: "largoManga", nombre: "Largo de la manga (cm)", ayuda: "De la axila al puño" },
];

const ESCOTES: { id: Escote; nombre: string }[] = [
  { id: "redondo", nombre: "Redondo" },
  { id: "v", nombre: "En V" },
  { id: "bote", nombre: "Bote" },
];

const CAMPO_ENTRADA = "mt-1 w-full rounded-full border border-borde bg-papel px-4 py-2.5 outline-none focus:border-lavanda-fuerte";

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={titulo} className="space-y-1">
      <span className="text-sm text-tinta-suave">{titulo}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SueterDesdeCuello({ puntos, vueltas }: { puntos: number; vueltas: number }) {
  const [e, setE] = useState<EntradaSueter>(ENTRADA_INICIAL);
  const entrada = { ...e, puntosEn10: puntos, vueltasEn10: vueltas };
  const r = useMemo(() => calcularSueter(entrada), [e, puntos, vueltas]); // eslint-disable-line react-hooks/exhaustive-deps
  const cambiar = (id: keyof EntradaSueter, v: string) => setE((a) => ({ ...a, [id]: Math.max(0, Number(v) || 0) }));
  const elegirEscote = (id: Escote) => setE((a) => ({ ...a, escote: id, cuello: CUELLO_SUGERIDO[id] }));
  const valido = puntos > 0 && vueltas > 0 && e.pecho > 0 && e.cuello > 0 && e.brazo > 0;

  return (
    <div className="space-y-4">
      <p className="text-tinta-suave">
        Se teje de arriba hacia abajo, en redondo, con aumentos de raglán (4 líneas). Usa la muestra que cargaste arriba.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de escote">
        {ESCOTES.map((x) => (
          <button key={x.id} onClick={() => elegirEscote(x.id)} className={`chip ${e.escote === x.id ? "!border-lavanda !bg-lavanda" : ""}`}>
            {x.nombre}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CAMPOS.map((c) => (
          <label key={c.id} className="block">
            <span className="text-sm">{c.nombre}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={e[c.id] === 0 ? "" : (e[c.id] as number)}
              onChange={(ev) => cambiar(c.id, ev.target.value)}
              className={CAMPO_ENTRADA}
            />
            <span className="text-xs text-tinta-suave">{c.ayuda}</span>
          </label>
        ))}
      </div>
      {!valido ? (
        <p className="text-tinta-suave">Completá todas las medidas para calcular.</p>
      ) : (
        <div className="space-y-3">
          {r.avisos.map((a) => (
            <p key={a} className="rounded-2xl bg-rosa/40 px-4 py-3 text-sm">
              {a}
            </p>
          ))}
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <strong>Cadena inicial:</strong> {r.cadenaInicial} cadenetas. Cerrala en redondo con un punto raso. Repartí así: {r.panelDelanteroInicial} puntos
              adelante, {r.mangaInicial} en una manga, {r.panelDelanteroInicial} atrás y {r.mangaInicial} en la otra manga. Marcá las 4 uniones con un hilo de color.
            </li>
            <li>
              <strong>Canesú:</strong> tejé {r.vueltasCanesu} vueltas. En {r.vueltasAumento} de ellas ({r.cadaCuantasVueltas}) aumentá 1 punto a cada lado de cada
              marca (8 aumentos por vuelta). Al terminar tenés {r.puntosFinalesCanesu} puntos: {r.delanteroFinal} adelante, {r.mangaFinal} en cada manga y{" "}
              {r.delanteroFinal} atrás.
            </li>
            <li>
              <strong>Separar mangas:</strong> dejá los puntos de cada manga en espera y armá {r.cadenasAxila} cadenetas en cada axila. Seguí el cuerpo en redondo con{" "}
              {r.puntosCuerpo} puntos.
            </li>
            <li>
              <strong>Cuerpo:</strong> tejé {r.vueltasCuerpo} vueltas rectas y terminá con una vuelta elástica (punto bajo en hebra trasera).
            </li>
            <li>
              <strong>Mangas:</strong> retomá los {r.mangaFinal} puntos y levantá {r.cadenasAxila} en la axila (total {r.puntosManga}). Tejé {r.vueltasManga} vueltas
              disminuyendo 2 puntos {r.cadaCuantasDisminucion} ({r.disminucionesManga} veces) hasta el puño.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default function Guias() {
  const [prendaId, setPrendaId] = useState("sueter");
  const [opc, setOpc] = useState<Partial<Opciones>>({});
  const [sp, setSp] = useState(20);
  const [vp, setVp] = useState(16);

  const prenda = PRENDAS.find((p) => p.id === prendaId) ?? PRENDAS[0];
  const o = opcionesPara(prenda, opc);
  const c = contexto(prenda, o);
  const piezas = prenda.zonas.flatMap((z) => z.piezas(c).map((p) => ({ ...p, zona: z.nombre })));
  const muestraOk = sp > 0 && vp > 0;
  const aPuntos = (cm: number) => Math.max(1, Math.round((cm * sp) / 10));
  const aVueltas = (cm: number) => Math.max(1, Math.round((cm * vp) / 10));
  const poner = (k: keyof Opciones, v: string | number) => setOpc((a) => ({ ...a, [k]: v }));
  const num = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <div className="space-y-5">
      <nav aria-label="Elegí la prenda" className="space-y-3">
        {GRUPOS.map((g) => (
          <div key={g.id}>
            <p className="mb-1 text-sm text-tinta-suave">{g.nombre}</p>
            <div className="flex flex-wrap gap-2">
              {PRENDAS.filter((p) => p.grupo === g.id).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPrendaId(p.id);
                    setOpc({});
                  }}
                  aria-pressed={prendaId === p.id}
                  className={`chip ${prendaId === p.id ? "!border-lavanda !bg-lavanda" : ""}`}
                >
                  <span aria-hidden="true">{p.icono}</span> {p.nombre}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <section className="tarjeta space-y-5 p-5">
        <header>
          <h2 className="text-2xl">
            <span aria-hidden="true">{prenda.icono}</span> {prenda.nombre}
          </h2>
          <p className="text-tinta-suave">{prenda.descripcion}</p>
        </header>

        <div className="space-y-3">
          <h3 className="text-lg">1. Tu muestra</h3>
          <p className="text-sm text-tinta-suave">Tejé un cuadrado de 10 x 10 cm con tu hilado y tu aguja, y contá.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm">Puntos en 10 cm</span>
              <input type="number" inputMode="decimal" min={0} value={sp || ""} onChange={(ev) => setSp(num(ev.target.value))} className={CAMPO_ENTRADA} />
            </label>
            <label className="block">
              <span className="text-sm">Vueltas en 10 cm</span>
              <input type="number" inputMode="decimal" min={0} value={vp || ""} onChange={(ev) => setVp(num(ev.target.value))} className={CAMPO_ENTRADA} />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg">2. Talle y forma</h3>
          {prenda.opciones.includes("talle") && (
            <Grupo titulo="Talle">
              {TALLES.map((t) => (
                <button key={t.talle} onClick={() => poner("talle", t.talle)} aria-pressed={o.talle === t.talle} className={`chip ${o.talle === t.talle ? "!border-lavanda !bg-lavanda" : ""}`}>
                  {t.talle}
                </button>
              ))}
            </Grupo>
          )}
          {prenda.opciones.includes("manga") && (
            <Grupo titulo="Manga">
              {MANGAS.map((x) => (
                <button key={x.id} onClick={() => poner("manga", x.id)} aria-pressed={o.manga === x.id} className={`chip ${o.manga === x.id ? "!border-lavanda !bg-lavanda" : ""}`}>
                  {x.nombre}
                </button>
              ))}
            </Grupo>
          )}
          {prenda.opciones.includes("largo") && (
            <Grupo titulo="Largo">
              {LARGOS.map((x) => (
                <button key={x.id} onClick={() => poner("largo", x.id)} aria-pressed={o.largo === x.id} className={`chip ${o.largo === x.id ? "!border-lavanda !bg-lavanda" : ""}`}>
                  {x.nombre}
                </button>
              ))}
            </Grupo>
          )}
          {prenda.opciones.includes("ajuste") && (
            <Grupo titulo="Cómo te queda">
              {AJUSTES.map((x) => (
                <button key={x.id} onClick={() => poner("ajuste", x.id)} aria-pressed={o.ajuste === x.id} className={`chip ${o.ajuste === x.id ? "!border-lavanda !bg-lavanda" : ""}`}>
                  {x.nombre}
                </button>
              ))}
            </Grupo>
          )}
          {prenda.opciones.length === 0 && <p className="text-sm text-tinta-suave">Esta prenda no depende del talle: las medidas son fijas.</p>}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg">3. Qué tenés que tejer</h3>
          {!muestraOk ? (
            <p className="text-tinta-suave">Cargá los puntos y las vueltas de tu muestra para calcular.</p>
          ) : (
            <ul className="space-y-2">
              {piezas.map((p) => (
                <li key={`${p.zona}-${p.nombre}`} className="rounded-2xl bg-papel px-4 py-3 text-sm">
                  <strong>
                    {p.cantidad > 1 ? `${p.cantidad} × ` : ""}
                    {p.nombre}
                  </strong>
                  <span className="text-tinta-suave"> ({p.zona})</span>
                  <br />
                  {p.ancho} × {p.alto} cm → <strong>{aPuntos(p.ancho)} puntos</strong> de ancho (cadena de {aPuntos(p.ancho)}) y <strong>{aVueltas(p.alto)} vueltas</strong> de alto.
                  {p.nota && <span className="block text-xs text-tinta-suave">{p.nota}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg">4. Cómo se arma</h3>
          <ol className="list-decimal space-y-2 pl-5">
            {prenda.armado.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </div>

        {prenda.id === "sueter" && (
          <details className="rounded-2xl border border-borde p-4">
            <summary className="cursor-pointer text-lg">Otra forma: suéter desde el cuello (raglán)</summary>
            <div className="mt-3">
              <SueterDesdeCuello puntos={sp} vueltas={vp} />
            </div>
          </details>
        )}

        <p className="text-xs text-tinta-suave">Guía orientativa: probá la prenda en el cuerpo mientras tejés. Monica la tiene que revisar.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl">Arreglos y consejos</h2>
        {GUIAS.map((g) => (
          <details key={g.id} className="rounded-2xl border border-borde bg-papel p-4">
            <summary className="cursor-pointer text-sm">{g.titulo}</summary>
            <div className="mt-3 space-y-3">
              <p className="text-tinta-suave">{g.resumen}</p>
              <ol className="list-decimal space-y-2 pl-5">
                {g.pasos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
              {g.nota && <p className="rounded-2xl bg-rosa/30 px-4 py-3 text-sm">{g.nota}</p>}
              {g.puntos && (
                <p className="flex flex-wrap gap-2">
                  {g.puntos.map((p) => (
                    <Link key={p.id} href={`/puntos/${p.id}`} className="chip">
                      {p.nombre}
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </details>
        ))}
        <Link href="/diagramas" className="inline-block pt-2 text-sm text-lavanda-fuerte underline">
          📐 Puntillas y diagramas de Monica →
        </Link>
      </section>
    </div>
  );
}
