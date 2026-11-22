// Guía explicada, para quien recién empieza o está aprendiendo. Texto en español.
export interface PasoGuia {
  titulo: string;
  texto: string;
}

export interface GuiaDePrenda {
  nivel: "Fácil" | "Intermedio" | "Para animarse";
  tiempo: string;
  materiales: string[];
  pasos: PasoGuia[];
  cuidado: string[];
  /** Dónde queda bien un mandala o una figura en esta prenda */
  decorar: string;
}

export const BASICOS: { termino: string; explicacion: string }[] = [
  { termino: "Cadeneta", explicacion: "Es la base de todo: una cadena de lazadas. Se cuenta cada «V» del frente. Con ella armás la primera fila." },
  { termino: "Punto raso", explicacion: "Un punto muy bajito que sirve para unir o cerrar una vuelta. Casi no se ve." },
  { termino: "Punto bajo", explicacion: "El punto más firme y fácil. Queda compacto, ideal para bolsos, bordes y puños." },
  { termino: "Punto vareta", explicacion: "Más alto y suelto que el bajo. Teje rápido y cae mejor: ideal para prendas." },
  { termino: "Vuelta e hilera", explicacion: "Vuelta: cuando tejés en redondo y volvés al principio. Hilera: cuando tejés de ida y de vuelta, girando la labor." },
  { termino: "Muestra", explicacion: "Un cuadradito de prueba de 10 x 10 cm. Contás cuántos puntos y cuántas vueltas entran. Con eso la guía te calcula todo para que la prenda te quede del tamaño justo." },
  { termino: "Marcador", explicacion: "Un hilo de color o un broche que ponés en un punto para no perder dónde empieza la vuelta o dónde aumentás." },
  { termino: "Bloquear", explicacion: "Mojar la pieza terminada, estirarla a su medida sobre una superficie y dejarla secar. Queda pareja y prolija." },
];

const COMUN_CUIDADO = [
  "Probá la prenda sobre el cuerpo cada tanto: es más fácil corregir a tiempo que deshacer todo.",
  "Si te quedan chicos los puntos, usá una aguja más gruesa; si te quedan flojos, una más fina. Hacé otra muestra.",
];

export const GUIA_PRENDAS: Record<string, GuiaDePrenda> = {
  blusa_entredos: {
    nivel: "Fácil",
    tiempo: "Entre 6 y 10 horas de tejido, más la costura",
    materiales: ["Una blusa de lino o gasa, o tela para hacerla (1,2 a 1,5 m)", "Algodón fino para crochet (50 a 100 g)", "Aguja de crochet de 1,75 a 2,5 mm", "Aguja e hilo de coser del color de la tela", "Alfileres"],
    pasos: [
      { titulo: "Medí el entredós", texto: "Medí el delantero desde el escote hasta el ruedo: ese es el largo de la tira. El ancho lo ves en Piezas a tejer." },
      { titulo: "Tejé la tira", texto: "Tejé el entredós a lo largo con el punto elegido. Comparalo cada tanto con la tela: si la tira queda más corta, frunce el delantero." },
      { titulo: "Bloqueá la tira", texto: "Mojala, estirala a su medida y dejala secar. Así queda derecha y no cambia de tamaño después de coserla." },
      { titulo: "Abrí el delantero", texto: "Marcá el centro del delantero y cortá la tela al medio. Hacé un dobladillo angosto en cada borde para que no se deshilache." },
      { titulo: "Cosé el entredós", texto: "Prendé la tira entre las dos mitades con alfileres y cosela a mano con puntadas chiquitas, primero un lado y después el otro." },
      { titulo: "Escote, mangas y ruedo", texto: "Pasá una puntada de festón con hilo de coser por el borde de la tela y tejé encima una vuelta de punto bajo. Sobre esa vuelta tejés el borde elegido." },
    ],
    cuidado: ["Lavá la tela antes de cortarla: el lino encoge, y es mejor que lo haga antes de coser el crochet.", ...COMUN_CUIDADO],
    decorar: "Una flor chica en el remate del entredós, justo debajo del escote, o el mismo borde del ruedo repetido en las mangas.",
  },
  camisa_mangas: {
    nivel: "Intermedio",
    tiempo: "Entre 12 y 20 horas, según el largo de las mangas",
    materiales: ["Una camisa de algodón o lino, o tela para hacerla", "Algodón para crochet (100 a 250 g, según las mangas)", "Aguja de crochet de 2 a 3 mm", "Botones chicos o broches (6 a 10 por manga)", "Aguja e hilo de coser"],
    pasos: [
      { titulo: "Separá las mangas", texto: "Si partís de una camisa hecha, descosé las mangas por la costura de la sisa. Guardalas: te sirven de molde." },
      { titulo: "Tejé la tira de unión", texto: "Pasá una puntada de festón alrededor de la sisa y tejé encima 2 o 3 cm con el punto elegido. Esa tira queda fija en la camisa." },
      { titulo: "Canesú de espalda", texto: "Si lo querés tejido, recortá la espalda por la línea del canesú dejando 1 cm para el dobladillo. Tejé la pieza a la medida y cosela al borde." },
      { titulo: "Mangas", texto: "Hacelas de tela o de crochet, con el largo de Medidas y calce. Terminá el borde de arriba con una tira igual a la de la unión." },
      { titulo: "Botones y ojales", texto: "Cosé los botones en la manga y hacé ojales de cadeneta en la tira de unión, a la misma distancia. Así las mangas se prenden y se sacan." },
      { titulo: "Cuello y puños", texto: "Elegí qué parte va tejida: puede ser solo el borde del cuello o los puños enteros. Cosé con puntadas chiquitas." },
    ],
    cuidado: ["Lavala a mano o en programa delicado, con las mangas desprendidas.", ...COMUN_CUIDADO],
    decorar: "Un mandala chico en el canesú de espalda o una flor en la punta del cuello. Con una sola zona tejida alcanza: no hace falta recargarla.",
  },
  campera_jean: {
    nivel: "Fácil",
    tiempo: "Entre 6 y 15 horas, según el tamaño de la aplicación y del canesú",
    materiales: ["Una campera de jean", "Algodón mediano para crochet (100 a 200 g)", "Aguja de crochet de 2,5 a 3,5 mm", "Aguja de coser gruesa, para jean, e hilo resistente", "Alfileres o clips y un dedal"],
    pasos: [
      { titulo: "Tejé la aplicación", texto: "Tejé el motivo (granny, mandala o flor) del tamaño que te indica Piezas a tejer. Bloquealo para que quede bien plano." },
      { titulo: "Probá dónde va", texto: "Colgá la campera o ponétela y fijá la aplicación con alfileres en el centro de la espalda, entre el canesú y la cintura." },
      { titulo: "Cosé la aplicación", texto: "Cosela por todo el contorno con puntadas chiquitas, pasando por las cadenetas del borde. En el jean usá aguja gruesa y dedal." },
      { titulo: "Canesú tejido (opcional)", texto: "Descosé el canesú y usalo de molde para tejer uno igual, que después cosés en el mismo lugar. Si no querés cortar, cosé el tejido encima del canesú." },
      { titulo: "Puños y cintura", texto: "Podés sumar una tira tejida en los puños y en la cintura, cosida sobre la terminación original." },
    ],
    cuidado: ["Lavala del revés y con agua fría, para que el crochet no se deforme.", "No la centrifugues fuerte: secala estirada.", COMUN_CUIDADO[0]],
    decorar: "La espalda es el lugar estrella: un mandala grande o un granny de flor. También quedan lindas unas flores chicas en los bolsillos del pecho.",
  },
  vestido_canesu: {
    nivel: "Intermedio",
    tiempo: "Entre 15 y 25 horas, más la costura de la falda",
    materiales: ["Gasa o algodón liviano para la falda (1,5 a 2,5 m, según el largo)", "Algodón fino para crochet (150 a 250 g)", "Aguja de crochet de 2 a 3 mm", "Aguja e hilo de coser", "Cinta métrica y alfileres"],
    pasos: [
      { titulo: "Tejé el canesú", texto: "Tejé el delantero y la espalda del canesú hasta debajo del busto, con las medidas de Piezas a tejer. Después uní los hombros." },
      { titulo: "Probalo", texto: "El canesú tiene que llegar justo debajo del busto, sin tirar. Si queda corto, agregá vueltas antes de seguir." },
      { titulo: "Franja de cintura", texto: "Tejé la franja alrededor del borde de abajo del canesú. Es la pieza que une el canesú con la falda." },
      { titulo: "Cortá la falda", texto: "Cortá los dos paños de tela con las medidas de Piezas a tejer. Cosé los costados y fruncí el borde de arriba hasta que mida lo mismo que la franja." },
      { titulo: "Uní falda y canesú", texto: "Prendé la falda a la franja con alfileres, repartiendo el frunce parejo, y cosela." },
      { titulo: "Mangas y ruedo", texto: "Cosé las mangas a la sisa del canesú, o tejelas. En el ruedo, pasá una puntada de festón y tejé encima el borde elegido." },
    ],
    cuidado: ["Lavalo a mano y secalo acostado: si lo colgás mojado, el peso de la falda estira el canesú.", ...COMUN_CUIDADO],
    decorar: "Una flor tejida en la franja de cintura, a un costado, o florcitas sueltas cosidas cerca del ruedo.",
  },
  kimono: {
    nivel: "Fácil",
    tiempo: "Entre 5 y 12 horas de tejido, más la costura",
    materiales: ["Gasa, muselina o viscosa (1,5 a 2 m)", "Algodón fino para crochet (80 a 150 g)", "Aguja de crochet de 2 a 3 mm", "Aguja e hilo de coser"],
    pasos: [
      { titulo: "Cortá y cosé el kimono", texto: "El kimono es casi todo rectángulos: espalda, dos delanteros y dos mangas anchas. Cortá las piezas con las medidas de Piezas a tejer y cosé hombros, mangas y costados." },
      { titulo: "Prepará los bordes", texto: "Hacé un dobladillo angosto en el frente, el escote y el ruedo, y pasale una puntada de festón con hilo de coser: ahí se engancha el crochet." },
      { titulo: "Tejé la solapa", texto: "Tejela directamente sobre el festón: subí por un delantero, rodeá el escote y bajá por el otro. Así no hace falta coserla." },
      { titulo: "Ruedo y mangas", texto: "Repetí lo mismo en el ruedo y en el borde de las mangas, con el borde elegido. Los abanicos y el picot quedan muy bien." },
      { titulo: "Bloqueá", texto: "Planchá la tela con vapor y bloqueá los bordes tejidos para que no ondulen." },
    ],
    cuidado: ["Si la tela es muy fina, usá una aguja de crochet chica (1,5 a 2 mm) para no romperla al enganchar.", COMUN_CUIDADO[0]],
    decorar: "Un mandala en el centro de la espalda, debajo del escote. Te explicamos cómo en el consejo «Mandala para combinar con una remera, camisa o kimono», en esta misma guía.",
  },
  falda_franja: {
    nivel: "Intermedio",
    tiempo: "Entre 8 y 14 horas, más la costura",
    materiales: ["Lino o jean liviano (1,5 a 2 m)", "Algodón para crochet (100 a 150 g)", "Aguja de crochet de 2,5 a 3 mm", "Cierre o elástico para la pretina", "Aguja e hilo de coser y tiza de modista"],
    pasos: [
      { titulo: "Cortá los paneles", texto: "Cortá los dos paneles con las medidas de Piezas a tejer y cosé uno de los costados." },
      { titulo: "Marcá la diagonal", texto: "Con la falda abierta sobre la mesa, marcá con tiza la línea de la franja: alta sobre una cadera y baja sobre la otra. Probate la falda antes de cortar." },
      { titulo: "Tejé la franja", texto: "Tejé una tira larga del ancho elegido. Medí el largo sobre la línea marcada, siguiendo la curva." },
      { titulo: "Cortá y cosé", texto: "Cortá la tela por la línea, hacé un dobladillo en los dos bordes y cosé la franja entre ambos. Primero se teje y se prueba; recién después se corta." },
      { titulo: "Cerrá la falda", texto: "Cosé el otro costado con el cierre, armá la pretina y terminá el ruedo con el borde de crochet." },
    ],
    cuidado: ["Lavá la tela antes de cortarla, para que no encoja después de coser la franja.", ...COMUN_CUIDADO],
    decorar: "Una flor tejida justo donde la franja toca la pretina remata muy bien la diagonal.",
  },
  blusa: {
    nivel: "Intermedio",
    tiempo: "Entre 15 y 25 horas, según el punto y el talle",
    materiales: ["Algodón fino o mediano (unos 300 a 500 g)", "Aguja de crochet de 2,5 a 3,5 mm", "Aguja lanera para coser", "Marcadores de punto"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Hacé un cuadrado de 10 x 10 cm con el punto que elegiste (si es calado, usá ese mismo punto). Contá cuántos puntos y cuántas vueltas entran y cargalo en Medidas." },
      { titulo: "Elegí talle y calce", texto: "Elegí tu talle. «Ajustado» queda pegada al cuerpo; «Normal», cómoda; «Suelto», holgada. Si dudás, elegí Normal." },
      { titulo: "Tejé espalda y delantero", texto: "Son dos piezas casi iguales. Empezá por abajo con la cadeneta que te indica Qué tenés que tejer y subí hasta la sisa (el agujero del brazo). Anotá en qué vuelta estás." },
      { titulo: "Armá el escote y los hombros", texto: "Seguí hacia arriba dejando una abertura al medio para la cabeza. Cuando terminás, unís los hombros con una costura." },
      { titulo: "Mangas", texto: "Tejelas aparte y las cosés a la sisa, o levantás puntos alrededor del agujero y tejés hacia abajo. Para una manga más ajustada, disminuí un punto cada pocas vueltas." },
      { titulo: "Terminaciones", texto: "Cosé los costados, esconde las hebras con la aguja lanera y dale una vuelta de punto bajo al escote para que no se estire. Bloqueala." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Queda hermoso un mandala chico o una flor en el pecho (del lado izquierdo, un poco por debajo del hombro), o una hilera de florcitas siguiendo el escote.",
  },
  sueter: {
    nivel: "Intermedio",
    tiempo: "Entre 20 y 35 horas",
    materiales: ["Lana o algodón mediano (unos 500 a 700 g)", "Aguja de 3 a 4 mm", "Aguja lanera", "Marcadores de punto (4)"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Es el paso más importante: de eso depende que el suéter te quede bien. Hacé el cuadrado de 10 x 10 cm y contá puntos y vueltas." },
      { titulo: "Elegí cómo tejerlo", texto: "Podés tejerlo en piezas (espalda, delantero y mangas) o desde el cuello hacia abajo, sin costuras. El de abajo, «Tejido desde el cuello», te da el cálculo paso a paso." },
      { titulo: "Cuerpo", texto: "Tejé el ancho que te indica la tabla hasta llegar al largo elegido. Un punto simple (alto o medio punto vareta) es el más fácil para empezar." },
      { titulo: "Mangas", texto: "Empezá por el puño con la cantidad de puntos que dice la tabla y andá aumentando un punto a cada lado cada pocas vueltas hasta llegar al ancho del brazo." },
      { titulo: "Unir las partes", texto: "Cosé los hombros, después las mangas a la sisa y por último los costados. Usá la aguja lanera y puntadas chiquitas." },
      { titulo: "Cuello y puños", texto: "Levantá puntos alrededor del cuello y tejé 4 o 5 vueltas en punto bajo en hebra trasera: queda elástico y firme." },
    ],
    cuidado: [...COMUN_CUIDADO, "Con lana, lavalo a mano y secalo estirado sobre una toalla; no lo cuelgues mojado porque se alarga."],
    decorar: "Un mandala grande en el centro del pecho o en la espalda se ve muy lindo. También podés poner una flor en cada puño o figuras pequeñas (corazones, estrellas) sobre el hombro.",
  },
  musculosa: {
    nivel: "Fácil",
    tiempo: "Entre 8 y 15 horas",
    materiales: ["Algodón fino (unos 200 a 300 g)", "Aguja de 2,5 a 3 mm", "Aguja lanera"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Hacé el cuadradito de 10 x 10 cm con el punto elegido y cargá los puntos y vueltas." },
      { titulo: "Tejé espalda y delantero", texto: "Son dos rectángulos del ancho que te da la tabla. Si querés cintura, andá disminuyendo un punto a cada lado hacia el medio del largo y después aumentá." },
      { titulo: "Abertura del brazo", texto: "A la altura de la axila, cerrá unos puntos a cada lado para formar la sisa. Cerrar es dejar de tejer esos puntos, así se hace la curva." },
      { titulo: "Tirantes", texto: "Tejé dos tiras de 4 cm de ancho. Cosé a los hombros o dejalas de cintas largas para atarlas." },
      { titulo: "Armado", texto: "Uní los costados con costura, esconde las hebras y dale un borde de punto bajo a escote y sisas." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Una flor o una mariposa en la parte baja del delantero, o una hilera de florcitas en el borde de abajo, queda muy veraniego.",
  },
  chaleco: {
    nivel: "Intermedio",
    tiempo: "Entre 12 y 20 horas",
    materiales: ["Lana o algodón mediano (300 a 450 g)", "Aguja de 3 a 4 mm", "Aguja lanera", "Botones o broche (opcional)"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Cuadrado de 10 x 10 cm; contá puntos y vueltas." },
      { titulo: "Espalda", texto: "Un rectángulo del ancho de tu espalda, hasta el largo elegido. Dejá las sisas cerrando unos puntos a los costados al llegar a la axila." },
      { titulo: "Delanteros", texto: "Son dos piezas, cada una de la mitad del ancho. Del lado del frente podés ir disminuyendo para hacer un escote en V." },
      { titulo: "Unir", texto: "Uní hombros y costados con costura. Si es calado, cosé con puntada invisible para que no se note." },
      { titulo: "Bordes", texto: "Tejé una vuelta de punto bajo por todo el borde (frentes, cuello y sisas). Si querés cierre, agregá botones." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Un mandala grande en la espalda es un clásico. En el frente, una flor en el lado izquierdo o dos pequeñas, una en cada delantero.",
  },
  cardigan: {
    nivel: "Intermedio",
    tiempo: "Entre 20 y 35 horas",
    materiales: ["Lana o algodón mediano (500 a 700 g)", "Aguja de 3 a 4 mm", "Aguja lanera", "Botones (opcional)"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Cuadrado de 10 x 10 cm, con puntos y vueltas contados." },
      { titulo: "Espalda", texto: "Rectángulo del ancho de la espalda hasta el largo deseado." },
      { titulo: "Delanteros", texto: "Dos piezas; cada una la mitad del ancho. Dejá la abertura del frente sin cerrar." },
      { titulo: "Mangas", texto: "Cada una empieza por el puño y se ensancha poco a poco hasta el brazo." },
      { titulo: "Armar", texto: "Cosé hombros, mangas y costados. Después tejé el borde del frente en punto bajo para que no se estire." },
      { titulo: "Botones o cinto", texto: "Si querés botones, dejá ojales cada 7 u 8 cm al tejer el borde del frente. Si no, dejalo abierto o agregá un cinto." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Un mandala en la espalda o flores repartidas por el borde del frente. También lindo: una figura en cada bolsillo si le hacés bolsillos.",
  },
  poncho: {
    nivel: "Fácil",
    tiempo: "Entre 10 y 20 horas",
    materiales: ["Lana o algodón mediano (400 a 600 g)", "Aguja de 4 a 5 mm", "Aguja lanera"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Cuadrado de 10 x 10 cm con puntos y vueltas contados." },
      { titulo: "Dos rectángulos", texto: "El poncho más simple son dos rectángulos iguales. Tejelos del ancho y largo de la tabla." },
      { titulo: "Unir", texto: "Uní los dos rectángulos por los lados cortos, dejando en el medio un hueco para la cabeza." },
      { titulo: "Cuello", texto: "Levantá puntos en el hueco y tejé 6 u 8 vueltas en punto bajo para que quede ajustado al cuello." },
      { titulo: "Flecos o borde", texto: "Terminá con flecos o con una puntilla en todo el ruedo." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Un mandala en el centro del delantero y otro igual en la espalda es lo más lindo. También podés poner motivos chiquitos en las puntas.",
  },
  chal: {
    nivel: "Fácil",
    tiempo: "Entre 6 y 12 horas",
    materiales: ["Hilado fino o mediano (200 a 400 g)", "Aguja de 3,5 a 5 mm"],
    pasos: [
      { titulo: "Empezá en el medio", texto: "Con 4 cadenetas cerradas con punto raso. Es el centro de la parte de arriba." },
      { titulo: "Aumentá en cada vuelta", texto: "Aumentá en el centro y en los dos extremos. Así el triángulo va creciendo." },
      { titulo: "Cuando tenga el tamaño", texto: "Dejá de aumentar al llegar al tamaño que querés (probalo sobre los hombros)." },
      { titulo: "Terminaciones", texto: "Poné flecos o una puntilla. Bloquealo para que quede pareja la forma." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Un mandala o una flor grande en el centro del triángulo, o florcitas repartidas por el borde. También motivos en las esquinas.",
  },
  vestido: {
    nivel: "Para animarse",
    tiempo: "Entre 25 y 45 horas",
    materiales: ["Algodón fino (500 a 800 g)", "Aguja de 2,5 a 3 mm", "Aguja lanera", "Elástico fino para la cintura (opcional)"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Es clave en un vestido largo: un error chico se multiplica. Hacé la muestra con el mismo punto y lavala antes de medir." },
      { titulo: "Corpiño", texto: "Tejé el corpiño del ancho de tu busto más la holgura elegida, hasta la cintura." },
      { titulo: "Falda", texto: "Desde la cintura hacia abajo, aumentando de a poco para dar vuelo. Cuanto más aumentás, más vuelo." },
      { titulo: "Unir", texto: "Uní los costados con costura. Si lo tejiste de corrido, unís solo los laterales." },
      { titulo: "Tirantes", texto: "Coselos o tejelos directamente desde el corpiño. Probá el largo con el vestido puesto antes de fijarlos." },
      { titulo: "Ruedo", texto: "Terminá con una puntilla en el borde de abajo. Bloqueá para que caiga parejo." },
    ],
    cuidado: [...COMUN_CUIDADO, "Un vestido pesa: elegí hilos livianos y probá la caída antes de seguir."],
    decorar: "Un mandala grande en el frente del corpiño o una guarda de flores a lo largo del ruedo. También mariposas pequeñas sobre la falda.",
  },
  falda: {
    nivel: "Fácil",
    tiempo: "Entre 10 y 18 horas",
    materiales: ["Algodón mediano (300 a 500 g)", "Aguja de 3 a 4 mm", "Elástico de 3 cm de ancho", "Aguja lanera"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Cuadrado de 10 x 10 cm. Contá puntos y vueltas." },
      { titulo: "Pretina", texto: "Es la parte de la cintura. Tejé una tira de unos 5 cm de alto y cerrala en redondo." },
      { titulo: "Cuerpo", texto: "Levantá los puntos de la pretina y tejé hacia abajo. Para más vuelo, aumentá un punto cada pocas vueltas." },
      { titulo: "Volado", texto: "Al llegar al largo elegido, tejé un volado de unos 12 cm o una puntilla." },
      { titulo: "Elástico", texto: "Pasá el elástico por la pretina y coselo. Probá el largo antes de cerrar." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Mandalas pequeños repartidos por la falda, o un mandala grande en un costado, cerca de la cadera. También flores en el volado.",
  },
  pollera: {
    nivel: "Intermedio",
    tiempo: "Entre 12 y 22 horas",
    materiales: ["Algodón fino (300 a 500 g)", "Aguja de 2,5 a 3 mm", "Aguja lanera"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Cuadrado de 10 x 10 cm; contá puntos y vueltas." },
      { titulo: "Pretina con ojales", texto: "Tejé la cintura y dejá ojales (huequitos) cada tanto para pasar el lazo." },
      { titulo: "Cuerpo", texto: "Tejé hacia abajo aumentando para el vuelo, sobre todo hacia el final." },
      { titulo: "Volado", texto: "Hacé un volado ancho en el ruedo para que gire con el movimiento." },
      { titulo: "Lazo", texto: "Tejé una tira de 5 puntos de ancho por unos 150 cm y pasala por los ojales." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Un mandala o una flor grande en un costado y florcitas bajando en diagonal. También mariposas sobre el volado.",
  },
  short: {
    nivel: "Intermedio",
    tiempo: "Entre 10 y 18 horas",
    materiales: ["Algodón mediano (250 a 400 g)", "Aguja de 3 a 3,5 mm", "Elástico de 3 cm", "Aguja lanera"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Cuadrado de 10 x 10 cm; contá puntos y vueltas." },
      { titulo: "Las dos piernas", texto: "Tejé cada pierna por separado; deben ser iguales. Ayudate con marcadores para ir contando." },
      { titulo: "Entrepierna", texto: "Cosé la entrepierna de cada pierna y después uní las dos piernas por adelante y atrás." },
      { titulo: "Pretina", texto: "Levantá los puntos de la cintura y tejé la pretina. Pasá el elástico." },
      { titulo: "Bajos", texto: "Terminá los bajos con una puntilla o un puño corto." },
    ],
    cuidado: COMUN_CUIDADO,
    decorar: "Una flor o un mandala chico en un bolsillo o en la pierna, cerca del bajo. También sirve para decorar un short de jean con motivos.",
  },
  bikini: {
    nivel: "Intermedio",
    tiempo: "Entre 6 y 10 horas",
    materiales: ["Algodón fino mercerizado (100 a 150 g)", "Aguja de 2 a 2,5 mm", "Aguja lanera"],
    pasos: [
      { titulo: "Tejé la muestra", texto: "Tiene que ser bien apretada: el algodón mojado se estira. Cuadrado de 10 x 10 cm." },
      { titulo: "Tazas", texto: "Son dos triángulos. Empezá desde la punta y aumentá un punto a cada lado en cada vuelta hasta llegar al ancho." },
      { titulo: "Bombacha", texto: "Empezá en la entrepierna y andá aumentando hasta formar la parte de adelante." },
      { titulo: "Tiras", texto: "Tejé tiras de punto bajo o de cadenetas. Pasalas por el borde y anudalas." },
    ],
    cuidado: [...COMUN_CUIDADO, "Para usar en el agua conviene forrar con tela o elegir un hilado que no se estire."],
    decorar: "Una flor o una estrella chiquita en el centro de la bombacha, o florcitas en las puntas de las tazas.",
  },
  bolso: {
    nivel: "Fácil",
    tiempo: "Entre 6 y 14 horas",
    materiales: ["Algodón grueso o trapillo", "Aguja de 4 a 5 mm", "Asas (cuero o tejidas)", "Tela para forrar (opcional)"],
    pasos: [
      { titulo: "Base", texto: "Tejé la base en óvalo o rectángulo con punto bajo bien apretado, para que se mantenga firme." },
      { titulo: "Cuerpo", texto: "Seguí en redondo hacia arriba con punto bajo, sin aumentos, hasta la altura deseada." },
      { titulo: "Borde", texto: "Dale 4 o 5 vueltas de punto vareta en el borde superior." },
      { titulo: "Asas", texto: "Tejé dos tiras o usá asas de cuero. Cosélas bien firmes, por dentro y por fuera." },
    ],
    cuidado: ["Usá punto bajo apretado: es más resistente al peso.", "Un forro de tela lo hace más durable."],
    decorar: "Un mandala grande en el frente es lo que más luce. También una flor en un costado o figuras chiquitas repartidas.",
  },
  gorro: {
    nivel: "Fácil",
    tiempo: "Entre 2 y 4 horas",
    materiales: ["Lana o algodón mediano (100 g)", "Aguja de 3,5 a 4,5 mm", "Marcador de punto"],
    pasos: [
      { titulo: "Anillo mágico", texto: "Es el punto de partida en redondo. Hacé el anillo y tejé 6 puntos bajos adentro." },
      { titulo: "Copa", texto: "Aumentá 6 puntos por vuelta hasta llegar al diámetro de la cabeza (unos 18 cm)." },
      { titulo: "Altura", texto: "Seguí sin aumentar hasta el largo del gorro. Probalo en la cabeza." },
      { titulo: "Puño", texto: "Tejé el puño en varetas o en punto bajo en hebra trasera, que es elástico." },
      { titulo: "Pompón", texto: "Hacé un pompón con una tarjeta de cartón y atalo bien al centro." },
    ],
    cuidado: ["Es una buena prenda para practicar: si no te gusta, se deshace rápido."],
    decorar: "Una flor o una estrella al costado, o un mandala chico arriba de la copa. Los motivos chicos quedan muy bien.",
  },
  bufanda: {
    nivel: "Fácil",
    tiempo: "Entre 4 y 10 horas",
    materiales: ["Lana mediana (200 a 300 g)", "Aguja de 4 a 5 mm"],
    pasos: [
      { titulo: "Cadeneta", texto: "Hacé una cadeneta del ancho de tu bufanda (unos 22 cm)." },
      { titulo: "Tejé hileras", texto: "Seguí tejiendo con el punto que elegiste. Contá los puntos de vez en cuando para que no se ensanche ni se angoste." },
      { titulo: "Largo", texto: "Seguí hasta llegar al largo elegido (unos 170 cm). Medila con un centímetro." },
      { titulo: "Flecos", texto: "Cortá hebras, doblalas por la mitad y pasalas por los puntos de las puntas con la aguja. Atalas." },
    ],
    cuidado: ["Es perfecta para practicar un punto nuevo, porque es solo una tira."],
    decorar: "Un mandala o una flor en cada punta, o florcitas repartidas a lo largo. Con granny squares podés armar una bufanda de motivos.",
  },
};

export interface Decoracion {
  id: string;
  nombre: string;
  icono: string;
  nivel: "Fácil" | "Intermedio" | "Para animarse";
  como: string;
  puntos: { id: string; nombre: string }[];
}

/** Adornos que se tejen aparte y se cosen a la prenda. */
export const DECORACIONES: Decoracion[] = [
  {
    id: "mandala",
    nombre: "Mandala",
    icono: "🌼",
    nivel: "Intermedio",
    como: "Se teje en redondo desde el centro (anillo mágico) agregando una vuelta nueva cada vez, con aumentos parejos para que quede plano. Con un hilado fino queda delicado; con uno grueso, más llamativo.",
    puntos: [
      { id: "magic_ring", nombre: "Anillo mágico" },
      { id: "sunflowers_stitch", nombre: "Girasoles" },
      { id: "layered_flower", nombre: "Flor en capas" },
    ],
  },
  {
    id: "flor",
    nombre: "Flor",
    icono: "🌸",
    nivel: "Fácil",
    como: "La más fácil de todas. Una flor de 5 pétalos se hace en una sola vuelta y queda bien en cualquier lugar. Podés hacer varias de distintos tamaños y colores.",
    puntos: [
      { id: "five_petal_flower", nombre: "Flor de 5 pétalos" },
      { id: "four_petal_flower", nombre: "Flor de 4 pétalos" },
      { id: "eight_petal_flower", nombre: "Flor de 8 pétalos" },
      { id: "six_petal_lace_flower", nombre: "Flor calada de 6 pétalos" },
    ],
  },
  {
    id: "rosa",
    nombre: "Rosa",
    icono: "🌹",
    nivel: "Para animarse",
    como: "Se teje como una tira que se enrolla sobre sí misma. Con una hoja al costado queda muy elegante, ideal en el hombro o el escote.",
    puntos: [{ id: "rolled_rose_with_leaf", nombre: "Rosa enrollada con hoja" }],
  },
  {
    id: "granny",
    nombre: "Cuadrado granny",
    icono: "🟪",
    nivel: "Fácil",
    como: "Un cuadradito de colores que se teje en redondo. Se pueden coser varios juntos para armar bolsillos, hombros o sectores de la prenda.",
    puntos: [
      { id: "granny_square", nombre: "Cuadrado granny" },
      { id: "puff_flower_square", nombre: "Cuadrado de flor con puffs" },
      { id: "openwork_flower_square", nombre: "Cuadrado calado de flor" },
    ],
  },
  {
    id: "estrella",
    nombre: "Estrella",
    icono: "⭐",
    nivel: "Intermedio",
    como: "Con el punto estrella se teje una estrella o un pequeño adorno. Queda muy bien en prendas de niñas o en bolsos.",
    puntos: [
      { id: "star_stitch", nombre: "Punto estrella" },
      { id: "fan_star_lace", nombre: "Estrella de abanicos" },
    ],
  },
  {
    id: "mariposa",
    nombre: "Mariposa",
    icono: "🦋",
    nivel: "Intermedio",
    como: "Se arma con dos alitas en abanico y un cuerpito al medio. Alegre y liviana, queda lindo en blusas y musculosas.",
    puntos: [{ id: "butterfly_filet", nombre: "Mariposa en filet" }],
  },
];

export const PASOS_APLICAR = [
  "Tejé el mandala o la figura aparte, con el mismo hilado de la prenda (o uno que combine) para que pese parecido.",
  "Bloquealo: mojalo, estiralo a su forma y dejalo secar. Así queda plano y parejo.",
  "Apoyalo sobre la prenda y movelo hasta encontrar el lugar que más te guste. Fijalo con alfileres.",
  "Probate la prenda y mirate al espejo antes de coser: es más fácil mover los alfileres que descoser.",
  "Cosé con la aguja lanera y el mismo hilo, con puntadas chiquitas por el borde. En prendas pesadas, dale una pasada de refuerzo por detrás.",
  "Si la prenda se va a lavar mucho, coselo bien firme; si es un aplique para ocasiones, podés coserlo con puntadas flojas para sacarlo.",
];
