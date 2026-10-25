// Edición local y reproducible: jamás modifica los originales ni reconstruye puntos.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { recortes, prendas, bajaCalidad } from './ajustes-imagenes.mjs';

sharp.concurrency(2);
const raiz = path.resolve('public');
const destino = path.join(raiz, 'mejoradas');
const filtro = process.argv.slice(2);
const archivos = (await fs.readdir(raiz, { recursive: true }))
  .map(file => file.replaceAll('\\', '/'))
  .filter(file => /^(fotos|ilustraciones|revista)\/.*\.(webp|jpe?g|png)$/i.test(file))
  .filter(file => !filtro.length || filtro.some(valor => file.includes(valor))).sort();
const limitar = (valor, minimo = 0, maximo = 1) => Math.min(maximo, Math.max(minimo, valor));
const suave = (a, b, valor) => { const t = limitar((valor - a) / (b - a)); return t * t * (3 - 2 * t); };
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function hsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, max ? delta / max : 0, max / 255];
}

function dentro(x, y, poligono) {
  let resultado = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i], [xj, yj] = poligono[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) resultado = !resultado;
  }
  return resultado;
}

function clasificar(archivo, nombre) {
  if (archivo.startsWith('ilustraciones/')) return 'ilustracion';
  if (archivo.startsWith('fotos/')) return archivo.endsWith('-2.webp') ? 'diagrama' : archivo.endsWith('.webp') ? 'muestra-revista' : 'foto';
  if (prendas[nombre]) return 'prenda';
  if (archivo.includes('/pasos/')) return 'pasos';
  if (['top-cuadrado', 'sueter-flores', 'jean-encaje'].includes(nombre)) return 'mixta';
  return 'diagrama';
}

function mascara(archivo, nombre, tipo, r, g, b, x, y) {
  const [h, s, v] = hsv(r, g, b);
  if (tipo === 'diagrama') return 0;
  if (tipo === 'ilustracion') {
    // El fondo crema tiene baja saturación; quedan intactas sus sombras suaves.
    return suave(0.11, 0.15, s);
  }
  if (tipo === 'muestra-revista') return 1 - (suave(0.82, 0.98, v) * (1 - suave(0.08, 0.20, s)));
  if (tipo === 'prenda') {
    const ajuste = prendas[nombre];
    if (!ajuste.poligonos.some(p => dentro(x, y, p)) || ajuste.excluir?.some(p => dentro(x, y, p))) return 0;
    if (ajuste.modo === 'oliva') return suave(30, 37, h) * (1 - suave(82, 100, h)) * suave(0.05, 0.12, s);
    if (ajuste.modo === 'bolso') return 1;
    const crema = (1 - suave(0.22, 0.34, s)) * suave(0.27, 0.52, v) * (1 - suave(1.24, 1.40, r / Math.max(b, 1)));
    if (ajuste.modo === 'top') return Math.max(crema, h > 42 && h < 250 ? suave(0.08, 0.17, s) : 0);
    return crema * (h < 85 || s < 0.09 ? 1 : 0);
  }
  if (tipo === 'mixta') {
    const region = nombre === 'top-cuadrado' ? x < 0.46 && y > 0.12
      : nombre === 'jean-encaje' ? y < 0.51
      : y > 0.56 && ((x > 0.27 && x < 0.52) || x > 0.77);
    return region ? 1 - suave(0.91, 0.99, v) : 0;
  }
  if (tipo === 'pasos') {
    // Las áreas de texto y las manos nunca reciben una colorización global.
    if (y < 0.12) return 0;
    if (/dc2tog|dc_increase|reverse_single|treble_crochet/.test(nombre)) {
      if (y > (nombre === 'dc2tog-1' ? 0.55 : nombre === 'dc_increase-1' ? 0.70 : 0.65)) return 0;
      return suave(0.16, 0.35, s) * (h > 40 && h < 170 || h > 345 || h < 12 ? 1 : 0);
    }
    // En las fotos de pasos el tinte del escaneo mezcla piel, hilo y reflejos.
    // La inspección visual mostró parches: se conserva su color original completo.
    return 0;
  }
  if (nombre === 'slip_knot-1') return h > 265 && h < 335 ? suave(0.09, 0.22, s) : 0;
  if (nombre === 'magic_ring-1') return h > 300 && h < 360 ? suave(0.12, 0.30, s) : 0;
  if (nombre === 'broomstick_lace-1') return h > 315 || h < 12 ? suave(0.25, 0.45, s) : 0;
  if (nombre === 'granny_square-1') return suave(0.11, 0.28, v);
  if (nombre === 'pineapple_lace-1') return (1 - suave(0.11, 0.23, s)) * suave(0.28, 0.55, v);
  if (nombre === 'filet_mesh-1') return suave(0.40, 0.65, v);
  if (nombre === 'picot-1') return h > 170 && h < 330 ? suave(0.10, 0.30, s) : 0;
  // Muestras azules/amarillas fotografiadas sobre madera: máscara por tono.
  const azul = suave(155, 175, h) * (1 - suave(245, 265, h)) * suave(0.12, 0.30, s);
  const amarillo = suave(36, 43, h) * (1 - suave(76, 87, h)) * suave(0.35, 0.55, s) * suave(0.20, 0.35, v);
  return Math.max(azul, amarillo);
}

function percentil(hist, total, p) {
  let acumulado = 0;
  for (let i = 0; i < 256; i++) { acumulado += hist[i]; if (acumulado >= total * p) return i; }
  return 255;
}

const entradas = [];
for (const archivo of archivos) {
  const nombre = path.basename(archivo, path.extname(archivo));
  const tipo = clasificar(archivo, nombre);
  const original = await fs.readFile(path.join(raiz, archivo));
  const meta = await sharp(original).metadata();
  const relativo = recortes[nombre] ?? [0, 0, 1, 1];
  const left = Math.round(relativo[0] * meta.width), top = Math.round(relativo[1] * meta.height);
  const width = Math.min(meta.width - left, Math.round(relativo[2] * meta.width));
  const height = Math.min(meta.height - top, Math.round(relativo[3] * meta.height));
  const region = { left, top, width, height };
  let entrada = sharp(original).rotate().extract(region).removeAlpha().toColourspace('srgb');
  // Ajustes moderados para papel gris y fotos subexpuestas; sin umbral binario.
  if (['diagrama', 'pasos', 'mixta'].includes(tipo)) entrada = entrada.normalise({ lower: 0.3, upper: 99.5 });
  const { data, info } = await entrada.raw().toBuffer({ resolveWithObject: true });
  if (tipo === 'diagrama') {
    // Compensa la iluminación del papel sin redibujar líneas ni binarizar símbolos.
    const fondo = await sharp(data, { raw: { width, height, channels: 3 } }).blur(25).raw().toBuffer();
    for (let i = 0; i < data.length; i++) {
      const nivelado = data[i] * 255 / Math.max(170, fondo[i]);
      data[i] = Math.round(limitar(255 - (255 - nivelado) * 1.07, 0, 255));
    }
  }
  const mask = Buffer.alloc(info.width * info.height);
  const sobreMadera = tipo === 'foto' && !/^(slip_knot|magic_ring|broomstick_lace|granny_square|pineapple_lace|filet_mesh|picot)-/.test(nombre);
  const hist = new Uint32Array(256);
  let total = 0;
  for (let pixel = 0; pixel < mask.length; pixel++) {
    const offset = pixel * 3;
    const x = ((pixel % info.width) + left) / meta.width;
    const y = (Math.floor(pixel / info.width) + top) / meta.height;
    const peso = mascara(archivo, nombre, tipo, data[offset], data[offset + 1], data[offset + 2], x, y);
    mask[pixel] = Math.round(peso * 255);
    if (peso > 0.5) { hist[Math.round(luma(data[offset], data[offset + 1], data[offset + 2]))]++; total++; }
  }
  // Antialias suave de la selección, sin difuminar la textura de las puntadas.
  const suaveMask = total ? await sharp(mask, { raw: { width, height, channels: 1 } }).blur(0.5).greyscale().raw().toBuffer() : mask;
  if (suaveMask.length !== width * height || info.channels !== 3) throw new Error(`Canales inesperados: ${archivo}`);
  const bajo = total ? percentil(hist, total, 0.01) : 0;
  const alto = total ? percentil(hist, total, 0.99) : 255;
  for (let pixel = 0; pixel < mask.length; pixel++) {
    const peso = suaveMask[pixel] / 255;
    if (!peso && !sobreMadera) continue;
    const offset = pixel * 3;
    const lum = luma(data[offset], data[offset + 1], data[offset + 2]);
    // La curva es monótona: conserva bordes, huecos y separación de las hebras.
    let valor;
    if (tipo === 'ilustracion') valor = lum / 255;
    else if (tipo === 'pasos') valor = 0.35 + 0.55 * Math.pow(lum / 255, 0.7);
    else if (tipo === 'prenda' || tipo === 'mixta') valor = 0.08 + 0.90 * lum / 255;
    else valor = 0.20 + 0.70 * Math.pow(limitar((lum - bajo) / Math.max(35, alto - bajo)), 0.70);
    if (sobreMadera) {
      // Base neutra continua: evita restos azules/amarillos y bordes recortados.
      // La madera conserva su textura en gris; el hilo recibe el tono lavanda.
      const gris = Math.round(valor * 255);
      data[offset] = data[offset + 1] = data[offset + 2] = gris;
    }
    const tono = [0.80, 0.72, 0.91];
    for (let canal = 0; canal < 3; canal++) {
      // Una sola familia lavanda, con luces y sombras de la imagen original.
      const color = valor < 0.75 ? 255 * tono[canal] * valor / 0.75 : 255 * (tono[canal] + (1 - tono[canal]) * (valor - 0.75) / 0.25);
      data[offset + canal] = Math.round(limitar(data[offset + canal] * (1 - peso) + color * peso, 0, 255));
    }
  }
  const escala = tipo === 'ilustracion' ? 1 : Math.min(2, Math.max(1, (tipo === 'pasos' ? 2200 : 1600) / Math.max(width, height)));
  const salida = archivo.replace(/\.(jpe?g|png)$/i, '.webp');
  const rutaSalida = path.join(destino, salida);
  await fs.mkdir(path.dirname(rutaSalida), { recursive: true });
  const resultado = await sharp(data, { raw: { width, height, channels: 3 } })
    .resize(Math.round(width * escala), Math.round(height * escala), { kernel: 'lanczos3' })
    .sharpen({ sigma: tipo === 'ilustracion' ? 0.5 : 0.7, m1: 0.4, m2: 1.2, x1: 2, y2: 5, y3: 5 })
    .webp({ quality: 94, effort: 4, lossless: tipo === 'diagrama' || tipo === 'ilustracion' })
    .toFile(rutaSalida);
  entradas.push({ original: '/' + archivo, mejorada: '/mejoradas/' + salida, tipo, sha256Original: crypto.createHash('sha256').update(original).digest('hex'),
    dimensionesOriginales: [meta.width, meta.height], recorte: region, dimensiones: [resultado.width, resultado.height], bytes: resultado.size,
    color: total ? 'lavanda pastel; máscara selectiva' : 'conservado para fidelidad técnica/piel',
    fondo: sobreMadera ? 'Madera neutralizada a gris, con textura original.' : 'Conservado',
    limitacion: bajaCalidad.has(nombre) && !archivo.endsWith('.jpg') ? 'Fuente con desenfoque o reflejos; mejora conservadora, sin reconstrucción de detalle.' : null });
  if (entradas.length % 20 === 0) console.log(`${entradas.length}/${archivos.length}`);
}

await fs.mkdir('output/image-quality', { recursive: true });
const reporte = filtro.length ? 'muestra' : 'informe';
await fs.writeFile(`output/image-quality/${reporte}.json`, JSON.stringify(entradas, null, 2) + '\n');
let catalogo = entradas;
if (filtro.length) {
  try {
    const anterior = JSON.parse(await fs.readFile('output/image-quality/informe.json', 'utf8'));
    const nuevas = new Map(entradas.map(e => [e.original, e]));
    catalogo = anterior.map(e => nuevas.get(e.original) ?? e);
    for (const e of entradas) if (!anterior.some(a => a.original === e.original)) catalogo.push(e);
    await fs.writeFile('output/image-quality/informe.json', JSON.stringify(catalogo, null, 2) + '\n');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
if (!filtro.length || catalogo.length > entradas.length) {
  const mapa = Object.fromEntries(catalogo.map(e => [e.original, e.mejorada]));
  await fs.writeFile('src/data/imagenes-mejoradas.json', JSON.stringify(mapa, null, 2) + '\n');
}
console.log(`Listo: ${entradas.length} imágenes, ${entradas.filter(e => JSON.stringify(e.dimensionesOriginales) !== JSON.stringify([e.recorte.width, e.recorte.height])).length} recortes. Originales intactos.`);
