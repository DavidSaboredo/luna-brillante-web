import type { Idioma } from "@/lib/textos";

export interface FotoTejedora {
  archivo: string;
  leyenda: Record<Idioma, string>;
}

const f = (archivo: string, es: string, en: string, pt: string): FotoTejedora => ({
  archivo: `/tejedora/${archivo}.webp`,
  leyenda: { es, en, pt },
});

/** Muestras tejidas por la tejedora de Luna Brillante, por id de punto. */
const porPunto: Record<string, FotoTejedora[]> = {
  herringbone_half_double: [f("espiga", "Punto espiga", "Herringbone stitch", "Ponto espiga")],
  dc_increase: [
    f("aumento-varetas", "Aumentos en varetas (círculos)", "Double crochet increases (circled)", "Aumentos em pontos altos (círculos)"),
  ],
  dc2tog: [
    f("disminucion-varetas", "Disminución en varetas (círculo)", "Double crochet decrease (circled)", "Diminuição em pontos altos (círculo)"),
  ],
  sc_increase: [
    f("aumento", "Aumentos en punto bajo (círculos)", "Single crochet increases (circled)", "Aumentos em ponto baixo (círculos)"),
    f("circulo-aumentos", "Círculo con aumentos", "Circle worked with increases", "Círculo feito com aumentos"),
  ],
  sc2tog: [
    f("disminucion", "Disminuciones en punto bajo (círculos)", "Single crochet decreases (circled)", "Diminuições em ponto baixo (círculos)"),
  ],
  spiral_rounds: [f("circulo-espiral", "Círculo tejido en espiral", "Circle worked in a spiral", "Círculo feito em espiral")],
  solomon_knot: [f("salomon", "Punto Salomón", "Solomon's knot", "Ponto Salomão")],
  granny_square: [
    f("granny", "Granny square", "Granny square", "Granny square"),
    f("granny-flor", "Granny square con flor", "Granny square with a flower", "Granny square com flor"),
  ],
  treble_crochet: [f("vareta-doble", "Vareta doble", "Treble crochet", "Ponto alto duplo")],
  double_treble_crochet: [f("vareta-triple", "Vareta triple", "Double treble crochet", "Ponto alto triplo")],
  triple_treble_crochet: [f("vareta-cuadruple", "Vareta cuádruple", "Triple treble crochet", "Ponto alto quádruplo")],
};

export const fotosTejedora = (id: string): FotoTejedora[] => porPunto[id] ?? [];
