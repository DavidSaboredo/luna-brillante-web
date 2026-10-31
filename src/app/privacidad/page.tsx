import Link from "next/link";
import Tx from "@/components/Tx";

export const metadata = { title: "Política de privacidad · Luna Brillante" };

// Completar antes de publicar en Google Play.
const CONTACTO = "CORREO-DE-CONTACTO";

export default function PaginaPrivacidad() {
  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-tinta-suave hover:text-tinta">
        <Tx k="priv.volver" />
      </Link>
      <header>
        <h1 className="text-4xl">
          <Tx k="priv.titulo" />
        </h1>
        <p className="text-tinta-suave">Luna Brillante Tejidos · laruzo-dev</p>
      </header>

      <section className="tarjeta space-y-3 p-5">
        <h2 className="text-2xl">
          <Tx k="priv.datos" />
        </h2>
        <p>
          <Tx k="priv.datosTexto" />
        </p>
        <h2 className="text-2xl">
          <Tx k="priv.ia" />
        </h2>
        <p>
          <Tx k="priv.iaTexto" />
        </p>
        <h2 className="text-2xl">
          <Tx k="priv.cookies" />
        </h2>
        <p>
          <Tx k="priv.cookiesTexto" />
        </p>
        <h2 className="text-2xl">
          <Tx k="priv.derechos" />
        </h2>
        <p>
          <Tx k="priv.derechosTexto" />
        </p>
        <h2 className="text-2xl">
          <Tx k="priv.contacto" />
        </h2>
        <p>
          <Tx k="priv.contactoTexto" c={CONTACTO} />
        </p>
        <p className="text-sm text-tinta-suave">
          <Tx k="priv.actualizacion" />
        </p>
      </section>
    </div>
  );
}
