import { notFound } from "next/navigation";
import DetallePuntoVista from "@/components/DetallePuntoVista";
import { proyectosConPunto } from "@/lib/proyectos";
import { buscarPunto, puntos } from "@/lib/puntos";

export function generateStaticParams() {
  return puntos.map((p) => ({ id: p.id }));
}

export default async function DetallePunto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const punto = buscarPunto(id);
  if (!punto) notFound();

  const enRevista = proyectosConPunto(punto.id).map((r) => ({ id: r.id, titulo: r.titulo }));
  return <DetallePuntoVista punto={punto} enRevista={enRevista} />;
}
