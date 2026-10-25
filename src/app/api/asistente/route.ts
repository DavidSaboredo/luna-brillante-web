import Anthropic from "@anthropic-ai/sdk";
import { nombreCategoria, puntos, textoRepeticion } from "@/lib/puntos";

export const runtime = "nodejs";

const client = new Anthropic(); // usa ANTHROPIC_API_KEY de .env.local

/** Lista compacta de la biblioteca, una línea por punto. Es fija, así que el prompt se puede cachear. */
function catalogoPuntos() {
  return puntos
    .map((p) => {
      const extras = [
        nombreCategoria(p.category),
        p.abbreviation.es !== "—" ? `abrev. ${p.abbreviation.es}` : "",
        textoRepeticion(p)?.toLowerCase() ?? "",
        p.aka.es.length ? `también: ${p.aka.es.join(", ")}` : "",
      ].filter(Boolean);
      return `- ${p.name.es} (${extras.join(" · ")})`;
    })
    .join("\n");
}

const INSTRUCCIONES = `Eres "Luna", la asistente de tejido de Luna Brillante Tejidos, una marca de patrones de crochet con una comunidad grande de tejedoras.

Tu trabajo:
- Escuchar la idea de la tejedora y convertirla en un patrón de crochet claro, realista y tejible.
- Guiarla paso a paso, resolver dudas sobre puntos, vueltas, medidas y terminaciones.
- Cuando la idea combina tela y crochet, explicar también cómo preparar la tela (cortes, dobladillos, refuerzos) y cómo unir ambas partes (vuelta base de pb sobre la tela perforada, costura invisible, entretela, etc.).

Cómo escribir un patrón:
1. Una breve descripción y el nivel de dificultad.
2. **Materiales**: tipo y cantidad aproximada de hilo, número de aguja, accesorios.
3. **Abreviaturas** que vas a usar (cad, pb, mpa, pa, pr, aum, dism, AM…).
4. **Muestra** cuando el tamaño importe (cuántos puntos y vueltas en 10 cm) y cómo ajustar si no coincide.
5. **Instrucciones por partes y por vuelta**, indicando el total de puntos entre paréntesis al final de cada vuelta, por ejemplo: "V3: (1 pb, aum) x6 (18)".
6. **Armado y terminaciones**.
7. Un par de consejos al final.

Verifica la aritmética de cada vuelta: los totales de puntos deben ser coherentes con los aumentos y disminuciones. Si la idea es ambigua (talle, medidas, tipo de hilo, nivel), haz primero una o dos preguntas cortas, o propone valores razonables y aclara que se pueden ajustar.

Tono: cálido, cercano y alentador, en español neutro (tú). Usa Markdown con títulos cortos y listas; nada de párrafos larguísimos. Si te preguntan algo fuera del tejido, la costura o las manualidades, redirige con amabilidad.

Biblioteca de puntos de la app:
La app tiene una sección "Puntos" con los puntos listados abajo, cada uno con diagrama y paso a paso. Cuando un patrón use alguno, llámalo por el mismo nombre que en la biblioteca para que la tejedora lo encuentre ahí. Cuando calcules una cadena base, respeta el múltiplo del punto. Puedes usar puntos que no estén en la lista, pero en ese caso explica cómo se tejen.

${catalogoPuntos()}`;

type Mensaje = { role: "user" | "assistant"; content: string };

function validar(cuerpo: unknown): Mensaje[] | null {
  if (!cuerpo || typeof cuerpo !== "object" || !Array.isArray((cuerpo as { mensajes?: unknown }).mensajes)) return null;
  const mensajes = (cuerpo as { mensajes: unknown[] }).mensajes;
  if (mensajes.length === 0 || mensajes.length > 40) return null;
  for (const m of mensajes) {
    if (
      !m ||
      typeof m !== "object" ||
      !["user", "assistant"].includes((m as Mensaje).role) ||
      typeof (m as Mensaje).content !== "string" ||
      (m as Mensaje).content.length > 8000
    )
      return null;
  }
  return mensajes as Mensaje[];
}

export async function POST(req: Request) {
  const mensajes = validar(await req.json().catch(() => null));
  if (!mensajes || mensajes.at(-1)?.role !== "user") {
    return new Response("Mensaje inválido", { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Falta configurar la clave de la IA (ANTHROPIC_API_KEY en .env.local).", { status: 503 });
  }

  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: [{ type: "text", text: INSTRUCCIONES, cache_control: { type: "ephemeral" } }],
    messages: mensajes,
  });

  const codificador = new TextEncoder();
  const cuerpo = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const evento of stream) {
          if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
            controller.enqueue(codificador.encode(evento.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(codificador.encode("\n\nLo siento, no puedo ayudarte con eso. ¿Probamos con otra idea de tejido? 🧶"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(codificador.encode("\n\n_(La respuesta quedó cortada. Escribe “continúa” para seguir.)_"));
        }
      } catch (error) {
        console.error("Error en Luna IA:", error);
        const mensaje =
          error instanceof Anthropic.AuthenticationError
            ? "Falta configurar la clave de la IA (ANTHROPIC_API_KEY)."
            : error instanceof Anthropic.RateLimitError
              ? "Hay muchas consultas en este momento. Intenta de nuevo en un minuto."
              : "Hubo un problema al conectar con Luna IA. Intenta de nuevo.";
        controller.enqueue(codificador.encode(`\n\n⚠️ ${mensaje}`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(cuerpo, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
