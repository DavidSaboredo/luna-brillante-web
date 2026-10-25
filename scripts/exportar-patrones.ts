// Exporta, para cada prenda y talle, las piezas planas del patrón (medidas en cm) que usa la simulación de tela en Blender.
// Uso: npx tsx scripts/exportar-patrones.ts
import fs from "node:fs";
import { PRENDAS, contexto, opcionesPara } from "../src/lib/taller";
import { TALLES } from "../src/lib/medidas";

const salida = "scripts/blender/specs";
fs.mkdirSync(salida, { recursive: true });
let n = 0;
for (const prenda of PRENDAS) {
  for (const t of TALLES) {
    const o = opcionesPara(prenda, { talle: t.talle });
    const c = contexto(prenda, o);
    const piezas = prenda.zonas.flatMap((z) => z.piezas(c).map((p) => ({ zona: z.id, ...p })));
    fs.writeFileSync(
      `${salida}/${prenda.id}_${t.talle}.json`,
      JSON.stringify({ prenda: prenda.id, talle: t.talle, opciones: o, medidas: c.m, holgura: c.holgura, largo: c.largo, manga: c.manga, piezas }, null, 1),
    );
    n++;
  }
}
console.log("specs:", n);
