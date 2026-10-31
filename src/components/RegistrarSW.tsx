"use client";

import { useEffect } from "react";

export default function RegistrarSW() {
  useEffect(() => {
    const seguro = location.protocol === "https:" || location.hostname === "localhost";
    if ("serviceWorker" in navigator && seguro && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
