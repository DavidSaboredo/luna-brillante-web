import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

/** Texturas de tejido dibujadas en canvas: color + relieve (bump), para los modelos 3D. */
export interface TexturaTejido {
  map: Texture;
  bump: Texture;
  /** Mapa de normales (relieve de las puntadas + torsión fina del hilo) */
  normal: Texture;
  /** Tamaño real del motivo repetido, en cm */
  tamCm: number;
  transparente: boolean;
}

const TAM = 192;
const cache = new Map<string, TexturaTejido>();

function mezclar(hex: string, k: number) {
  // k > 0 aclara, k < 0 oscurece
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.max(0, Math.min(255, k >= 0 ? v + (255 - v) * k : v * (1 + k)))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

type Ctx = CanvasRenderingContext2D;
/** Dibuja un trazo en el color y en el relieve a la vez. */
type Trazo = (c: Ctx, modo: "color" | "bump", claro: string, oscuro: string, base: string) => void;

function ruido(c: Ctx, base: string) {
  // fibras muy finas para que no se vea plano
  for (let i = 0; i < 520; i++) {
    const x = Math.random() * TAM,
      y = Math.random() * TAM,
      l = 2 + Math.random() * 4,
      a = Math.random() * Math.PI;
    c.strokeStyle = Math.random() > 0.5 ? mezclar(base, 0.12) : mezclar(base, -0.12);
    c.globalAlpha = 0.35;
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  c.globalAlpha = 1;
}

/** Hilera de puntos en V (punto bajo), repetida. */
const bajo: Trazo = (c, modo, claro, oscuro) => {
  const filas = 8,
    cols = 8,
    w = TAM / cols,
    h = TAM / filas;
  for (let f = 0; f < filas; f++)
    for (let k = 0; k < cols; k++) {
      const x = k * w + (f % 2 ? w / 2 : 0),
        y = f * h;
      c.lineCap = "round";
      c.lineWidth = modo === "bump" ? 5 : 4.4;
      c.strokeStyle = modo === "bump" ? "#fff" : claro;
      c.beginPath();
      c.moveTo(x + w * 0.12, y + h * 0.18);
      c.lineTo(x + w * 0.5, y + h * 0.82);
      c.lineTo(x + w * 0.88, y + h * 0.18);
      c.stroke();
      if (modo === "color") {
        c.lineWidth = 1.2;
        c.strokeStyle = oscuro;
        c.beginPath();
        c.moveTo(x + w * 0.12, y + h * 0.3);
        c.lineTo(x + w * 0.5, y + h * 0.94);
        c.lineTo(x + w * 0.88, y + h * 0.3);
        c.stroke();
      }
    }
};

const relieve: Trazo = (c, modo, claro, oscuro) => {
  const cols = 8,
    w = TAM / cols;
  for (let k = 0; k < cols; k++) {
    const x = k * w + w / 2;
    c.lineCap = "round";
    c.lineWidth = modo === "bump" ? 11 : 9;
    c.strokeStyle = modo === "bump" ? "#fff" : claro;
    c.beginPath();
    c.moveTo(x, 4);
    c.lineTo(x, TAM - 4);
    c.stroke();
    if (modo === "color") {
      c.lineWidth = 1.5;
      c.strokeStyle = oscuro;
      for (let y = 8; y < TAM; y += 10) {
        c.beginPath();
        c.moveTo(x - 4, y);
        c.lineTo(x + 4, y + 4);
        c.stroke();
      }
    }
  }
};

const red: Trazo = (c, modo, claro, oscuro) => {
  const n = 5,
    t = TAM / n;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (let i = -1; i <= n; i++)
    for (let j = -1; j <= n; j++) {
      const cx = i * t + (j % 2 ? t / 2 : 0),
        cy = j * t;
      // rombo calado: el hueco queda oscuro/hundido
      c.lineWidth = modo === "bump" ? 9 : 7;
      c.strokeStyle = modo === "bump" ? "#fff" : claro;
      c.beginPath();
      c.moveTo(cx, cy - t * 0.42);
      c.lineTo(cx + t * 0.42, cy);
      c.lineTo(cx, cy + t * 0.42);
      c.lineTo(cx - t * 0.42, cy);
      c.closePath();
      c.stroke();
      if (modo === "color") {
        c.fillStyle = "rgba(40,30,50,0.28)";
        c.fill();
        c.lineWidth = 1.4;
        c.strokeStyle = oscuro;
        c.stroke();
      }
    }
};

const concha: Trazo = (c, modo, claro, oscuro) => {
  const n = 4,
    t = TAM / n;
  c.lineCap = "round";
  for (let j = -1; j <= n; j++)
    for (let i = -1; i <= n; i++) {
      const cx = i * t + (j % 2 ? t / 2 : 0),
        cy = j * t * 0.7 + t * 0.75;
      for (let k = 0; k < 5; k++) {
        const ang = Math.PI * (1.15 + (k * 0.7) / 4);
        c.lineWidth = modo === "bump" ? 8 : 6.5;
        c.strokeStyle = modo === "bump" ? "#fff" : claro;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(ang) * t * 0.52, cy + Math.sin(ang) * t * 0.62);
        c.stroke();
        if (modo === "color") {
          c.lineWidth = 1.2;
          c.strokeStyle = oscuro;
          c.beginPath();
          c.moveTo(cx + 2, cy + 1);
          c.lineTo(cx + Math.cos(ang) * t * 0.52 + 2, cy + Math.sin(ang) * t * 0.62 + 1);
          c.stroke();
        }
      }
    }
};

const granny: Trazo = (c, modo, claro, oscuro, base) => {
  c.lineJoin = "round";
  const lado = TAM - 16;
  for (let r = 0; r < 4; r++) {
    const m = 8 + r * 20,
      s = lado - r * 40;
    c.lineWidth = modo === "bump" ? 12 : 10;
    c.strokeStyle = modo === "bump" ? "#fff" : r % 2 ? mezclar(base, -0.12) : claro;
    c.strokeRect(m, m, s, s);
    if (modo === "color") {
      c.lineWidth = 1.2;
      c.strokeStyle = oscuro;
      c.strokeRect(m + 5, m + 5, s - 10, s - 10);
    }
  }
  c.fillStyle = modo === "bump" ? "#fff" : claro;
  c.beginPath();
  c.arc(TAM / 2, TAM / 2, 12, 0, Math.PI * 2);
  c.fill();
};

const motas: Trazo = (c, modo, claro, oscuro) => {
  const n = 5,
    t = TAM / n;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const cx = i * t + t / 2 + (j % 2 ? t / 2 : 0),
        cy = j * t + t / 2;
      const g = c.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, t * 0.42);
      g.addColorStop(0, modo === "bump" ? "#fff" : claro);
      g.addColorStop(1, modo === "bump" ? "#666" : oscuro);
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, t * 0.38, 0, Math.PI * 2);
      c.fill();
    }
};

const flores: Trazo = (c, modo, claro, oscuro, base) => {
  const n = 3,
    t = TAM / n;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const cx = i * t + t / 2,
        cy = j * t + t / 2;
      for (let k = 0; k < 5; k++) {
        const a = (k * Math.PI * 2) / 5;
        c.fillStyle = modo === "bump" ? "#fff" : k % 2 ? claro : mezclar(base, 0.2);
        c.beginPath();
        c.ellipse(cx + Math.cos(a) * t * 0.2, cy + Math.sin(a) * t * 0.2, t * 0.16, t * 0.1, a, 0, Math.PI * 2);
        c.fill();
        if (modo === "color") {
          c.strokeStyle = oscuro;
          c.lineWidth = 1;
          c.stroke();
        }
      }
      c.fillStyle = modo === "bump" ? "#aaa" : mezclar(base, -0.35);
      c.beginPath();
      c.arc(cx, cy, t * 0.07, 0, Math.PI * 2);
      c.fill();
    }
};

const tunecino: Trazo = (c, modo, claro, oscuro) => {
  const n = 10,
    t = TAM / n;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      c.lineWidth = modo === "bump" ? 5 : 4;
      c.strokeStyle = modo === "bump" ? "#fff" : claro;
      c.beginPath();
      c.moveTo(i * t + t / 2, j * t + 1);
      c.lineTo(i * t + t / 2, j * t + t - 1);
      c.stroke();
      if (modo === "color") {
        c.lineWidth = 1;
        c.strokeStyle = oscuro;
        c.beginPath();
        c.moveTo(i * t + 1, j * t + t - 1);
        c.lineTo(i * t + t - 1, j * t + t - 1);
        c.stroke();
      }
    }
};

/** Telas: tramado fino. */
const tejido = (paso: number, diagonal = false, grosor = 1.6): Trazo => (c, modo, claro, oscuro) => {
  c.lineWidth = grosor;
  for (let i = -TAM; i < TAM * 2; i += paso) {
    c.strokeStyle = modo === "bump" ? "rgba(255,255,255,0.8)" : claro;
    c.beginPath();
    if (diagonal) {
      c.moveTo(i, 0);
      c.lineTo(i + TAM, TAM);
    } else {
      c.moveTo(i, 0);
      c.lineTo(i, TAM);
      c.moveTo(0, i);
      c.lineTo(TAM, i);
    }
    c.stroke();
    if (modo === "color" && !diagonal) {
      c.strokeStyle = oscuro;
      c.lineWidth = 0.6;
    }
  }
};

const tul: Trazo = (c, modo, claro) => {
  const t = 8;
  for (let y = 0; y < TAM; y += t)
    for (let x = 0; x < TAM; x += t) {
      c.fillStyle = modo === "bump" ? "#999" : claro;
      c.beginPath();
      c.arc(x + (y / t) % 2 * (t / 2), y, 1.5, 0, Math.PI * 2);
      c.fill();
    }
};

const DIBUJOS: Record<string, { trazo: Trazo; tam: number; transp?: boolean; fondoBump?: string }> = {
  bajo: { trazo: bajo, tam: 3 },
  relieve: { trazo: relieve, tam: 3.2 },
  red: { trazo: red, tam: 5 },
  concha: { trazo: concha, tam: 6 },
  granny: { trazo: granny, tam: 8 },
  motas: { trazo: motas, tam: 4.5 },
  flores: { trazo: flores, tam: 9 },
  tunecino: { trazo: tunecino, tam: 3 },
  lino: { trazo: tejido(6), tam: 3 },
  algodon: { trazo: tejido(10, false, 1), tam: 3 },
  gasa: { trazo: tejido(14, false, 0.8), tam: 4, transp: true },
  tul: { trazo: tul, tam: 3, transp: true },
  denim: { trazo: tejido(5, true, 2), tam: 3 },
};

/** Convierte el mapa de alturas (gris) en un mapa de normales con un filtro de Sobel, repetible sin costuras. */
function normalDesdeAltura(origen: HTMLCanvasElement, fuerza: number): HTMLCanvasElement {
  const n = origen.width;
  const c = origen.getContext("2d")!;
  const src = c.getImageData(0, 0, n, n).data;
  const h = (x: number, y: number) => src[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;
  const dst = document.createElement("canvas");
  dst.width = dst.height = n;
  const dc = dst.getContext("2d")!;
  const out = dc.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1);
      const dy = h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1);
      let nx = -dx * fuerza,
        ny = dy * fuerza,
        nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      const i = (y * n + x) * 4;
      out.data[i] = (nx * 0.5 + 0.5) * 255;
      out.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      out.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  dc.putImageData(out, 0, 0);
  return dst;
}

/** Torsión fina del hilo: rayitas diagonales sobre el relieve, para que cada puntada parezca lana y no plástico. */
function torsionDeHilo(c: Ctx) {
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineWidth = 1.1;
  c.strokeStyle = "rgba(255,255,255,0.075)";
  for (let i = -TAM; i < TAM * 2; i += 4) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i + TAM * 0.55, TAM);
    c.stroke();
  }
  c.restore();
}

export function crearTextura(textura: string, color: string): TexturaTejido {
  const clave = `${textura}|${color}`;
  const hecha = cache.get(clave);
  if (hecha) return hecha;

  const d = DIBUJOS[textura] ?? DIBUJOS.bajo;
  const hacer = (modo: "color" | "bump") => {
    const lienzo = document.createElement("canvas");
    lienzo.width = lienzo.height = TAM;
    const c = lienzo.getContext("2d")!;
    c.fillStyle = modo === "bump" ? "#202020" : mezclar(color, -0.22);
    c.fillRect(0, 0, TAM, TAM);
    d.trazo(c, modo, mezclar(color, 0.1), mezclar(color, -0.45), color);
    if (modo === "color") ruido(c, color);
    if (modo === "bump") torsionDeHilo(c);
    const t = new CanvasTexture(lienzo);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 4;
    if (modo === "color") t.colorSpace = SRGBColorSpace;
    return t;
  };
  const bump = hacer("bump");
  const normalCanvas = normalDesdeAltura(bump.image as HTMLCanvasElement, 3.4);
  const normal = new CanvasTexture(normalCanvas);
  normal.wrapS = normal.wrapT = RepeatWrapping;
  normal.anisotropy = 8;
  const res = { map: hacer("color"), bump, normal, tamCm: d.tam, transparente: false };
  cache.set(clave, res);
  return res;
}
