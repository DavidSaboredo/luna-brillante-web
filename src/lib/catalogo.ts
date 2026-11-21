// Revistas y packs de Luna Brillante a la venta en Hotmart. Sin precios: solo la tapa, qué contiene cada una y el enlace de compra.
import type { Idioma } from "./textos";

export type RevistaVenta = {
  titulo: Record<Idioma, string>;
  detalle: Record<Idioma, string>;
  comprar: string;
  portada: string;
};

const igual = (s: string) => ({ es: s, en: s, pt: s });

export const revistasVenta: RevistaVenta[] = [
  {
    titulo: igual("Moda Crochet · N.º 1"),
    detalle: {
      es: "Edición Primavera–Verano 2026: 6 diseños con patrones, diagramas y talles S a XL. Blusa Brisa de Verano, Suéter Romántico, Bolso Natural, Chal Encanto, Top Granny y Jean + Crochet.",
      en: "Spring–Summer 2026 issue: 6 designs with patterns, charts and sizes S to XL. Blusa Brisa de Verano, Suéter Romántico, Bolso Natural, Chal Encanto, Top Granny and Jean + Crochet.",
      pt: "Edição Primavera–Verão 2026: 6 modelos com padrões, gráficos e tamanhos P ao GG. Blusa Brisa de Verano, Suéter Romántico, Bolso Natural, Chal Encanto, Top Granny e Jean + Crochet.",
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
      es: "6 diseños exclusivos que combinan crochet y tela para renovar tu ropa, con patrones, diagramas y paso a paso.",
      en: "6 exclusive designs that combine crochet and fabric to refresh your wardrobe, with patterns, charts and step-by-step instructions.",
      pt: "6 modelos exclusivos que combinam crochê e tecido para renovar suas roupas, com padrões, gráficos e passo a passo.",
    },
    comprar: "https://go.hotmart.com/O107532677L",
    portada: "/revista/tapas/crochet-y-tela.webp",
  },
  {
    titulo: { es: "Colección Crochet N.º 1", en: "Crochet Collection No. 1", pt: "Coleção Crochê N.º 1" },
    detalle: {
      es: "10 diseños exclusivos de autor con patrones, diagramas y paso a paso en todos los talles. Proyecto estrella: el chaleco Alas de Luz.",
      en: "10 exclusive designer pieces with patterns, charts and step-by-step instructions in every size. Star project: the Alas de Luz vest.",
      pt: "10 modelos exclusivos de autor com padrões, gráficos e passo a passo em todos os tamanhos. Projeto estrela: o colete Alas de Luz.",
    },
    comprar: "https://go.hotmart.com/H107931619F",
    portada: "/revista/tapas/coleccion-1.webp",
  },
  {
    titulo: { es: "Colección Crochet N.º 2", en: "Crochet Collection No. 2", pt: "Coleção Crochê N.º 2" },
    detalle: {
      es: "10 patrones exclusivos de crochet y moda artesanal, con moldes, gráficos y paso a paso. Proyecto estrella: la chaqueta Luz de Luna.",
      en: "10 exclusive crochet and handmade fashion patterns, with templates, charts and step-by-step instructions. Star project: the Luz de Luna jacket.",
      pt: "10 padrões exclusivos de crochê e moda artesanal, com moldes, gráficos e passo a passo. Projeto estrela: o casaco Luz de Luna.",
    },
    comprar: "https://go.hotmart.com/G107931831H",
    portada: "/revista/tapas/coleccion-2.webp",
  },
  {
    titulo: { es: "Colección Crochet N.º 3", en: "Crochet Collection No. 3", pt: "Coleção Crochê N.º 3" },
    detalle: {
      es: "10 proyectos exclusivos con patrones y gráficos completos: blusas, chaleco, capa, jean y más. Incluye la Capa Aurora, tejida desde el cuello en una sola pieza.",
      en: "10 exclusive projects with full patterns and charts: blouses, a vest, a cape, jeans and more. Includes the Capa Aurora, worked from the neck in one piece.",
      pt: "10 projetos exclusivos com padrões e gráficos completos: blusas, colete, capa, jeans e mais. Inclui a Capa Aurora, feita a partir do pescoço em uma só peça.",
    },
    comprar: "https://go.hotmart.com/T107931974E",
    portada: "/revista/tapas/coleccion-3.webp",
  },
  {
    titulo: { es: "Pack de 3 revistas de colección", en: "Pack of 3 collection magazines", pt: "Pacote de 3 revistas de coleção" },
    detalle: {
      es: "Las Colecciones N.º 1, 2 y 3 juntas en un solo pack: 30 diseños exclusivos con patrones y paso a paso.",
      en: "Collections No. 1, 2 and 3 together in one pack: 30 exclusive designs with patterns and step-by-step instructions.",
      pt: "As Coleções N.º 1, 2 e 3 juntas em um só pacote: 30 modelos exclusivos com padrões e passo a passo.",
    },
    comprar: "https://pay.hotmart.com/S108051274X",
    portada: "/revista/tapas/pack-colecciones.webp",
  },
  {
    titulo: { es: "Especial Chaquetas y Crochet", en: "Jackets and Crochet Special", pt: "Especial Casacos e Crochê" },
    detalle: {
      es: "3 patrones para darle nueva vida a camperas usadas: jean blanca con flores y hojas, jean azul con calados e inserciones, y corderoy con mangas de crochet. Con diagramas y esquemas de corte.",
      en: "3 patterns to give used jackets a new life: white denim with flowers and leaves, blue denim with cutouts and inserts, and corduroy with crochet sleeves. With charts and cutting layouts.",
      pt: "3 padrões para dar nova vida a jaquetas usadas: jeans branca com flores e folhas, jeans azul com recortes e inserções, e veludo cotelê com mangas de crochê. Com gráficos e esquemas de corte.",
    },
    comprar: "https://go.hotmart.com/R108095724U",
    portada: "/revista/tapas/especial-chaquetas.webp",
  },
  {
    titulo: { es: "Revista 4 de Crochet y Diseño", en: "Crochet and Design Magazine 4", pt: "Revista 4 de Crochê e Design" },
    detalle: {
      es: "Edición N.º 4, «Diseños que transforman»: 7 proyectos de crochet y tela, como el vestido Luna Serena, el kimono Corazón de Luz y la falda Eclipse. Con paso a paso, patrones y gráficos.",
      en: "Issue No. 4, “Designs that transform”: 7 crochet and fabric projects, such as the Luna Serena dress, the Corazón de Luz kimono and the Eclipse skirt. With step-by-step instructions, patterns and charts.",
      pt: "Edição N.º 4, “Modelos que transformam”: 7 projetos de crochê e tecido, como o vestido Luna Serena, o quimono Corazón de Luz e a saia Eclipse. Com passo a passo, padrões e gráficos.",
    },
    comprar: "https://go.hotmart.com/E107821136H",
    portada: "/revista/tapas/revista-4.webp",
  },
  {
    titulo: { es: "Colección Diagonal", en: "Diagonal Collection", pt: "Coleção Diagonal" },
    detalle: {
      es: "3 patrones en un PDF con el mismo detalle de crochet en diagonal: remerita, falda semicampana y chaqueta con franja. Con diagramas, moldes y paso a paso.",
      en: "3 patterns in one PDF sharing the same diagonal crochet detail: a top, a flared skirt and a jacket with a crochet band. With charts, templates and step-by-step instructions.",
      pt: "3 padrões em um PDF com o mesmo detalhe de crochê na diagonal: blusinha, saia meio godê e casaco com faixa. Com gráficos, moldes e passo a passo.",
    },
    comprar: "https://go.hotmart.com/V107786589D",
    portada: "/revista/tapas/coleccion-diagonal.webp",
  },
  {
    titulo: { es: "Pack Crochet Romántico", en: "Romantic Crochet Pack", pt: "Pacote Crochê Romântico" },
    detalle: {
      es: "3 tutoriales paso a paso con explicaciones y gráficos: remera Flor de Luna, detalle floral para la cintura y remera Flor en Tira.",
      en: "3 step-by-step tutorials with explanations and charts: the Flor de Luna top, a floral waist detail and the Flor en Tira top.",
      pt: "3 tutoriais passo a passo com explicações e gráficos: blusa Flor de Luna, detalhe floral para a cintura e blusa Flor en Tira.",
    },
    comprar: "https://go.hotmart.com/G107777704M",
    portada: "/revista/tapas/pack-romantico.webp",
  },
  {
    titulo: { es: "Joyas Textiles · Crochet de autor", en: "Textile Jewels · Designer Crochet", pt: "Joias Têxteis · Crochê de autor" },
    detalle: {
      es: "6 proyectos de crochet de autor: Flores en el Aire, Vitral de Luz, Pétalos en Movimiento, Nácar, Entrelazada y Pliegues. Con paso a paso, diagramas, moldes y técnicas de armado.",
      en: "6 designer crochet projects: Flores en el Aire, Vitral de Luz, Pétalos en Movimiento, Nácar, Entrelazada and Pliegues. With step-by-step instructions, charts, templates and assembly techniques.",
      pt: "6 projetos de crochê de autor: Flores en el Aire, Vitral de Luz, Pétalos en Movimiento, Nácar, Entrelazada e Pliegues. Com passo a passo, gráficos, moldes e técnicas de montagem.",
    },
    comprar: "https://go.hotmart.com/V107652601V",
    portada: "/revista/tapas/joyas-textiles.webp",
  },
];
