import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desarrollo y compilación pueden ejecutarse a la vez sin pisar sus manifiestos.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // Evita que Next.js tome como raíz otra carpeta del usuario con package-lock.json
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
