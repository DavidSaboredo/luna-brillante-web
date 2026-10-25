import Link from "next/link";
import LogoLuna from "@/components/LogoLuna";
import TarjetaPunto from "@/components/TarjetaPunto";
import { buscarPunto, puntos } from "@/lib/puntos";

const DESTACADOS = ["shell_stitch", "puff_stitch", "v_stitch", "granny_square"]
  .map(buscarPunto)
  .filter((p) => p !== undefined);

const SECCIONES = [
  {
    href: "/puntos",
    titulo: "Puntos",
    texto: `${puntos.length} puntos con diagrama, paso a paso y calculadora.`,
    icono: "✿",
    fondo: "bg-rosa",
  },
  {
    href: "/proyectos",
    titulo: "Revista",
    texto: "Seis diseños con materiales, medidas y vueltas explicadas.",
    icono: "❀",
    fondo: "bg-manteca",
  },
  {
    href: "/crear",
    titulo: "Crear prenda",
    texto: "Diseñá en 3D 15 prendas con tu talle, telas y puntos favoritos.",
    icono: "✂",
    fondo: "bg-menta",
  },
  {
    href: "/asistente",
    titulo: "Luna IA",
    texto: "Cuéntale tu idea y te genera el patrón y la guía.",
    icono: "✦",
    fondo: "bg-lavanda",
  },
];

export default function Inicio() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-lavanda via-rosa to-manteca p-7 md:p-12">
        <div className="absolute -right-6 -top-6 opacity-60 md:right-8 md:top-6">
          <LogoLuna size={140} />
        </div>
        <p className="text-sm tracking-[0.3em] text-tinta-suave">BIENVENIDA</p>
        <h1 className="mt-2 max-w-md text-5xl leading-[1.05] md:text-6xl">Teje con calma, crea con brillo</h1>
        <p className="mt-3 max-w-md">
          Puntos, diseño de prendas y una asistente con IA para acompañarte en cada vuelta.
        </p>
        <Link
          href="/asistente"
          className="mt-6 inline-block rounded-full bg-tinta px-6 py-3 text-sm text-crema transition hover:opacity-90"
        >
          ✦ Contarle mi idea a Luna
        </Link>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SECCIONES.map((s) => (
          <Link key={s.href} href={s.href} className="tarjeta flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${s.fondo}`}>
              {s.icono}
            </span>
            <span>
              <span className="block font-titulo text-2xl font-semibold">{s.titulo}</span>
              <span className="text-sm text-tinta-suave">{s.texto}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl">Puntos para empezar hoy</h2>
          <Link href="/puntos" className="text-sm text-lavanda-fuerte">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {DESTACADOS.map((p) => (
            <TarjetaPunto key={p.id} punto={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
