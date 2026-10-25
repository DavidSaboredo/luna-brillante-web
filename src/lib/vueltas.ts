import fundamentos from "@/data/vueltas/01-fundamentos.json";
import reliveTexturas from "@/data/vueltas/02-relieve-texturas.json";
import clasicos from "@/data/vueltas/03-clasicos.json";
import type { Punto } from "@/lib/puntos";

export interface Vuelta {
  /** "Fila 1", "Vuelta 2", "Paso 3 · Ajustar"… */
  titulo: string;
  /** Receta tal como la escribe una tejedora: "1 cad, girar, 5 pb". */
  receta: string;
  /** La misma receta dicha con palabras. */
  explicacion: string;
  /** Cómo tiene que quedar la labor al terminar (puntos, forma…). */
  resultado?: string;
}

export interface PasoAPasoPunto {
  intro?: string;
  vueltas: Vuelta[];
  /** "escrito" = redactado a mano; "traducido" = receta original expandida automáticamente. */
  origen: "escrito" | "traducido";
}

type Escrito = Record<string, { intro?: string; vueltas: { t: string; r: string; d: string; n?: string }[] }>;
const escritos: Escrito = { ...(fundamentos as Escrito), ...(reliveTexturas as Escrito), ...(clasicos as Escrito) };

/** Abreviaturas de las tejedoras (terminología rioplatense/España) → nombre completo. */
export const ABREVIATURAS: { abbr: string; singular: string; plural: string }[] = [
  { abbr: "cad", singular: "cadeneta", plural: "cadenetas" },
  { abbr: "pr", singular: "punto raso", plural: "puntos rasos" },
  { abbr: "pb", singular: "punto bajo", plural: "puntos bajos" },
  { abbr: "mpa", singular: "medio punto alto", plural: "medios puntos altos" },
  { abbr: "pa", singular: "punto alto", plural: "puntos altos" },
  { abbr: "pad", singular: "punto alto doble", plural: "puntos altos dobles" },
  { abbr: "pat", singular: "punto alto triple", plural: "puntos altos triples" },
  { abbr: "pac", singular: "punto alto cuádruple", plural: "puntos altos cuádruples" },
  { abbr: "pa rel ad", singular: "punto alto en relieve por delante", plural: "puntos altos en relieve por delante" },
  { abbr: "pa rel at", singular: "punto alto en relieve por detrás", plural: "puntos altos en relieve por detrás" },
  { abbr: "pad rel ad", singular: "punto alto doble en relieve por delante", plural: "puntos altos dobles en relieve por delante" },
  { abbr: "pad rel at", singular: "punto alto doble en relieve por detrás", plural: "puntos altos dobles en relieve por detrás" },
  { abbr: "aum", singular: "aumento (2 puntos en el mismo punto)", plural: "aumentos (2 puntos en el mismo punto)" },
  { abbr: "dism", singular: "disminución (2 puntos cerrados juntos)", plural: "disminuciones (2 puntos cerrados juntos)" },
  { abbr: "ht", singular: "hebra trasera", plural: "hebras traseras" },
  { abbr: "hd", singular: "hebra delantera", plural: "hebras delanteras" },
];

const LETRA = "(?<![\\p{L}\\d])";
const FIN = "(?![\\p{L}])";

// Más largas primero para que "pa rel ad" gane a "pa".
const ORDENADAS = [...ABREVIATURAS].sort((a, b) => b.abbr.length - a.abbr.length);

/** Convierte "5 pa en el 1.er pb" en "5 puntos altos en el 1.er punto bajo". */
export function expandir(receta: string): string {
  let t = receta;

  // Cerrados juntos: "3pa jun", "pb3jun", "2mpa jun"
  t = t.replace(new RegExp(`${LETRA}(\\d+)\\s*(pb|mpa|pa|pad)\\s*jun${FIN}`, "gu"), (_, n, a) => {
    const ab = ABREVIATURAS.find((x) => x.abbr === a)!;
    return `${n} ${ab.plural} cerrados juntos`;
  });
  t = t.replace(new RegExp(`${LETRA}(pb|pa)(\\d+)jun${FIN}`, "gu"), (_, a, n) => {
    const ab = ABREVIATURAS.find((x) => x.abbr === a)!;
    return `${n} ${ab.plural} cerrados juntos`;
  });

  for (const { abbr, singular, plural } of ORDENADAS) {
    const base = abbr.replace(/ /g, "\\s+");
    // Con cantidad: "5 pa" -> "5 puntos altos"
    t = t.replace(new RegExp(`${LETRA}(\\d+)\\s*${base}${FIN}`, "gu"), (_, n) => `${n} ${n === "1" ? singular : plural}`);
    // Suelta: "pb en la 2.ª cad" -> "punto bajo en la 2.ª cadeneta"
    t = t.replace(new RegExp(`${LETRA}${base}${FIN}`, "gu"), singular);
  }

  return t
    .replace(/\(der\.\)/g, "(derecho)")
    .replace(/\(rev\.\)/g, "(revés)")
    .replace(/\bgirar\b/g, "girar la labor")
    .replace(/\bGirar\b/g, "Girar la labor");
}

/** Qué abreviaturas aparecen en un texto (para mostrar el mini-glosario). */
export function abreviaturasEn(texto: string) {
  return ABREVIATURAS.filter(({ abbr }) =>
    new RegExp(`${LETRA}(?:\\d+\\s*)?${abbr.replace(/ /g, "\\s+")}${FIN}`, "u").test(texto),
  ).filter(({ abbr }) => !(abbr === "pa" && /\bpa\s+rel\b/.test(texto) && !new RegExp(`${LETRA}pa${FIN}(?!\\s+rel)`, "u").test(texto)));
}

const RE_ENCABEZADO = /^((?:Fila|Hilera|Hileras|Vuelta|Filas|Vueltas|Inicio|Base|Ida|Regreso|Fila de regreso)\b[^:]{0,30}):\s*([\s\S]*)$/;

function desdePasos(pasos: string[]): Vuelta[] {
  return pasos.map((paso, i) => {
    const m = paso.match(RE_ENCABEZADO);
    const titulo = m ? m[1].trim() : `Paso ${i + 1}`;
    const receta = (m ? m[2] : paso).trim();
    const extra: string[] = [];
    if (receta.includes("*")) extra.push("Lo que está entre asteriscos (*…*) se repite hasta el final de la fila.");
    if (/\(.*,.*\)/.test(receta)) extra.push("Lo que está entre paréntesis se teje todo junto en el mismo punto o espacio.");
    return {
      titulo,
      receta,
      explicacion: [expandir(receta).replace(/^\p{Ll}/u, (c) => c.toUpperCase()), ...extra].join(" "),
    };
  });
}

export function pasoAPaso(p: Punto): PasoAPasoPunto {
  const e = escritos[p.id];
  if (e) {
    return {
      intro: e.intro,
      origen: "escrito",
      vueltas: e.vueltas.map((v) => ({ titulo: v.t, receta: v.r, explicacion: v.d, resultado: v.n })),
    };
  }
  return { origen: "traducido", vueltas: desdePasos(p.steps.es) };
}
