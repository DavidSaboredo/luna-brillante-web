import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Luna Brillante Tejidos",
    short_name: "Luna Brillante",
    description: "Patrones de crochet, diseño de prendas en 3D y tu asistente de tejido.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f4",
    theme_color: "#7a5fb0",
    lang: "es-AR",
    icons: [
      { src: "/icons/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
