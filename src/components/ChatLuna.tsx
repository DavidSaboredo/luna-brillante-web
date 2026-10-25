"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import LogoLuna from "./LogoLuna";

type Mensaje = { role: "user" | "assistant"; content: string };

const IDEAS = [
  "Quiero tejer un bolso tipo tote con flores en crochet",
  "Un amigurumi de gatito de 15 cm para principiantes",
  "Una blusa de lino con canesú de crochet en punto concha",
  "¿Cómo hago un anillo mágico que no se afloje?",
];

export default function ChatLuna() {
  const params = useSearchParams();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  // Si llega desde un patrón o desde "Crear prenda", precargar la pregunta
  useEffect(() => {
    const pregunta = params.get("pregunta");
    if (pregunta) setTexto(pregunta);
  }, [params]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes]);

  async function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || cargando) return;

    const historial: Mensaje[] = [...mensajes, { role: "user", content: limpio }];
    setMensajes([...historial, { role: "assistant", content: "" }]);
    setTexto("");
    setCargando(true);

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: historial }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const lector = res.body.getReader();
      const decodificador = new TextDecoder();
      let respuesta = "";
      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        respuesta += decodificador.decode(value, { stream: true });
        setMensajes([...historial, { role: "assistant", content: respuesta }]);
      }
    } catch (error) {
      const detalle = error instanceof Error && error.message;
      setMensajes([
        ...historial,
        { role: "assistant", content: `⚠️ ${detalle || "No pude conectarme. Revisa tu conexión e intenta de nuevo."}` },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
      {mensajes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center">
          <LogoLuna size={72} />
          <div>
            <h1 className="text-4xl">Hola, soy Luna ✦</h1>
            <p className="mx-auto mt-2 max-w-md text-tinta-suave">
              Cuéntame qué te gustaría tejer y te armo el patrón, con materiales, vuelta por vuelta y
              consejos para que te quede hermoso.
            </p>
          </div>
          <div className="grid w-full max-w-xl gap-2 md:grid-cols-2">
            {IDEAS.map((idea) => (
              <button key={idea} onClick={() => enviar(idea)} className="tarjeta p-4 text-left text-sm hover:bg-lavanda/20">
                {idea}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 pb-4">
          {mensajes.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md bg-lavanda px-4 py-3">
                {m.content}
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <div className="shrink-0 pt-1">
                  <LogoLuna size={28} />
                </div>
                <div className="tarjeta markdown max-w-[90%] rounded-bl-md px-4 py-3">
                  {m.content ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <span className="animate-pulse text-tinta-suave">Tejiendo ideas…</span>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={finRef} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="sticky bottom-24 mt-2 flex items-end gap-2 rounded-3xl border border-borde bg-papel p-2 shadow-lg md:bottom-4"
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(texto);
            }
          }}
          rows={Math.min(5, Math.max(1, texto.split("\n").length))}
          placeholder="Cuéntame tu idea…"
          className="flex-1 resize-none bg-transparent px-3 py-2 outline-none"
        />
        <button
          type="submit"
          disabled={cargando || !texto.trim()}
          className="rounded-full bg-lavanda-fuerte px-5 py-2.5 text-sm text-white disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
