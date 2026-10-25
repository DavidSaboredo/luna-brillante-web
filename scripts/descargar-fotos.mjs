// Descarga fotos reales (Wikimedia Commons) a public/fotos y guarda autor/licencia en src/data/fotos.json.
import fs from "node:fs";
const API = "https://commons.wikimedia.org/w/api.php";
const UA = { "User-Agent": "LunaBrillanteApp/1.0 (educational crochet app)" };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const limpiar = (t) => (t ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").trim();

// id del punto -> archivos de Commons (primero = foto principal, luego revés/otra vista)
const MAPA = {
  slip_knot: [["How to tie a crochet slip knot.jpg", "Cómo hacer el nudo corredizo"]],
  magic_ring: [["Szydełkowe magiczne kółko.jpg", "Anillo mágico armado"]],
  chain: [["Crochet Chain Stitch.jpg", "Cadeneta"]],
  slip_stitch: [["Crochet Slip Stitch.jpg", "Punto raso, derecho"], ["Crochet Slip Stitch (Wrong Side).jpg", "Punto raso, revés"]],
  single_crochet: [["Crochet Single Stitch.jpg", "Punto bajo, derecho"], ["Crochet Single Stitch (Wrong Side).jpg", "Punto bajo, revés"]],
  half_double_crochet: [["Crochet Half Double Stitch.jpg", "Medio punto alto, derecho"], ["Crochet Half Double Stitch (Wrong Side).jpg", "Medio punto alto, revés"]],
  double_crochet: [["Crochet Double Stitch.jpg", "Punto alto, derecho"], ["Crochet Double Stitch (Wrong Side).jpg", "Punto alto, revés"]],
  treble_crochet: [["Crochet Treble.jpg", "Punto alto doble, derecho"], ["Crochet Treble (Wrong Side).jpg", "Punto alto doble, revés"]],
  foundation_single_crochet: [["Crochet Foundation Single Stitch.jpg", "Punto bajo sin cadeneta base"]],
  foundation_double_crochet: [["Crochet Foundation Double Stitch.jpg", "Punto alto sin cadeneta base"]],
  crochet_cord: [["Crochet Cord.jpg", "Cordón de punto bajo"]],
  back_loop_only: [["Crochet Back Loop Single Stitch.jpg", "Punto bajo en hebra trasera, derecho"], ["Crochet Back Loop Single Stitch (Wrong Side).jpg", "Punto bajo en hebra trasera, revés"]],
  extended_single_crochet: [["Crochet Extended Single Stitch.jpg", "Punto bajo extendido, derecho"], ["Crochet Extended Single Stitch (Wrong Side).jpg", "Punto bajo extendido, revés"]],
  waistcoat_stitch: [["Crochet Waistcoat Stitch.jpg", "Punto chaleco, derecho"], ["Crochet Waistcoat Stitch (Wrong Side).jpg", "Punto chaleco, revés"]],
  slip_stitch_fabric: [["Crochet Back Loop Slip Stitch.jpg", "Tejido en punto raso por hebra trasera"]],
  back_post_double_crochet: [["Crochet Back Post Double Stitch.jpg", "Punto alto en relieve por detrás, derecho"], ["Crochet Back Post Double Stitch (Wrong Side).jpg", "Punto alto en relieve por detrás, revés"]],
  moss_stitch: [["Crochet Moss Stitch.jpg", "Punto musgo, derecho"], ["Crochet Moss Stitch (Wrong Side).jpg", "Punto musgo, revés"]],
  trinity_stitch: [["Crochet Trinity Stitch.jpg", "Punto trinidad, derecho"], ["Crochet Trinity Stitch (Wrong Side).jpg", "Punto trinidad, revés"]],
  bean_stitch: [["Crochet Bean Stitch.jpg", "Punto frijol, derecho"], ["Crochet Bean Stitch (Wrong Side).jpg", "Punto frijol, revés"]],
  loop_stitch: [["Crochet Loop Stitch.jpg", "Punto bucle, derecho"], ["Crochet Loop Stitch (Wrong Side).jpg", "Punto bucle, revés"]],
  broomstick_lace: [["Close up broomstick lace.jpg", "Encaje de escoba"]],
  picot: [["Picot edging.jpg", "Borde de picots"]],
  pineapple_lace: [["Pineapple lace - detail.jpg", "Encaje de piña"]],
  granny_square: [["Granny square.jpg", "Cuadrado granny"]],
  filet_mesh: [["Häkelfilet 2.jpg", "Crochet filet"]],
};

async function info(archivo) {
  for (let i = 0; i < 6; i++) {
    await dormir(800);
    const url = `${API}?${new URLSearchParams({ format: "json", action: "query", titles: `File:${archivo}`, prop: "imageinfo", iiprop: "url|extmetadata|mime", iiurlwidth: "1000" })}`;
    const t = await (await fetch(url, { headers: UA })).text();
    try {
      const p = Object.values(JSON.parse(t).query.pages)[0];
      return p.imageinfo?.[0] ?? null;
    } catch { await dormir(5000 * (i + 1)); }
  }
  return null;
}

async function bajar(url, destino) {
  for (let i = 0; i < 6; i++) {
    await dormir(1200);
    const r = await fetch(url, { headers: UA });
    if (r.ok) { fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer())); return true; }
    await dormir(4000 * (i + 1));
  }
  return false;
}

fs.mkdirSync("public/fotos", { recursive: true });
const salida = {};
for (const [id, lista] of Object.entries(MAPA)) {
  salida[id] = [];
  for (const [n, [archivo, leyenda]] of lista.entries()) {
    const ii = await info(archivo);
    if (!ii) { console.log("SIN INFO", archivo); continue; }
    const m = ii.extmetadata ?? {};
    const ext = ii.mime === "image/png" ? "png" : "jpg";
    const nombre = `${id}-${n + 1}.${ext}`;
    if (!(await bajar(ii.thumburl ?? ii.url, `public/fotos/${nombre}`))) { console.log("FALLO", archivo); continue; }
    salida[id].push({
      archivo: `/fotos/${nombre}`,
      leyenda,
      autor: limpiar(m.Artist?.value) || "Autor desconocido",
      licencia: limpiar(m.LicenseShortName?.value),
      urlLicencia: limpiar(m.LicenseUrl?.value) || null,
      pagina: ii.descriptionurl,
    });
    console.log("OK", nombre, "|", limpiar(m.LicenseShortName?.value), "|", limpiar(m.Artist?.value).slice(0, 40));
  }
}
fs.writeFileSync("src/data/fotos.json", JSON.stringify(salida, null, 1));
