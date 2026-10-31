// Equivalencias de puntos de crochet entre idiomas y tabla de agujas.
export type Termino = { es: string; en: string; uk: string; pt: string };

export const terminos: Termino[] = [
  { es: "Cadeneta (cad)", en: "chain (ch)", uk: "chain (ch)", pt: "corrente (corr)" },
  { es: "Punto deslizado (pd)", en: "slip stitch (sl st)", uk: "slip stitch (ss)", pt: "ponto baixíssimo (pbx)" },
  { es: "Punto bajo (pb)", en: "single crochet (sc)", uk: "double crochet (dc)", pt: "ponto baixo (pb)" },
  { es: "Punto medio alto (pma)", en: "half double crochet (hdc)", uk: "half treble (htr)", pt: "meio ponto alto (mpa)" },
  { es: "Punto alto (pa)", en: "double crochet (dc)", uk: "treble (tr)", pt: "ponto alto (pa)" },
  { es: "Punto alto doble (pad)", en: "treble crochet (tr)", uk: "double treble (dtr)", pt: "ponto alto duplo (pad)" },
  { es: "Punto alto triple", en: "double treble (dtr)", uk: "triple treble (trtr)", pt: "ponto alto triplo" },
  { es: "Anillo mágico", en: "magic ring", uk: "magic loop", pt: "anel mágico" },
  { es: "Aumento", en: "increase (inc)", uk: "increase (inc)", pt: "aumento (aum)" },
  { es: "Disminución", en: "decrease (dec)", uk: "decrease (dec)", pt: "diminuição (dim)" },
  { es: "Saltar", en: "skip (sk)", uk: "miss", pt: "pular" },
  { es: "Vuelta", en: "round / row", uk: "round / row", pt: "carreira / volta" },
  { es: "Montar cadenas de inicio", en: "foundation chain", uk: "foundation chain", pt: "corrente de base" },
  { es: "Girar la labor", en: "turn", uk: "turn", pt: "virar o trabalho" },
  { es: "Cortar el hilo", en: "fasten off", uk: "fasten off", pt: "arrematar" },
  { es: "Muestra", en: "gauge", uk: "tension", pt: "amostra" },
  { es: "Ovillo", en: "skein / ball", uk: "ball", pt: "novelo" },
  { es: "Presilla", en: "picot", uk: "picot", pt: "picô" },
];

export const agujas: { mm: string; us: string }[] = [
  { mm: "2,0", us: "B-1" },
  { mm: "2,25", us: "B-1" },
  { mm: "2,75", us: "C-2" },
  { mm: "3,25", us: "D-3" },
  { mm: "3,5", us: "E-4" },
  { mm: "3,75", us: "F-5" },
  { mm: "4,0", us: "G-6" },
  { mm: "4,5", us: "7" },
  { mm: "5,0", us: "H-8" },
  { mm: "5,5", us: "I-9" },
  { mm: "6,0", us: "J-10" },
  { mm: "6,5", us: "K-10½" },
  { mm: "8,0", us: "L-11" },
  { mm: "9,0", us: "M/N-13" },
  { mm: "10,0", us: "N/P-15" },
];
