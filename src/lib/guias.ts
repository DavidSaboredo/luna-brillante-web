// Guías de arreglos y diseño que se consultan con la tejedora. Texto en español.
export interface Guia {
  id: string;
  titulo: string;
  resumen: string;
  pasos: string[];
  puntos?: { id: string; nombre: string }[];
  nota?: string;
}

export const GUIAS: Guia[] = [
  {
    id: "empezar-sueter",
    titulo: "Con qué puntos empezar y con cuáles seguir en un suéter",
    resumen: "Cada parte del suéter pide un punto distinto: el cuello y los puños, firmes y elásticos; el cuerpo, el que más te guste.",
    pasos: [
      "Para empezar (cuello, puños y borde de abajo): punto bajo en hebra trasera o varetas en relieve alternadas. Quedan elásticos y no se abren.",
      "Para el canesú y el cuerpo, cerrado: medio punto alto o punto alto. Tejen rápido y caen bien.",
      "Para el cuerpo, calado: punto V, abanico o granny. Medí la muestra con el punto calado, porque rinde distinto que el cerrado.",
      "Si el punto calado tiene un múltiplo (por ejemplo 3 + 1), ajustá la cadena inicial para que cierre la repetición.",
    ],
    puntos: [
      { id: "back_loop_only", nombre: "Punto bajo en hebra trasera" },
      { id: "half_double_crochet", nombre: "Medio punto alto" },
      { id: "double_crochet", nombre: "Punto alto" },
      { id: "v_stitch", nombre: "Punto V" },
      { id: "shell_stitch", nombre: "Abanico (concha)" },
      { id: "granny_stitch", nombre: "Punto granny" },
    ],
  },
  {
    id: "cuello",
    titulo: "Escote redondo, en V o bote",
    resumen: "El escote cambia cómo se arranca el canesú.",
    pasos: [
      "Redondo: cadena inicial cerrada en redondo y vueltas completas. Es el más fácil.",
      "En V: tejé de ida y vuelta (hileras) y repartí los aumentos a los costados de la V. Cuando la V llega al fondo, cerrás en redondo.",
      "Bote: escote ancho y poco profundo. Empezá con más cadenas (unos 56 a 60 cm) y poné menos aumentos adelante y atrás.",
      "Probalo siempre contra el cuerpo antes de seguir: el cuello tiene que pasar por la cabeza sin tirar.",
    ],
  },
  {
    id: "terminaciones",
    titulo: "Terminaciones de tela y puntillas que conviene elegir",
    resumen: "Una terminación prolija es lo que hace que una prenda se vea profesional.",
    pasos: [
      "Bordes que no deben estirarse (escote, sisa): una vuelta de punto bajo o de punto cangrejo.",
      "Puños y bordes de abajo: punto elástico (varetas en relieve) o una puntilla corta.",
      "Prendas de tela (remera, camisa, kimono): puntilla fina de abanicos o de picos, tejida aparte y cosida a mano.",
      "Elegí la puntilla de la galería de Diagramas de Monica según el ancho que necesitás: tejés los centímetros de largo que haga falta y la cosés.",
    ],
    nota: "Las puntillas de Monica están en Puntos > Diagramas de Monica.",
  },
  {
    id: "ampliar-pantalon",
    titulo: "Agrandar un pantalón o una pollera con crochet",
    resumen: "Dos formas de ganar centímetros en la cintura o en la cadera.",
    pasos: [
      "Medí cuánto falta (por ejemplo 4 cm) y cuántos centímetros tiene la prenda en esa parte.",
      "Opción 1, paños laterales: cortá la costura de cada costado y tejé una tira que sume los centímetros que faltan, repartida en partes iguales entre los dos lados. Si faltan 4 cm, cada lado lleva 2 cm.",
      "Tejé esas tiras con hilo de algodón mediano y aguja 2,5 a 3, del largo de la prenda, y cosélas entre las dos partes.",
      "Opción 2, listón en la cintura: sacá el elástico y tejé una franja que suma los centímetros que faltan, en punto bajo o varetas apretadas, y volvé a ponerle el elástico.",
      "Para que se note menos, que la tira siga el color y el grosor del hilo de la tela, o elegí un contraste a propósito.",
    ],
    nota: "Si faltan 4 cm no se agregan 2 cadenas de cada lado: se arman 4 cadenas para el ancho total de la tira y se cuentan los puntos de esa cantidad.",
  },
  {
    id: "listones-pantalon",
    titulo: "Listones para alargar o reparar un pantalón (estilo oxford)",
    resumen: "Para un pantalón que ya no se usa, está roto o manchado en el costado: no se corta, se abre y se le agrega una franja por pierna.",
    pasos: [
      "Abrí la costura del costado de cada pierna, desde la cadera hacia abajo. No hace falta cortar la tela.",
      "Tejé un listón (franja) por cada pierna, del largo exacto de esa abertura, con la trama de punto que elijas.",
      "El ancho depende de cada persona: medí cuántos centímetros se necesitan y pedí la medida al armar el listón.",
      "Cosé el listón a los dos lados de la abertura y rematá con una vuelta de punto bajo.",
      "El resultado queda como un pantalón oxford: pierna más ancha, con una franja de crochet a cada lado.",
    ],
    puntos: [
      { id: "half_double_crochet", nombre: "Medio punto alto" },
      { id: "double_crochet", nombre: "Punto alto" },
      { id: "filet_mesh", nombre: "Filet (si lo querés calado)" },
    ],
  },
  {
    id: "triangulo-oxford",
    titulo: "Triángulo para agregar a un pantalón oxford",
    resumen: "Un godé (triángulo) en el costado da vuelo a la pierna.",
    pasos: [
      "Medí el largo de la abertura y cuánto ancho querés en la punta de abajo.",
      "Empezá desde la punta: 2 cadenas y 2 puntos en la primera cadena, y en cada vuelta sumá un punto a cada lado hasta llegar al ancho.",
      "Para la trama usá punto alto o medio punto alto en hileras. Si lo querés calado, punto V o abanico.",
      "Verificá el largo con la prenda puesta antes de coser.",
    ],
  },
  {
    id: "mandala-tela",
    titulo: "Mandala para combinar con una remera, camisa o kimono",
    resumen: "Se teje el mandala primero y recién después se corta la tela.",
    pasos: [
      "Tejé el mandala completo en redondo, del tamaño que quede lindo en la prenda.",
      "Fijalo con alfileres sobre la tela en el lugar elegido y comprobá que se vea bien con la prenda puesta.",
      "Recién cuando estás conforme, cortá la tela por dentro del mandala (si es una ventana) o cosé el mandala encima.",
      "Cosé con puntadas chiquitas a mano. Para prendas de tela fina, hacé una pasada de refuerzo por detrás.",
    ],
    nota: "Primero se teje y se fija, y después se corta. Al revés no se puede arreglar.",
  },
  {
    id: "sisa-corte",
    titulo: "Blusa: cortar en la sisa y tejer arriba, o tejer en la sisa y agregar arriba",
    resumen: "Dos maneras de sumar mangas o canesú a una blusa de tela.",
    pasos: [
      "Cortar en la sisa y tejer arriba: abrí el contorno de la sisa, tejé el canesú en redondo con aumentos y cosé o levantá puntos en el borde de la tela.",
      "Tejer la manga en la sisa: levantá puntos alrededor del agujero de la sisa y tejé hacia abajo en redondo, con disminuciones cada pocas vueltas, hasta el puño.",
      "En ambos casos, probá la prenda puesta antes de coser definitivamente.",
    ],
  },
  {
    id: "blusa-diagonal",
    titulo: "Blusa a dos, en diagonal",
    resumen: "Para diseñar una blusa entre dos personas o dos piezas que se encuentran en diagonal.",
    pasos: [
      "Tejé la blusa en una sola pieza empezando por una esquina con aumentos (esquina a esquina) y después disminuí del otro lado.",
      "Si trabajan entre dos, cada una teje una mitad y se unen por la línea diagonal con una costura plana o con punto bajo.",
      "Elegí un punto que se vea bien cruzado en diagonal, como punto alto o el esquina a esquina.",
    ],
    puntos: [{ id: "corner_to_corner", nombre: "Esquina a esquina (C2C)" }],
  },
];
