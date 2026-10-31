// Revistas y packs a la venta en Hotmart. Los precios solo se muestran si se conocen.
export type RevistaVenta = {
  titulo: string;
  detalle: string;
  precio?: string;
  comprar: string;
  catalogo?: string;
};

const drive = (id: string) => `https://drive.google.com/file/d/${id}/view`;

export const revistasVenta: RevistaVenta[] = [
  {
    titulo: "Moda Crochet · Edición N.º 1",
    detalle: "6 diseños de crochet con explicaciones paso a paso.",
    comprar: "https://go.hotmart.com/W107470991K",
    catalogo: drive("1hkOosXCnxopmZxp2te5ABK9U9enBlvGK"),
  },
  {
    titulo: "Crochet y Tela con Estilo",
    detalle: "6 proyectos que combinan crochet y tela para renovar tu ropa.",
    precio: "USD 16,90",
    comprar: "https://go.hotmart.com/O107532677L",
    catalogo: drive("1NBjyD9qmnKkjQ6Y6wKhSedkEEncPu2aa"),
  },
  {
    titulo: "Colección Crochet N.º 1",
    detalle: "Revista de colección Luna Brillante.",
    comprar: "https://go.hotmart.com/H107931619F",
    catalogo: drive("1UwsyXA-nVaW_yWnoQmnS2MtyMMCCuRLp"),
  },
  {
    titulo: "Colección Crochet N.º 2",
    detalle: "Revista de colección Luna Brillante.",
    comprar: "https://go.hotmart.com/G107931831H",
    catalogo: drive("1HZPcYnC0cvc2S6BwfBV77k_0CWZjNlBo"),
  },
  {
    titulo: "Colección Crochet N.º 3",
    detalle: "Revista de colección Luna Brillante.",
    comprar: "https://go.hotmart.com/T107931974E",
    catalogo: drive("1aqCTtispvpPEGzdL_ekPDFYxc8a2inZK"),
  },
  {
    titulo: "Pack de 3 revistas de colección",
    detalle: "Las tres revistas de colección juntas, en oferta.",
    comprar: "https://pay.hotmart.com/S108051274X",
  },
  {
    titulo: "Especial Chaquetas y Crochet",
    detalle: "Edición especial dedicada a chaquetas.",
    comprar: "https://go.hotmart.com/R108095724U",
  },
  {
    titulo: "Revista 4 de Crochet y Diseño",
    detalle: "Cuarta revista de la serie.",
    comprar: "https://go.hotmart.com/E107821136H",
  },
  {
    titulo: "Colección Diagonal",
    detalle: "3 patrones de crochet.",
    comprar: "https://go.hotmart.com/V107786589D",
  },
  {
    titulo: "Pack Crochet Romántico",
    detalle: "3 tutoriales paso a paso.",
    comprar: "https://go.hotmart.com/G107777704M",
  },
  {
    titulo: "Joyas Textiles · Crochet de autor",
    detalle: "Revista de crochet de autor.",
    comprar: "https://go.hotmart.com/V107652601V",
  },
];
