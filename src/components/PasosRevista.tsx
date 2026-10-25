import { equivalenciaRevista, pasosRevista } from "@/lib/revista";

export default function PasosRevista({ idPunto }: { idPunto: string }) {
  const p = pasosRevista(idPunto);
  const eq = equivalenciaRevista(idPunto);
  if (!p && !eq) return null;

  return (
    <section className="tarjeta p-5">
      <h2 className="text-2xl">Como lo dicen las tejedoras</h2>

      {eq && (
        <p className="mt-2">
          En las revistas: <strong>{eq.revista}</strong>
          {eq.abrev !== "—" && <> ({eq.abrev})</>}. En esta app lo ves como <span className="font-mono">{eq.app}</span>.
        </p>
      )}

      {p && (
        <div className="mt-4 space-y-3">
          <figure className="overflow-hidden rounded-2xl border border-borde">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.titulo} loading="lazy" className="w-full" />
            <figcaption className="bg-crema/60 px-3 py-2 text-xs text-tinta-suave">
              {p.tipo === "foto" ? "📷 Fotos reales paso a paso" : "✏ Esquema paso a paso"} · {p.titulo} · de las revistas
            </figcaption>
          </figure>
          <ol className="space-y-2">
            {p.pasos.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavanda text-sm">{i + 1}</span>
                <span className="pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
          {p.extra && <p className="rounded-xl bg-manteca/60 p-3 text-sm">💡 {p.extra}</p>}
        </div>
      )}
    </section>
  );
}
