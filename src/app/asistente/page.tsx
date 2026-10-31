import { redirect } from "next/navigation";

// Luna IA está apagada por ahora: se vuelve a la portada hasta que se active.
export default function PaginaAsistente() {
  redirect("/");
}
