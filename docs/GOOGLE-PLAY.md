# Luna Brillante en Google Play (prueba cerrada)

## Lo que ya está en el código
- PWA: manifest, íconos 192/512, service worker, `noindex` (versión de prueba).
- Página `/privacidad` (completar el correo de contacto en `src/app/privacidad/page.tsx`).
- `public/.well-known/assetlinks.json` vacío: se completa con la huella SHA-256 que da Play Console.

## Pasos de David
1. **Vercel**: importar el repo, rama `mejoras/seguridad-ia`, sin variables de entorno (Luna IA responde 503 sin clave, es lo esperado). Pasarle el link a la tejedora.
2. **Cuenta de desarrollador de Google Play** (pago único de USD 25, personal). Verificar identidad.
3. **Empaquetar**: en pwabuilder.com pegar la URL de Vercel → "Package for stores" → Android (TWA). Descarga el `.aab` y la clave de firma.
4. **Play Console** → crear app → subir el `.aab` en *Pruebas cerradas*.
5. Copiar la huella SHA-256 (Integridad de la app) a `assetlinks.json` con el nombre del paquete, y volver a publicar.
6. Ficha: ícono 512, gráfico de 1024×500, mínimo 2 capturas de teléfono, descripción corta (80) y larga.
7. Política de privacidad: `https://TU-DOMINIO/privacidad`. Seguridad de datos: sin datos personales guardados; fotos/consultas a IA se envían para generar la respuesta.
8. Prueba cerrada: **12 testers como mínimo, 14 días seguidos**, antes de pedir producción.

## Cobro
- Durante la prueba: gratis.
- Al lanzar: suscripciones digitales dentro de la app deben usar Google Play Billing (comisión ~15%). Mercado Pago solo para la web. Confirmar en Play Console la disponibilidad en Argentina.
