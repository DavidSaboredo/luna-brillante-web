# Luna Brillante Tejidos – App

App web (funciona en celular y computadora) con tres secciones:

| Sección | Qué hace | Archivos principales |
|---|---|---|
| **Puntos** | Biblioteca de puntos con buscador (por nombre y otros nombres), filtros por categoría y nivel, diagrama, paso a paso, puntos relacionados y calculadora de cadena base. | `src/app/puntos/`, `src/data/puntos.json`, `public/diagramas/` |
| **Crear prenda** | Elige una prenda (blusa, vestido, falda, bolso), y para cada zona elige una tela o un punto de la biblioteca (con sugerencias según la zona) y un color pastel, con vista previa. Se puede guardar y pedirle la guía a la IA. | `src/app/crear/`, `src/lib/taller.ts` |
| **Luna IA** | Chat con IA (Claude) que genera patrones vuelta por vuelta y guía paso a paso. | `src/app/asistente/`, `src/app/api/asistente/route.ts` |

## Cómo abrirla en tu computadora

1. Instalar dependencias (solo la primera vez):
   ```
   npm install
   ```
2. Copiar `.env.example` como `.env.local` y pegar tu clave de IA de https://console.anthropic.com
3. Iniciar:
   ```
   npm run dev
   ```
4. Abrir http://localhost:3000

## Agregar más puntos

Los puntos están en `src/data/puntos.json` (dentro de `stitches`) y sus diagramas en `public/diagramas/`.
Para sumar un punto, agrega una entrada con el mismo formato que las existentes y su SVG con el nombre `<id>.svg`.

- `repeat` (múltiplo + extra) es lo que usa la calculadora de cadena base y Luna IA.
- `category` decide en qué zonas de "Crear prenda" se sugiere el punto.

## Antes de publicar

Las imágenes de Wikimedia Commons marcadas `verify_before_publishing` necesitan autor y licencia: abre cada `source_page` y completa `author` y `license`.

## Personalizar la estética

Los colores y tipografías están en `src/app/globals.css` (bloque `@theme`).

## Imágenes mejoradas

Las fotos, ilustraciones y revistas tienen copias editadas en `public/mejoradas/`.
Los originales permanecen en `public/fotos/`, `public/ilustraciones/` y `public/revista/`.
La app resuelve las versiones desde `src/data/imagenes-mejoradas.json`; las imágenes
nuevas que todavía no se procesaron conservan su ruta original.

- `npm run imagenes:mejorar`: regenera todas las copias mediante edición local con Sharp.
- `node scripts/mejorar-imagenes.mjs wheel_filet`: regenera solo los archivos que coincidan con ese nombre.
- `npm run imagenes:revisar`: comprueba archivos, referencias y originales, y genera
  `output/image-quality/antes-despues.html`, un comparador que se puede abrir directamente.

Los recortes y las máscaras de prendas se configuran en `scripts/ajustes-imagenes.mjs`.
La edición unifica los tejidos en lavanda, ajusta el contraste y aplica enfoque moderado.
Los diagramas conservan sus símbolos, numeración y colores de referencia. No se
reconstruyen puntadas ni texto ilegible; ampliar un escaneo no recupera información perdida.
Algunos pasos conservan el color del hilo cuando se confunde con la piel.
El informe de cada archivo está en `output/image-quality/informe.json`.
