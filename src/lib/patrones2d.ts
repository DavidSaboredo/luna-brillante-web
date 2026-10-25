// Patrón plano (2D) de cada prenda: las piezas a tejer dibujadas a escala real, acomodadas como en un taller de moldería.
import { cintura } from "./medidas";
import type { Contexto, Pieza, Prenda } from "./taller";

export type Forma = "rect" | "torso" | "medio_torso" | "manga" | "trapecio" | "triangulo" | "bombacha" | "circulo" | "paño";

export interface PiezaPlana {
  /** Zona de la prenda a la que pertenece (para pintar y seleccionar) */
  zona: string;
  clave: string;
  pieza: Pieza;
  forma: Forma;
  /** Trazo en cm, con el origen en la esquina superior izquierda de la pieza */
  d: string;
  /** Tamaño dibujado (cm); puede ser menor que el real en piezas muy largas */
  w: number;
  h: number;
  /** La pieza real es más larga de lo que se dibuja */
  cortada: boolean;
  /** Posición en el lienzo (cm) */
  x: number;
  y: number;
  /** Líneas guía opcionales (pinzas, cuello, muescas) */
  guias: string[];
}

const f = (n: number) => Math.round(n * 100) / 100;

function formaDe(prenda: Prenda, p: Pieza): Forma {
  const n = p.nombre.toLowerCase();
  if (n.startsWith("manga")) return "manga";
  if (n === "espalda") return "torso";
  if (n === "delantero") return prenda.id === "chaleco" || prenda.id === "cardigan" ? "medio_torso" : "torso";
  if (n === "corpiño") return "torso";
  if (n === "chal") return "triangulo";
  if (n === "taza") return "triangulo";
  if (n === "bombacha") return "bombacha";
  if (n === "pompón") return "circulo";
  if (n === "paño") return "paño";
  if (n === "panel" || n === "falda" || n === "pierna") return "trapecio";
  return "rect";
}

function trazo(forma: Forma, w: number, h: number, c: Contexto, prenda: Prenda, p: Pieza): { d: string; guias: string[] } {
  const guias: string[] = [];
  switch (forma) {
    case "torso": {
      const esCorpino = p.nombre === "Corpiño";
      const d0 = Math.min(w * 0.14, 7);
      const s = esCorpino ? 0 : Math.min(h * 0.55, c.m.sisa);
      const n = Math.min(w * 0.17, 9);
      const prof = p.nombre === "Espalda" ? 2.5 : 7;
      if (esCorpino) return { d: `M0 0 H${f(w)} V${f(h)} H0 Z`, guias };
      guias.push(`M${f(d0)} ${f(s)} H${f(w - d0)}`);
      return {
        d: `M${f(d0)} 0 L${f(w / 2 - n)} 0 Q${f(w / 2 - n * 0.7)} ${prof} ${f(w / 2)} ${prof} Q${f(w / 2 + n * 0.7)} ${prof} ${f(w / 2 + n)} 0 L${f(w - d0)} 0 Q${f(w - d0 * 0.9)} ${f(s * 0.6)} ${f(w)} ${f(s)} L${f(w)} ${f(h)} L0 ${f(h)} L0 ${f(s)} Q${f(d0 * 0.9)} ${f(s * 0.6)} ${f(d0)} 0 Z`,
        guias,
      };
    }
    case "medio_torso": {
      const d0 = Math.min(w * 0.2, 7);
      const s = Math.min(h * 0.55, c.m.sisa);
      const n = Math.min(w * 0.3, 8);
      return {
        d: `M${f(d0)} 0 L${f(w - n)} 0 L${f(w)} ${f(n * 1.6)} L${f(w)} ${f(h)} L0 ${f(h)} L0 ${f(s)} Q${f(d0 * 0.9)} ${f(s * 0.6)} ${f(d0)} 0 Z`,
        guias,
      };
    }
    case "manga": {
      const wb = Math.max(c.m.puno + 3, 12);
      const cap = Math.min(10, h * 0.3);
      const a = (w - wb) / 2;
      return {
        d: `M${f(a)} ${f(h)} L0 ${f(cap)} Q${f(w * 0.25)} 0 ${f(w / 2)} 0 Q${f(w * 0.75)} 0 ${f(w)} ${f(cap)} L${f(w - a)} ${f(h)} Z`,
        guias: [`M${f(w / 2)} 0 V${f(h)}`],
      };
    }
    case "trapecio": {
      const arriba = prenda.id === "falda" || prenda.id === "pollera" || prenda.id === "vestido" ? Math.max(cintura(c.m) / 2 + 3, w * 0.62) : w;
      const a = (w - Math.min(arriba, w)) / 2;
      return { d: `M${f(a)} 0 H${f(w - a)} L${f(w)} ${f(h)} H0 Z`, guias };
    }
    case "triangulo":
      return { d: `M0 0 H${f(w)} L${f(w / 2)} ${f(h)} Z`, guias: [`M${f(w / 2)} 0 V${f(h)}`] };
    case "bombacha":
      return { d: `M0 0 H${f(w)} L${f(w * 0.64)} ${f(h)} H${f(w * 0.36)} Z`, guias };
    case "circulo":
      return { d: `M0 ${f(h / 2)} A${f(w / 2)} ${f(h / 2)} 0 1 0 ${f(w)} ${f(h / 2)} A${f(w / 2)} ${f(h / 2)} 0 1 0 0 ${f(h / 2)} Z`, guias };
    case "paño": {
      const r = 6;
      return { d: `M0 0 H${f(w / 2 - r)} A${r} ${r} 0 0 0 ${f(w / 2 + r)} 0 H${f(w)} V${f(h)} H0 Z`, guias };
    }
    default:
      return { d: `M0 0 H${f(w)} V${f(h)} H0 Z`, guias };
  }
}

const MAX_LARGO = 78;
const ANCHO_FILA = 112;
const SEP = 9;

/** Piezas planas de la prenda, ya acomodadas en filas (empaque simple por "estantes"). */
export function patronPlano(prenda: Prenda, c: Contexto): { piezas: PiezaPlana[]; ancho: number; alto: number } {
  const lista: Omit<PiezaPlana, "x" | "y">[] = [];
  for (const z of prenda.zonas) {
    z.piezas(c).forEach((p, i) => {
      const forma = formaDe(prenda, p);
      const w = Math.max(4, p.ancho);
      const hReal = Math.max(2, p.alto);
      const cortada = hReal > MAX_LARGO || w > MAX_LARGO * 2.2;
      const h = Math.min(hReal, MAX_LARGO);
      const { d, guias } = trazo(forma, w, h, c, prenda, p);
      lista.push({ zona: z.id, clave: `${z.id}-${i}`, pieza: p, forma, d, w, h, cortada, guias });
    });
  }
  // las más altas primero para que los estantes queden parejos
  lista.sort((a, b) => b.h - a.h);
  let x = 0,
    y = 0,
    altoFila = 0,
    maxX = 0;
  const piezas: PiezaPlana[] = [];
  for (const p of lista) {
    if (x > 0 && x + p.w > ANCHO_FILA) {
      x = 0;
      y += altoFila + SEP + 6;
      altoFila = 0;
    }
    piezas.push({ ...p, x, y });
    x += p.w + SEP;
    altoFila = Math.max(altoFila, p.h);
    maxX = Math.max(maxX, x - SEP);
  }
  return { piezas, ancho: Math.max(maxX, 20), alto: y + altoFila };
}
