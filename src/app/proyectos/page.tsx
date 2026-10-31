import Link from "next/link";
import { Nivel } from "@/components/TarjetaPunto";
import { fuenteRevista, proyectos } from "@/lib/proyectos";
import RevistasVenta from "@/components/RevistasVenta";
import { EncabezadoRevista, EnlaceGuia } from "@/components/TextosRevista";

export const metadata = { title: "Revista · Luna Brillante" };

export default function PaginaProyectos() {
  return (
    <div className="space-y-6">
      <EncabezadoRevista fuente={fuenteRevista} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {proyectos.map((p) => (
          <Link key={p.id} href={`/proyectos/${p.id}`} className="tarjeta group block overflow-hidden transition hover:-translate-y-0.5">
            <div className="relative aspect-[4/5] overflow-hidden bg-crema">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.portada}
                alt={p.titulo}
                loading="lazy"
                className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-papel/90 text-sm">
                {p.numero}
              </span>
            </div>
            <div className="space-y-1 p-4">
              <p className="text-xs text-tinta-suave">
                {p.categoria} · pág. {p.pagina}
              </p>
              <h2 className="text-2xl leading-tight">{p.titulo}</h2>
              <p className="text-sm text-tinta-suave">{p.lema}</p>
              <div className="flex items-center gap-2 pt-1 text-xs text-tinta-suave">
                <Nivel nivel={p.nivelNum} />
                {p.nivel}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <RevistasVenta />

      <EnlaceGuia />
    </div>
  );
}
