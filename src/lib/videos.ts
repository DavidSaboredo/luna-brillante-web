// Videos paso a paso de Monica, del canal de YouTube "Luna Brillante Tejidos Artesanales".
// Para sumar un video nuevo: copiá una línea, cambiá el id (lo que va después de "v=" en el link
// de YouTube), el título, la duración y la categoría. Si es de una prenda o decoración de
// "Crear prenda", agregá su id en `prendas` o `decoraciones` y aparece solo en esa guía.

import type { Idioma } from "./textos";

export const CANAL_URL = "https://www.youtube.com/@lunabrillantetejidosartesanale";

export type CategoriaVideo = "basicos" | "prendas" | "bebe" | "flores" | "amigurumis" | "hogar";

export interface Capitulo {
  /** Segundo del video donde empieza (por ejemplo 2:30 → 150). */
  inicio: number;
  titulo: string;
}

export interface Video {
  id: string;
  titulo: string;
  duracion: string;
  categoria: CategoriaVideo;
  /** Ids de prendas de `GUIA_PRENDAS` donde se muestra este video. */
  prendas?: string[];
  /** Ids de `DECORACIONES` donde se muestra este video. */
  decoraciones?: string[];
  /** Marcas para saltar a cada parte del video. */
  capitulos?: Capitulo[];
}

export const VIDEOS: Video[] = [
  // Más recientes del canal
  { id: "CYiWR2wLKh0", titulo: "Granny armonía con flor en relieve", duracion: "24:27", categoria: "flores" },
  { id: "-QEvTrsw2_8", titulo: "Camino de mesa con hexágonos", duracion: "13:57", categoria: "hogar" },
  { id: "HcmGbHf4juc", titulo: "Lirio morado paso a paso", duracion: "18:54", categoria: "flores" },
  { id: "haCIxgpt9Fo", titulo: "Corazones tejidos", duracion: "10:37", categoria: "flores" },
  { id: "MvUrerijhoM", titulo: "Punto jazmín, rápido de tejer", duracion: "19:34", categoria: "basicos" },

  // Prendas y accesorios
  { id: "3Gy0nIpg-Bs", titulo: "Cárdigan suéter estilo Harry Styles, en una sola pieza", duracion: "52:21", categoria: "prendas", prendas: ["cardigan", "sueter"] },
  { id: "ysPamsZIdas", titulo: "Suéter con margaritas y Fair Isle con cuello", duracion: "44:00", categoria: "prendas", prendas: ["sueter"] },
  { id: "xL9N9fKpZOo", titulo: "Suéter calado", duracion: "22:14", categoria: "prendas", prendas: ["sueter", "blusa"] },
  { id: "Cb3cenHk7V4", titulo: "Remera: puntilla de brujas para empezar", duracion: "37:15", categoria: "prendas", prendas: ["blusa"] },
  { id: "ZFrdMxFcfrI", titulo: "Remera (2.ª parte)", duracion: "16:35", categoria: "prendas", prendas: ["blusa"] },
  { id: "wt7wTTD-Ni4", titulo: "Bikini sin transparencias (1.ª parte)", duracion: "42:41", categoria: "prendas", prendas: ["bikini"] },
  { id: "9R9Ru9M4LGA", titulo: "Malla bikini paso a paso", duracion: "44:21", categoria: "prendas", prendas: ["bikini"] },
  { id: "0Zx_-Su4pgc", titulo: "Cartera boho chic en una sola pieza", duracion: "36:16", categoria: "prendas", prendas: ["bolso"] },
  { id: "O99gDkzWzS0", titulo: "Cartera boho chic sin costura", duracion: "23:33", categoria: "prendas", prendas: ["bolso"] },
  { id: "ZqiQocf5UEo", titulo: "Cartera boho con retazos de lana", duracion: "45:25", categoria: "prendas", prendas: ["bolso"] },
  { id: "Hywt1AlD4B0", titulo: "Cartera de punto fantasía", duracion: "46:22", categoria: "prendas", prendas: ["bolso"] },
  { id: "8cRgEKcvbt4", titulo: "Piluso", duracion: "18:29", categoria: "prendas", prendas: ["gorro"] },
  { id: "Y0d5uIXP4_o", titulo: "Casquete estilo red, en vivo (principiantes y avanzadas)", duracion: "1:23:30", categoria: "prendas", prendas: ["gorro"] },

  // Para empezar
  { id: "2oVNwTv0Phc", titulo: "Puntos básicos: vareta, media vareta, punto raso y anillo mágico", duracion: "16:54", categoria: "basicos" },
  { id: "-qMI9VyLhFo", titulo: "Cómo empezar un tejido sin cadenetas", duracion: "6:52", categoria: "basicos" },
  { id: "MD9cCqxzc1o", titulo: "Corazón al crochet: técnica básica esquina a esquina (C2C)", duracion: "51:58", categoria: "basicos" },
  { id: "8XoWspeyH18", titulo: "Punto jazmín", duracion: "15:55", categoria: "basicos" },
  { id: "LrHx-lLuCsA", titulo: "Cuadrados granny square para empezar", duracion: "8:08", categoria: "basicos", decoraciones: ["granny"] },

  // Flores, grannies y motivos
  { id: "KdPCg2abc6A", titulo: "Rosa fácil y rápida", duracion: "17:55", categoria: "flores", decoraciones: ["rosa"] },
  { id: "VnSz6Trkew4", titulo: "Flores para adornar lo que quieras", duracion: "11:41", categoria: "flores", decoraciones: ["flor"] },
  { id: "8GscMgXMwJI", titulo: "Flores de amigurumi y tunecino", duracion: "21:37", categoria: "flores", decoraciones: ["flor"] },
  { id: "2yosQxYCBNM", titulo: "Granny square de 4 pétalos", duracion: "30:42", categoria: "flores", decoraciones: ["granny"] },
  { id: "oFtWQCjnTUg", titulo: "Granny square paso a paso", duracion: "47:55", categoria: "flores", decoraciones: ["granny"] },
  { id: "qIe03lnbbHw", titulo: "Cuadros granny square", duracion: "16:42", categoria: "flores", decoraciones: ["granny"] },

  // Bebé
  { id: "_AD0ABvlhZ4", titulo: "Batita mágica sin costuras, en una sola pieza", duracion: "1:10:56", categoria: "bebe" },
  { id: "xr_zcNb0izM", titulo: "Batita para recién nacido", duracion: "34:38", categoria: "bebe" },
  { id: "T_91_K180hU", titulo: "Batita de bebé de 0 a 3 meses, sin costura", duracion: "23:49", categoria: "bebe" },
  { id: "GpA6g1j2gbc", titulo: "Batita empezada desde el cuello, sin costuras (2.ª parte)", duracion: "22:39", categoria: "bebe" },
  { id: "HEvPleLPerk", titulo: "Zapatillas de bebé de 0 a 3 meses (también para zurdos)", duracion: "35:27", categoria: "bebe" },
  { id: "0-uheDeGhrU", titulo: "Mantita de corazones en relieve", duracion: "38:10", categoria: "bebe" },
  { id: "efSMcaM6umI", titulo: "Mantita de corazones en relieve (2.ª parte)", duracion: "19:58", categoria: "bebe" },
  { id: "XlY4r5pQ80o", titulo: "Mantita de libélulas en relieve", duracion: "29:02", categoria: "bebe" },
  { id: "nBzIjiOnquk", titulo: "Nube amigurumi y armado del móvil para bebé", duracion: "38:57", categoria: "bebe" },
  { id: "gxoKj8xBqJY", titulo: "Nube amigurumi para móvil de bebé", duracion: "43:25", categoria: "bebe" },
  { id: "4B9T_H8WPJU", titulo: "Osito sonajero amigurumi", duracion: "40:51", categoria: "bebe" },
  { id: "v-rlI6guIw0", titulo: "Cuadro de osito en una sola pieza, para manta", duracion: "41:46", categoria: "bebe" },
  { id: "QatTyCH_09A", titulo: "Manta de animalitos de la selva: zorrito", duracion: "12:24", categoria: "bebe" },
  { id: "C4mo01UxzUU", titulo: "Manta de animalitos de la selva: osito panda", duracion: "13:15", categoria: "bebe" },
  { id: "TLs_jEc9nuE", titulo: "Manta de animalitos de la selva: tortuga y sapo", duracion: "30:18", categoria: "bebe" },
  { id: "DxgZ1lopofE", titulo: "Manta de animalitos de la selva: el león (2.ª parte)", duracion: "21:24", categoria: "bebe" },
  { id: "U4iONRRlbC4", titulo: "Manta de animalitos de la selva: unión, armado y puntilla", duracion: "38:05", categoria: "bebe" },

  // Amigurumis
  { id: "YtLeQEuWK3U", titulo: "Búho amigurumi fácil y rápido", duracion: "26:18", categoria: "amigurumis" },
  { id: "3vQDXif6YYs", titulo: "Cactus fácil", duracion: "17:59", categoria: "amigurumis" },
  { id: "LWfgnXYCWX4", titulo: "Minion amigurumi", duracion: "21:55", categoria: "amigurumis" },
  { id: "bBBfvIz05Kw", titulo: "Minion Stuart amigurumi", duracion: "21:55", categoria: "amigurumis" },
  { id: "FZBPFEiITyI", titulo: "Peppa Pig amigurumi", duracion: "53:47", categoria: "amigurumis" },
  { id: "Tzy7SF8NvsI", titulo: "Anne with an E amigurumi (1.ª parte)", duracion: "42:44", categoria: "amigurumis" },
  { id: "5YWQ86wCusk", titulo: "Anne with an E amigurumi (2.ª parte)", duracion: "24:47", categoria: "amigurumis" },
  { id: "vl09C2hU3B4", titulo: "La sirenita amigurumi (1.ª parte)", duracion: "34:40", categoria: "amigurumis" },
  { id: "bXyjBvENnQM", titulo: "La sirenita amigurumi (2.ª parte)", duracion: "40:02", categoria: "amigurumis" },
  { id: "q5tR8RrFT5Y", titulo: "La sirenita: ojos, pelo y terminaciones (3.ª parte)", duracion: "49:54", categoria: "amigurumis" },
  { id: "zYxP9aOdBIs", titulo: "Tripulante de Among Us amigurumi", duracion: "25:25", categoria: "amigurumis" },
  { id: "mdvUZhoYcZM", titulo: "Calabaza de Halloween con sombrero de bruja", duracion: "36:29", categoria: "amigurumis" },

  // Hogar y regalos
  { id: "M6if6A3Ttfs", titulo: "Adorno navideño fácil", duracion: "13:21", categoria: "hogar" },
  { id: "RHfpPkDS1EI", titulo: "Adorno navideño", duracion: "20:28", categoria: "hogar" },
  { id: "fVhRIDDPigI", titulo: "Arbolito navideño para souvenir", duracion: "20:51", categoria: "hogar" },
  { id: "laebfVpOsIk", titulo: "Colgante con anillas recicladas", duracion: "25:48", categoria: "hogar" },
  { id: "iwQ55a6thk4", titulo: "Reciclado de anillas", duracion: "23:16", categoria: "hogar" },
];

export const CATEGORIAS: CategoriaVideo[] = ["basicos", "prendas", "bebe", "flores", "amigurumis", "hogar"];

/** Videos que se muestran en la página de inicio. */
export const DESTACADOS = ["CYiWR2wLKh0", "3Gy0nIpg-Bs", "0Zx_-Su4pgc", "_AD0ABvlhZ4"];

export const videosDePrenda = (id: string) => VIDEOS.filter((v) => v.prendas?.includes(id));
export const videosDeDecoracion = (id: string) => VIDEOS.filter((v) => v.decoraciones?.includes(id));
export const buscarVideo = (id: string) => VIDEOS.find((v) => v.id === id);

/** Tutorial propio que se muestra en la ficha de un punto (id de punto → id de video). */
const VIDEO_DE_PUNTO: Record<string, string> = {
  corner_to_corner: "MD9cCqxzc1o",
};
export const videoDePunto = (puntoId: string) => {
  const id = VIDEO_DE_PUNTO[puntoId];
  return id ? buscarVideo(id) : undefined;
};

/** Miniatura que genera YouTube para cada video. */
export const miniatura = (id: string, grande = false) => `https://i.ytimg.com/vi/${id}/${grande ? "maxresdefault" : "hqdefault"}.jpg`;
export const enlaceYoutube = (id: string, inicio = 0) => `https://www.youtube.com/watch?v=${id}${inicio ? `&t=${inicio}s` : ""}`;

export const textosVideos: Record<
  Idioma,
  {
    titulo: string;
    sub: string;
    todos: string;
    categorias: Record<CategoriaVideo, string>;
    buscar: string;
    sinResultados: string;
    reproducir: string;
    verEnYoutube: string;
    canal: string;
    suscribite: string;
    capitulos: string;
    privacidad: string;
    enEspanol: string;
    destacados: string;
    destacadosSub: string;
    verTodos: string;
    deLaPrenda: string;
    deLaPrendaSub: string;
    otrosVideos: string;
    verVideos: string;
    videoDeco: string;
    noCarga: string;
    noCargaSub: string;
    reintentar: string;
  }
> = {
  es: {
    titulo: "Videos paso a paso",
    sub: "Tutoriales completos de Monica, de principio a fin. Elegí uno y tejé a la par.",
    todos: "Todos",
    categorias: { basicos: "Para empezar", prendas: "Prendas y carteras", bebe: "Bebé", flores: "Flores y grannies", amigurumis: "Amigurumis", hogar: "Hogar y regalos" },
    buscar: "Buscar un video",
    sinResultados: "No hay videos con esa palabra. Probá con otra o mirá todos.",
    reproducir: "Reproducir",
    verEnYoutube: "Ver en YouTube",
    canal: "Canal de Luna Brillante",
    suscribite: "Suscribite al canal",
    capitulos: "Ir directo a",
    privacidad: "El video se conecta con YouTube recién cuando tocás reproducir.",
    enEspanol: "",
    destacados: "Aprendé con Monica",
    destacadosSub: "Videos paso a paso del canal Luna Brillante.",
    verTodos: "Ver todos →",
    deLaPrenda: "Mirá el video paso a paso",
    deLaPrendaSub: "Monica la teje completa en este video. Pausalo cuando quieras y seguí a tu ritmo.",
    otrosVideos: "Otros videos de esta prenda",
    verVideos: "Videos paso a paso de Monica →",
    videoDeco: "Video paso a paso",
    noCarga: "No se pudo mostrar el video acá",
    noCargaSub: "Suele pasar cuando el navegador bloquea YouTube (bloqueador de anuncios o protección contra rastreo). Podés mirarlo directo en YouTube.",
    reintentar: "Reintentar",
  },
  en: {
    titulo: "Step-by-step videos",
    sub: "Monica's full tutorials, from start to finish. Pick one and crochet along.",
    todos: "All",
    categorias: { basicos: "Getting started", prendas: "Garments and bags", bebe: "Baby", flores: "Flowers and grannies", amigurumis: "Amigurumi", hogar: "Home and gifts" },
    buscar: "Search a video",
    sinResultados: "No videos match that word. Try another one or see them all.",
    reproducir: "Play",
    verEnYoutube: "Watch on YouTube",
    canal: "Luna Brillante channel",
    suscribite: "Subscribe to the channel",
    capitulos: "Jump to",
    privacidad: "The video only connects to YouTube when you press play.",
    enEspanol: "Videos are in Spanish.",
    destacados: "Learn with Monica",
    destacadosSub: "Step-by-step videos from the Luna Brillante channel (in Spanish).",
    verTodos: "See all →",
    deLaPrenda: "Watch the step-by-step video",
    deLaPrendaSub: "Monica makes the whole piece in this video (in Spanish). Pause it whenever you want.",
    otrosVideos: "More videos for this garment",
    verVideos: "Monica's step-by-step videos →",
    videoDeco: "Step-by-step video",
    noCarga: "The video could not be shown here",
    noCargaSub: "This usually happens when the browser blocks YouTube (ad blocker or tracking protection). You can watch it directly on YouTube.",
    reintentar: "Try again",
  },
  pt: {
    titulo: "Vídeos passo a passo",
    sub: "Tutoriais completos da Monica, do começo ao fim. Escolha um e teça junto.",
    todos: "Todos",
    categorias: { basicos: "Para começar", prendas: "Peças e bolsas", bebe: "Bebê", flores: "Flores e grannies", amigurumis: "Amigurumis", hogar: "Casa e presentes" },
    buscar: "Buscar um vídeo",
    sinResultados: "Nenhum vídeo com essa palavra. Tente outra ou veja todos.",
    reproducir: "Reproduzir",
    verEnYoutube: "Ver no YouTube",
    canal: "Canal Luna Brillante",
    suscribite: "Inscreva-se no canal",
    capitulos: "Ir direto para",
    privacidad: "O vídeo só se conecta ao YouTube quando você aperta reproduzir.",
    enEspanol: "Os vídeos estão em espanhol.",
    destacados: "Aprenda com a Monica",
    destacadosSub: "Vídeos passo a passo do canal Luna Brillante (em espanhol).",
    verTodos: "Ver todos →",
    deLaPrenda: "Veja o vídeo passo a passo",
    deLaPrendaSub: "A Monica faz a peça inteira neste vídeo (em espanhol). Pause quando quiser.",
    otrosVideos: "Outros vídeos desta peça",
    verVideos: "Vídeos passo a passo da Monica →",
    videoDeco: "Vídeo passo a passo",
    noCarga: "Não foi possível mostrar o vídeo aqui",
    noCargaSub: "Isso costuma acontecer quando o navegador bloqueia o YouTube (bloqueador de anúncios ou proteção contra rastreamento). Você pode assistir direto no YouTube.",
    reintentar: "Tentar de novo",
  },
};
