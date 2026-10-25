import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve('public');
const files = (await fs.readdir(root, { recursive: true }))
  .filter(file => /\.(jpe?g|png|webp)$/i.test(file) && !file.startsWith('mejoradas'))
  .sort();
const groups = new Map();
for (const file of files) {
  const buffer = await fs.readFile(path.join(root, file));
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const { width, height } = await sharp(buffer).metadata();
  if (!groups.has(hash)) groups.set(hash, []);
  groups.get(hash).push({ file: file.replaceAll('\\', '/'), width, height, bytes: buffer.length });
}
await fs.mkdir('output/image-quality', { recursive: true });
await fs.writeFile('output/image-quality/inventory.json', JSON.stringify([...groups.values()], null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, unique: groups.size, duplicateGroups: [...groups.values()].filter(group => group.length > 1) }, null, 2));
