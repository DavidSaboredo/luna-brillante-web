import Link from "next/link";

export const metadata = { title: "Política de privacidad · Luna Brillante" };

// Completar antes de publicar en Google Play.
const CONTACTO = "CORREO-DE-CONTACTO";

export default function PaginaPrivacidad() {
  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-tinta-suave hover:text-tinta">
        ← Volver al inicio
      </Link>
      <header>
        <h1 className="text-4xl">Política de privacidad</h1>
        <p className="text-tinta-suave">Luna Brillante Tejidos · laruzo-dev</p>
      </header>

      <section className="tarjeta space-y-3 p-5">
        <h2 className="text-2xl">Qué datos usamos</h2>
        <p>
          La aplicación no te pide registrarte ni guarda datos personales en nuestros servidores. Los proyectos y
          preferencias que armás se guardan solamente en tu dispositivo.
        </p>
        <h2 className="text-2xl">Fotos y consultas a Luna IA</h2>
        <p>
          Si usás el asistente o subís una foto, el contenido se envía a nuestro proveedor de inteligencia artificial
          (Anthropic) solo para generar la respuesta. No lo usamos para publicidad ni lo vendemos a terceros.
        </p>
        <h2 className="text-2xl">Cookies y publicidad</h2>
        <p>No usamos publicidad ni rastreadores de terceros.</p>
        <h2 className="text-2xl">Tus derechos</h2>
        <p>Podés borrar los datos guardados limpiando los datos de la aplicación desde tu dispositivo.</p>
        <h2 className="text-2xl">Contacto</h2>
        <p>Por cualquier consulta escribinos a {CONTACTO}.</p>
        <p className="text-sm text-tinta-suave">Última actualización: 31 de octubre de 2026.</p>
      </section>
    </div>
  );
}
