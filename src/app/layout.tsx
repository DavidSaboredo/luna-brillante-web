import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import Navegacion from "@/components/Navegacion";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luna Brillante Tejidos",
  description: "Patrones de crochet, diseño de prendas y tu asistente de tejido con IA.",
};

export const viewport: Viewport = {
  themeColor: "#fbf7f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${cormorant.variable} ${nunito.variable} antialiased`}>
        <Navegacion />
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
      </body>
    </html>
  );
}
