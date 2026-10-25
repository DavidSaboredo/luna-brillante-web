// Lista qué prendas y talles ya tienen simulación de tela en public/modelos/prendas -> src/data/simulaciones.json
import fs from "node:fs";
const dir = "public/modelos/prendas";
const idx = {};
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
  const m = f.match(/^(.+)_(\d+)\.glb$/);
  if (m) (idx[m[1]] ??= []).push(Number(m[2]));
}
for (const k of Object.keys(idx)) idx[k].sort((a, b) => a - b);
fs.writeFileSync("src/data/simulaciones.json", JSON.stringify(idx, null, 1));
console.log(idx);
