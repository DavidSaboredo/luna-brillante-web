# Edición de imágenes · Luna Brillante

Abrir `antes-despues.html` para comparar el catálogo completo, buscar por nombre y
filtrar fotografías, muestras de revista, diagramas, ilustraciones y prendas.

Las versiones finales están en `../../public/mejoradas/`, con la misma organización
que los originales. La aplicación usa estas versiones automáticamente.

Se utilizó edición local con Sharp, autorizada por la usuaria: recortes revisados,
selección de los tejidos por color y zona, paleta lavanda, compensación del papel,
ampliación moderada con Lanczos y enfoque suave. No se empleó reconstrucción generativa
en las imágenes finales. La geometría de las puntadas y el contenido de los textos se
conservan; los diagramas SVG ya eran escalables y no necesitaron rasterización.

Las instrucciones útiles, numeraciones y leyendas se conservaron. Algunos pasos con
manos e hilo naranja o crema conservan el color original para no teñir la piel.
Los reflejos fuertes, la baja resolución y el desenfoque de origen limitan la nitidez
alcanzable. Esas limitaciones se señalan en el informe y el comparador.

La prueba inicial de IA está en `pruebas/` únicamente como referencia; no se usa en la app.

Para reproducir y comprobar el trabajo, desde la raíz del proyecto:

```sh
npm run imagenes:mejorar
npm run imagenes:revisar
```

`informe.json` registra origen, destino, recorte, dimensiones y huella SHA-256 de cada
original. `verificacion.json` registra el resultado de la revisión completa.
