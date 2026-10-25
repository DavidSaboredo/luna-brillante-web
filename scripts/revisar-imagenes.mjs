import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const informe = JSON.parse(await fs.readFile('output/image-quality/informe.json', 'utf8'));
const mapa = JSON.parse(await fs.readFile('src/data/imagenes-mejoradas.json', 'utf8'));
const puntos = JSON.parse(await fs.readFile('src/data/puntos.json', 'utf8')).stitches;
const fotos = JSON.parse(await fs.readFile('src/data/fotos.json', 'utf8'));
const proyectos = JSON.parse(await fs.readFile('src/data/proyectos.json', 'utf8')).proyectos;
const pasos = JSON.parse(await fs.readFile('src/data/fotos-revista.json', 'utf8'));
const archivos = (await fs.readdir('public', { recursive: true })).map(f => f.replaceAll('\\', '/'))
  .filter(f => /^(fotos|ilustraciones|revista)\/.*\.(webp|jpe?g|png)$/i.test(f));
const errores = [];
const tipos = {};
const vistos = new Set();
for (const entrada of informe) {
  const original = await fs.readFile(path.join('public', entrada.original.slice(1)));
  const hash = crypto.createHash('sha256').update(original).digest('hex');
  if (hash !== entrada.sha256Original) errores.push(`Original modificado: ${entrada.original}`);
  if (mapa[entrada.original] !== entrada.mejorada) errores.push(`Mapa incorrecto: ${entrada.original}`);
  const { info } = await sharp(path.join('public', entrada.mejorada.slice(1))).raw().toBuffer({ resolveWithObject: true });
  if (info.width !== entrada.dimensiones[0] || info.height !== entrada.dimensiones[1]) errores.push(`Dimensiones incorrectas: ${entrada.mejorada}`);
  if (vistos.has(entrada.mejorada)) errores.push(`Destino duplicado: ${entrada.mejorada}`);
  vistos.add(entrada.mejorada);
  tipos[entrada.tipo] = (tipos[entrada.tipo] ?? 0) + 1;
}
for (const archivo of archivos) if (!mapa['/' + archivo]) errores.push(`Imagen sin procesar: ${archivo}`);
const referencias = [
  ...Object.values(fotos).flat().map(f => f.archivo),
  ...Object.values(pasos).map(p => p.src),
  ...proyectos.flatMap(p => [p.portada, ...p.imagenes.map(i => i.src)]),
  ...puntos.filter(p => p.illustration).map(p => `/ilustraciones/${p.illustration.webp.split('/').pop()}`),
  ...['aguja-y-hebra', 'union-motivos', 'union-prendas'].map(id => `/revista/pasos/${id}.webp`),
];
for (const referencia of referencias) if (!mapa[referencia]) errores.push(`Referencia sin versión: ${referencia}`);
if (informe.length !== archivos.length || Object.keys(mapa).length !== archivos.length) errores.push('Recuento de catálogo incorrecto');
if (errores.length) throw new Error(errores.join('\n'));

const nombres = new Map(puntos.map(p => [p.id, p.name.es]));
const escapar = texto => String(texto).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const local = ruta => '../../public' + ruta.split('/').map(encodeURIComponent).join('/');
const tarjetas = informe.map(entrada => {
  const id = path.basename(entrada.original).replace(/\.(webp|jpe?g|png)$/i, '').replace(/-[12]$/, '');
  const nombre = nombres.get(id) ?? proyectos.find(p => p.id === id)?.titulo ?? id.replaceAll('-', ' ').replaceAll('_', ' ');
  return `<article data-busqueda="${escapar((nombre + ' ' + entrada.original + ' ' + entrada.tipo).toLowerCase())}" data-tipo="${entrada.tipo}">
    <h2>${escapar(nombre)}</h2><p class="archivo">${escapar(entrada.original)} · ${escapar(entrada.tipo)}</p>
    <div class="par"><figure><a href="${local(entrada.original)}"><img loading="lazy" src="${local(entrada.original)}" alt="Original: ${escapar(nombre)}"></a><figcaption>Original · ${entrada.dimensionesOriginales.join(' × ')}</figcaption></figure>
    <figure><a href="${local(entrada.mejorada)}"><img loading="lazy" src="${local(entrada.mejorada)}" alt="Mejorada: ${escapar(nombre)}"></a><figcaption>Mejorada · ${entrada.dimensiones.join(' × ')}</figcaption></figure></div>
    ${entrada.limitacion ? `<p class="nota">${escapar(entrada.limitacion)}</p>` : ''}</article>`;
}).join('\n');
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luna Brillante · Imágenes antes y después</title>
<style>*{box-sizing:border-box}body{margin:0;background:#fbf7f4;color:#4a4458;font:16px system-ui,sans-serif}header,main{max-width:1180px;margin:auto;padding:24px}h1{font:40px Georgia,serif;margin:8px 0}h2{font:24px Georgia,serif;margin:0}header p{max-width:800px;line-height:1.6}.controles{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}input,select{font:inherit;padding:12px;border:1px solid #d9cdf0;border-radius:10px;background:white}input{flex:1;min-width:220px}article{margin-bottom:28px;border:1px solid #e4dbea;border-radius:18px;padding:20px;background:white}.archivo{font-size:12px;color:#777;overflow-wrap:anywhere}.par{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;min-width:0}img{width:100%;height:340px;object-fit:contain;background:#f5f1f7;border-radius:10px}figcaption{padding:10px;text-align:center;font-size:13px}.nota{font-size:13px;color:#795e30;background:#fff7e4;padding:12px;border-radius:8px}[hidden]{display:none!important}@media(max-width:600px){.par{grid-template-columns:1fr}img{height:300px}header,main{padding:16px}h1{font-size:32px}}</style>
<header><p>LUNA BRILLANTE TEJIDOS</p><h1>El catálogo, en lavanda</h1><p>${informe.length} imágenes revisadas con edición local. Las versiones mejoradas conservan las puntadas y los originales siguen disponibles. Tocá una imagen para verla completa. La ampliación mejora la presentación; no reconstruye información perdida.</p><div class="controles"><input id="buscar" type="search" placeholder="Buscar un punto o un archivo" aria-label="Buscar imagen"><select id="tipo" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>${Object.keys(tipos).map(t => `<option>${t}</option>`).join('')}</select></div><p id="cantidad">${informe.length} imágenes</p></header><main>${tarjetas}</main>
<script>const buscar=document.querySelector('#buscar'),tipo=document.querySelector('#tipo'),tarjetas=[...document.querySelectorAll('article')];function filtrar(){let n=0;const q=buscar.value.toLocaleLowerCase('es').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');for(const t of tarjetas){const coincide=t.dataset.busqueda.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').includes(q)&&(!tipo.value||t.dataset.tipo===tipo.value);t.hidden=!coincide;if(coincide)n++}document.querySelector('#cantidad').textContent=n+' imágenes'}buscar.addEventListener('input',filtrar);tipo.addEventListener('change',filtrar);</script></html>`;
await fs.writeFile('output/image-quality/antes-despues.html', html);
const resumen = { imagenes: informe.length, originalesIntactos: true, referenciasVerificadas: referencias.length, tipos, recortes: informe.filter(e => e.recorte.width !== e.dimensionesOriginales[0] || e.recorte.height !== e.dimensionesOriginales[1]).length, limitaciones: informe.filter(e => e.limitacion).length };
await fs.writeFile('output/image-quality/verificacion.json', JSON.stringify(resumen, null, 2) + '\n');
console.log(JSON.stringify(resumen, null, 2));
console.log('Comparador: output/image-quality/antes-despues.html');
