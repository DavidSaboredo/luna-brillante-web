// Convierte los renders de Blender (PNG con transparencia) a WebP en public/puntos3d y actualiza src/data/puntos3d.json.
// Uso: node scripts/convertir-puntos3d.mjs <carpeta con los PNG>
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const origen = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "puntos3d");
const destino = "public/puntos3d";
fs.mkdirSync(destino, { recursive: true });
const ids = [];
for (const f of fs.readdirSync(origen).filter((x) => x.endsWith(".png"))) {
  const id = f.replace(/\.png$/, "");
  await sharp(path.join(origen, f)).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90 }).toFile(path.join(destino, `${id}.webp`));
  ids.push(id);
}
ids.sort();
fs.writeFileSync("src/data/puntos3d.json", JSON.stringify(ids));
console.log(ids.length, "renders convertidos");
