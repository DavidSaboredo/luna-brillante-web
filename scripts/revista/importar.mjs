// Agrega a src/data/puntos.json los puntos de nuevos.mjs, con su diagrama (public/diagramas)
// y su ilustración WebP (public/ilustraciones).
//
// Uso (desde la carpeta luna-brillante):  node scripts/revista/importar.mjs
import fs from "node:fs";
import sharp from "sharp";
import { diagramaSvg, ilustracionSvg, lienzo } from "./dibujo.mjs";
import { DUPLICADOS, NUEVOS } from "./nuevos.mjs";

const RUTA_BASE = "src/data/puntos.json";
const base = JSON.parse(fs.readFileSync(RUTA_BASE, "utf8"));
const NIVELES = Object.fromEntries(base.difficulty_levels.map((n) => [n.level, n.name]));

// --- Validación ---------------------------------------------------------------
const existentes = new Set(base.stitches.map((s) => s.id));
const todos = new Set([...existentes, ...NUEVOS.map((n) => n.id)]);
const errores = [];
for (const n of NUEVOS) {
  if (existentes.has(n.id)) errores.push(`${n.num}: el id ${n.id} ya existe`);
  if (!base.categories.some((c) => c.id === n.category)) errores.push(`${n.num}: categoría ${n.category}`);
  if (n.steps.es.length !== n.steps.en.length) errores.push(`${n.num}: pasos es/en de distinto largo`);
  if ((n.tips?.es.length ?? 0) !== (n.tips?.en.length ?? 0)) errores.push(`${n.num}: consejos es/en`);
  for (const r of [...n.related, ...n.prerequisites]) if (!todos.has(r)) errores.push(`${n.num}: referencia rota ${r}`);
  if (base.stitches.some((s) => s.source_ref?.pattern_number === n.num)) errores.push(`${n.num}: número ya cargado`);
}
for (const [num, d] of Object.entries(DUPLICADOS)) if (!existentes.has(d.id)) errores.push(`${num}: duplicado sin destino ${d.id}`);
if (new Set(NUEVOS.map((n) => n.id)).size !== NUEVOS.length) errores.push("ids repetidos en nuevos.mjs");
if (errores.length) {
  console.error("No se importó nada. Problemas:\n- " + errores.join("\n- "));
  process.exit(1);
}

// --- Dibujos ------------------------------------------------------------------
// Los gráficos cortos se alargan repitiendo las filas del motivo (sin la primera) hasta tener 5 filas,
// para que la ilustración parezca una muestra tejida.
function alargar(filas) {
  const motivo = filas.length > 1 ? filas.slice(1) : filas;
  const out = [...filas];
  for (let i = 0; out.length < 5; i++) out.push(motivo[i % motivo.length]);
  return out;
}

fs.mkdirSync("public/diagramas", { recursive: true });
fs.mkdirSync("public/ilustraciones", { recursive: true });
for (const n of NUEVOS) {
  const titulo = `${n.name.es} / ${n.name.en}`;
  fs.writeFileSync(`public/diagramas/${n.id}.svg`, diagramaSvg(alargar(n.grafico), titulo));
  const ilus = lienzo(ilustracionSvg(alargar(n.grafico), titulo, n.category));
  await sharp(Buffer.from(ilus)).webp({ quality: 82 }).toFile(`public/ilustraciones/${n.id}.webp`);
}

// --- Fichas -------------------------------------------------------------------
const NOTA = "Número del patrón en la revista de referencia (estructura reinterpretada; texto, diagrama e ilustración originales).";
const fichas = NUEVOS.map(({ num, grafico, ...n }) => ({
  id: n.id,
  name: n.name,
  aka: n.aka,
  abbreviation: { es: "—", us: "—", uk: "—" },
  category: n.category,
  difficulty: n.difficulty,
  difficulty_label: NIVELES[n.difficulty],
  worked_in: n.worked_in,
  repeat: n.repeat,
  description: n.description,
  steps: n.steps,
  tips: n.tips ?? { es: [], en: [] },
  uses: n.uses,
  tags: n.tags,
  prerequisites: n.prerequisites,
  related: n.related,
  diagram: {
    file: `diagrams/${n.id}.svg`,
    format: "svg",
    style: "standard_symbols",
    rows_bottom_to_top: grafico,
    themable: "Los trazos usan currentColor: cambiá la propiedad CSS color para tematizar.",
  },
  illustration: {
    webp: `illustrations/${n.id}.webp`,
    width: 1200,
    height: 900,
    style: "generated_yarn",
    license: "original — libre uso en la app",
    alt: { es: `Ilustración de muestra tejida: ${n.name.es}`, en: `Illustrated swatch: ${n.name.en}` },
  },
  images: [],
  source_ref: { pattern_number: num, note: NOTA, needs_review: true },
}));

// Se insertan después del último punto con número menor (para mantener el orden de la revista)
const indice = base.stitches.findLastIndex((s) => (s.source_ref?.pattern_number ?? 0) < 17 && s.source_ref);
base.stitches.splice(indice + 1, 0, ...fichas);

for (const [num, d] of Object.entries(DUPLICADOS)) {
  const s = base.stitches.find((x) => x.id === d.id);
  s.source_ref = { pattern_number: Number(num), note: NOTA };
  if (!s.tips.es.includes(d.tip.es)) {
    s.tips.es.push(d.tip.es);
    s.tips.en.push(d.tip.en);
  }
}

for (const c of base.categories) c.count = base.stitches.filter((s) => s.category === c.id).length;
base.meta.count = base.stitches.length;
base.meta.version = "1.2.0";

fs.writeFileSync(RUTA_BASE, JSON.stringify(base, null, 2) + "\n");
console.log(`✓ ${fichas.length} puntos nuevos · ${Object.keys(DUPLICADOS).length} referencias en puntos existentes · total ${base.stitches.length}`);
