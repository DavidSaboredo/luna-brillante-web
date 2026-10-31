// Genera los íconos de la app (PWA y Play Store) a partir de un SVG: node scripts/hacer-iconos.mjs
import sharp from "sharp";

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#7a5fb0"/><path d="M300 110a150 150 0 1 0 100 255 125 125 0 0 1-100-255z" fill="#fbf7f4"/><circle cx="372" cy="150" r="14" fill="#fbf7f4"/><circle cx="410" cy="215" r="8" fill="#fbf7f4"/></svg>`);
for (const [n, f] of [[192, "icono-192"], [512, "icono-512"], [180, "apple-touch-icon"]]) {
  await sharp(svg).resize(n, n).png().toFile(`public/icons/${f}.png`);
}
