// Escribe el maniquí ya ajustado a cada talle (OBJ) para usarlo como cuerpo de colisión en la simulación de tela.
// Uso: npx tsx scripts/exportar-maniquis.ts
import fs from "node:fs";
import { crearCuerpo, deformarManiqui } from "../src/lib/cuerpo3d";
import { TALLES, medidasTalle } from "../src/lib/medidas";

const buf = fs.readFileSync("public/modelos/maniqui.glb");
const jl = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jl).toString());
const bin = 20 + jl + 8;
const leer = (acc: number) => {
  const a = json.accessors[acc];
  const bv = json.bufferViews[a.bufferView];
  const off = bin + (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  return { a, off };
};
fs.mkdirSync("scripts/blender/maniquis", { recursive: true });
for (const t of TALLES) {
  const cu = crearCuerpo(medidasTalle(t.talle));
  let obj = "";
  let base = 1;
  for (const mesh of json.meshes) {
    for (const prim of mesh.primitives) {
      const { a: pa, off: po } = leer(prim.attributes.POSITION);
      const pos = new Float32Array(pa.count * 3);
      for (let i = 0; i < pos.length; i++) pos[i] = buf.readFloatLE(po + i * 4);
      deformarManiqui(pos, cu);
      const { a: ia, off: io } = leer(prim.indices);
      const size = ia.componentType === 5125 ? 4 : 2;
      obj += `o cuerpo${base}\n`;
      for (let i = 0; i < pa.count; i++) obj += `v ${pos[i * 3].toFixed(5)} ${pos[i * 3 + 1].toFixed(5)} ${pos[i * 3 + 2].toFixed(5)}\n`;
      for (let i = 0; i < ia.count; i += 3) {
        const r = (k: number) => (size === 4 ? buf.readUInt32LE(io + (i + k) * 4) : buf.readUInt16LE(io + (i + k) * 2)) + base;
        obj += `f ${r(0)} ${r(1)} ${r(2)}\n`;
      }
      base += pa.count;
    }
  }
  fs.writeFileSync(`scripts/blender/maniquis/maniqui_${t.talle}.obj`, obj);
}
console.log("maniquíes:", TALLES.length);
