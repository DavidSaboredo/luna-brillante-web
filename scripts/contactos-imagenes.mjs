// Hojas de contacto para inspección; no modifica los recursos del proyecto.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = process.argv[2] || 'public';
const destination = process.argv[3] || 'output/image-quality/contactos';
const files = (await fs.readdir(source, { recursive: true }))
  .filter(file => /\.(webp|png|jpe?g)$/i.test(file))
  .sort();
await fs.mkdir(destination, { recursive: true });
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
for (let start = 0; start < files.length; start += 20) {
  const batch = files.slice(start, start + 20);
  const layers = [];
  for (let index = 0; index < batch.length; index++) {
    const file = batch[index];
    const left = (index % 4) * 320;
    const top = Math.floor(index / 4) * 270;
    layers.push({ input: await sharp(path.join(source, file)).resize(310, 235, { fit: 'contain', background: '#eeeeee' }).png().toBuffer(), left, top });
    const label = `${start + index + 1}. ${file.replaceAll('\\', '/')}`;
    layers.push({ input: Buffer.from(`<svg width="320" height="30"><rect width="320" height="30" fill="white"/><text x="3" y="18" font-size="11" font-family="Arial">${escape(label)}</text></svg>`), left, top: top + 235 });
  }
  await sharp({ create: { width: 1280, height: Math.ceil(batch.length / 4) * 270, channels: 3, background: '#ffffff' } }).composite(layers).jpeg({ quality: 90 }).toFile(path.join(destination, `hoja-${String(start / 20 + 1).padStart(2, '0')}.jpg`));
}
console.log(`${files.length} imágenes; ${Math.ceil(files.length / 20)} hojas en ${destination}`);
