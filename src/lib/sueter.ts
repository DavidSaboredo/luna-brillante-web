// Cálculo de un suéter tejido desde el cuello hacia abajo, con canesú de raglán (4 líneas de aumentos).
export type Escote = "redondo" | "v" | "bote";

export interface EntradaSueter {
  escote: Escote;
  pecho: number; // contorno de pecho terminado (cm)
  cuello: number; // contorno del escote (cm)
  brazo: number; // contorno del brazo, arriba (cm)
  profundidad: number; // largo del canesú, del cuello a la axila (cm)
  largoCuerpo: number; // de la axila al borde de abajo (cm)
  largoManga: number; // de la axila al puño (cm)
  puntosEn10: number; // puntos en 10 cm (muestra)
  vueltasEn10: number; // vueltas en 10 cm (muestra)
}

export const CUELLO_SUGERIDO: Record<Escote, number> = { redondo: 44, v: 50, bote: 58 };

export const ENTRADA_INICIAL: EntradaSueter = {
  escote: "redondo",
  pecho: 100,
  cuello: CUELLO_SUGERIDO.redondo,
  brazo: 32,
  profundidad: 22,
  largoCuerpo: 38,
  largoManga: 44,
  puntosEn10: 20,
  vueltasEn10: 16,
};

export interface ResultadoSueter {
  ok: boolean;
  avisos: string[];
  cadenaInicial: number;
  panelDelanteroInicial: number;
  mangaInicial: number;
  vueltasAumento: number;
  vueltasCanesu: number;
  cadaCuantasVueltas: string;
  puntosFinalesCanesu: number;
  delanteroFinal: number;
  mangaFinal: number;
  cadenasAxila: number;
  puntosCuerpo: number;
  vueltasCuerpo: number;
  puntosManga: number;
  vueltasManga: number;
  disminucionesManga: number;
  cadaCuantasDisminucion: string;
}

const aCm = (cm: number, p: number) => Math.round((cm * p) / 10);

export function calcularSueter(e: EntradaSueter): ResultadoSueter {
  const avisos: string[] = [];
  const sp = e.puntosEn10;
  const vp = e.vueltasEn10;

  const cadenasAxila = Math.max(2, aCm(3, sp));
  const pechoSt = aCm(e.pecho, sp);
  const brazoSt = aCm(e.brazo, sp);
  const delanteroFinal = Math.round((pechoSt - 2 * cadenasAxila) / 2);
  const mangaFinal = brazoSt - cadenasAxila;

  // Cada aumento de raglán suma 8 puntos (2 por línea). Cuello = 2*delantero + 2*manga iniciales.
  const bruto = (2 * delanteroFinal + 2 * mangaFinal - aCm(e.cuello, sp)) / 8;
  const vueltasAumento = Math.max(1, Math.round(bruto));
  const cadenaInicial = 2 * delanteroFinal + 2 * mangaFinal - 8 * vueltasAumento;
  const panelDelanteroInicial = delanteroFinal - 2 * vueltasAumento;
  const mangaInicial = mangaFinal - 2 * vueltasAumento;
  const vueltasCanesu = Math.round((e.profundidad * vp) / 10);

  if (mangaInicial < 4 || panelDelanteroInicial < 4) {
    avisos.push("Con esas medidas el canesú queda muy justo arriba. Probá un cuello más grande o un brazo más fino.");
  }
  if (vueltasAumento > vueltasCanesu) {
    avisos.push(
      `Necesitás ${vueltasAumento} vueltas de aumentos pero el canesú tiene ${vueltasCanesu}. Hacelo más profundo (unos ${Math.ceil(
        (vueltasAumento * 10) / vp,
      )} cm) o achicá el pecho o el brazo.`,
    );
  }
  const cada = vueltasAumento > 0 ? vueltasCanesu / vueltasAumento : 1;
  const cadaCuantasVueltas =
    cada <= 1.3 ? "casi una vuelta tras otra" : cada <= 2.4 ? "una vuelta sí y otra no" : `una vuelta de aumentos cada ${Math.round(cada)} vueltas`;

  const puntosCuerpo = 2 * delanteroFinal + 2 * cadenasAxila;
  const vueltasCuerpo = Math.round((e.largoCuerpo * vp) / 10);
  const vueltasManga = Math.round((e.largoManga * vp) / 10);
  const puntoPuño = Math.max(10, aCm(e.brazo * 0.7, sp));
  const disminucionesManga = Math.max(0, Math.floor((brazoSt - puntoPuño) / 2));
  const cadaDis = disminucionesManga > 0 ? Math.max(1, Math.round(vueltasManga / (disminucionesManga + 1))) : 0;

  if (e.escote === "v") avisos.push("Escote en V: tejé el canesú en hileras (de ida y vuelta) hasta el fondo de la V y recién ahí cerrá en redondo.");
  if (e.escote === "bote") avisos.push("Escote bote: es ancho, así que el canesú empieza más abierto. Revisá que el largo del hombro no se caiga.");

  return {
    ok: avisos.filter((a) => a.startsWith("Necesitás") || a.startsWith("Con esas")).length === 0,
    avisos,
    cadenaInicial,
    panelDelanteroInicial,
    mangaInicial,
    vueltasAumento,
    vueltasCanesu,
    cadaCuantasVueltas,
    puntosFinalesCanesu: cadenaInicial + 8 * vueltasAumento,
    delanteroFinal,
    mangaFinal,
    cadenasAxila,
    puntosCuerpo,
    vueltasCuerpo,
    puntosManga: brazoSt,
    vueltasManga,
    disminucionesManga,
    cadaCuantasDisminucion: cadaDis ? `cada ${cadaDis} vueltas` : "—",
  };
}
