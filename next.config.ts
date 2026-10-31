import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desarrollo y compilación pueden ejecutarse a la vez sin pisar sus manifiestos.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // Evita que Next.js tome como raíz otra carpeta del usuario con package-lock.json
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
