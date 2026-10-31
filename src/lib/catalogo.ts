// Revistas y packs de Luna Brillante a la venta en Hotmart. Sin precios: solo descripción breve y enlace de compra.
import type { Idioma } from "./textos";

export type RevistaVenta = {
  titulo: Record<Idioma, string>;
  detalle: Record<Idioma, string>;
  comprar: string;
  portada?: string;
};

const igual = (s: string) => ({ es: s, en: s, pt: s });

export const revistasVenta: RevistaVenta[] = [
  {
    titulo: igual("Moda Crochet · N.º 1"),
    detalle: {
      es: "6 diseños de crochet con patrones y explicaciones paso a paso.",
      en: "6 crochet designs with patterns and step-by-step explanations.",
      pt: "6 modelos de crochê com padrões e explicações passo a passo.",
    },
    comprar: "https://go.hotmart.com/W107470991K",
    portada: "/revista/tapas/moda-crochet-1.webp",
  },
  {
    titulo: {
      es: "Crochet y Tela con Estilo",
      en: "Crochet and Fabric with Style",
      pt: "Crochê e Tecido com Estilo",
    },
    detalle: {
      es: "6 proyectos que combinan crochet y tela para renovar tu ropa.",
      en: "6 projects that combine crochet and fabric to refresh your wardrobe.",
      pt: "6 projetos que combinam crochê e tecido para renovar suas roupas.",
    },
    comprar: "https://go.hotmart.com/O107532677L",
    portada: "/revista/tapas/crochet-y-tela.webp",
  },
  {
    titulo: { es: "Colección Crochet N.º 1", en: "Crochet Collection No. 1", pt: "Coleção Crochê N.º 1" },
    detalle: {
      es: "10 diseños exclusivos de autor, con el chaleco Alas de Luz como proyecto estrella.",
      en: "10 exclusive designer pieces, with the Alas de Luz vest as the star project.",
      pt: "10 modelos exclusivos de autor, com o colete Alas de Luz como projeto estrela.",
    },
    comprar: "https://go.hotmart.com/H107931619F",
    portada: "/revista/tapas/coleccion-1.webp",
  },
  {
    titulo: { es: "Colección Crochet N.º 2", en: "Crochet Collection No. 2", pt: "Coleção Crochê N.º 2" },
    detalle: {
      es: "10 patrones exclusivos de crochet y moda artesanal, con la chaqueta Luz de Luna.",
      en: "10 exclusive crochet and handmade fashion patterns, featuring the Luz de Luna jacket.",
      pt: "10 padrões exclusivos de crochê e moda artesanal, com o casaco Luz de Luna.",
    },
    comprar: "https://go.hotmart.com/G107931831H",
    portada: "/revista/tapas/coleccion-2.webp",
  },
  {
    titulo: { es: "Colección Crochet N.º 3", en: "Crochet Collection No. 3", pt: "Coleção Crochê N.º 3" },
    detalle: {
      es: "10 proyectos exclusivos de crochet, tela e ideas para crear tu estilo.",
      en: "10 exclusive crochet and fabric projects and ideas to create your own style.",
      pt: "10 projetos exclusivos de crochê, tecido e ideias para criar o seu estilo.",
    },
    comprar: "https://go.hotmart.com/T107931974E",
    portada: "/revista/tapas/coleccion-3.webp",
  },
  {
    titulo: { es: "Pack de 3 revistas de colección", en: "Pack of 3 collection magazines", pt: "Pacote de 3 revistas de coleção" },
    detalle: {
      es: "Las tres revistas de colección juntas.",
      en: "All three collection magazines together.",
      pt: "As três revistas de coleção juntas.",
    },
    comprar: "https://pay.hotmart.com/S108051274X",
  },
  {
    titulo: { es: "Especial Chaquetas y Crochet", en: "Jackets and Crochet Special", pt: "Especial Casacos e Crochê" },
    detalle: {
      es: "Edición especial dedicada a chaquetas de crochet.",
      en: "Special issue dedicated to crochet jackets.",
      pt: "Edição especial dedicada a casacos de crochê.",
    },
    comprar: "https://go.hotmart.com/R108095724U",
  },
  {
    titulo: { es: "Revista 4 de Crochet y Diseño", en: "Crochet and Design Magazine 4", pt: "Revista 4 de Crochê e Design" },
    detalle: {
      es: "Cuarta revista de la serie, con nuevos diseños para tejer.",
      en: "Fourth magazine of the series, with new designs to crochet.",
      pt: "Quarta revista da série, com novos modelos para tecer.",
    },
    comprar: "https://go.hotmart.com/E107821136H",
  },
  {
    titulo: { es: "Colección Diagonal", en: "Diagonal Collection", pt: "Coleção Diagonal" },
    detalle: { es: "3 patrones de crochet.", en: "3 crochet patterns.", pt: "3 padrões de crochê." },
    comprar: "https://go.hotmart.com/V107786589D",
  },
  {
    titulo: { es: "Pack Crochet Romántico", en: "Romantic Crochet Pack", pt: "Pacote Crochê Romântico" },
    detalle: { es: "3 tutoriales paso a paso.", en: "3 step-by-step tutorials.", pt: "3 tutoriais passo a passo." },
    comprar: "https://go.hotmart.com/G107777704M",
  },
  {
    titulo: { es: "Joyas Textiles · Crochet de autor", en: "Textile Jewels · Designer Crochet", pt: "Joias Têxteis · Crochê de autor" },
    detalle: {
      es: "Revista de crochet de autor.",
      en: "Designer crochet magazine.",
      pt: "Revista de crochê de autor.",
    },
    comprar: "https://go.hotmart.com/V107652601V",
  },
];
