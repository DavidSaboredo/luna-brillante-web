"use client";

import { useRef, useState } from "react";
import { useIdioma } from "./Idioma";

const CLAVES = ["contador-proyectos", "disenos"] as const;

const TEXTOS = {
  es: {
    titulo: "Copia de seguridad",
    texto: "Tus proyectos y diseños se guardan solo en este celular. Descargá una copia para no perderlos si cambiás de teléfono o borrás los datos.",
    exportar: "Descargar copia",
    importar: "Cargar copia",
    ok: "Copia cargada. Se reemplazaron tus proyectos y diseños.",
    error: "Ese archivo no es una copia válida.",
    vacio: "Todavía no tenés nada para guardar.",
    cancelar: "Cancelar",
    confirmar: "Esto reemplaza lo que tenés ahora en este celular. ¿Seguimos?",
  },
  en: {
    titulo: "Backup",
    texto: "Your projects and designs are saved only on this phone. Download a copy so you don't lose them if you change phones or clear the data.",
    exportar: "Download backup",
    importar: "Load backup",
    ok: "Backup loaded. Your projects and designs were replaced.",
    error: "That file is not a valid backup.",
    vacio: "You have nothing to save yet.",
    cancelar: "Cancel",
    confirmar: "This replaces what you have now on this phone. Continue?",
  },
  pt: {
    titulo: "Cópia de segurança",
    texto: "Seus projetos e designs ficam salvos só neste celular. Baixe uma cópia para não perdê-los se trocar de aparelho ou apagar os dados.",
    exportar: "Baixar cópia",
    importar: "Carregar cópia",
    ok: "Cópia carregada. Seus projetos e designs foram substituídos.",
    error: "Esse arquivo não é uma cópia válida.",
    vacio: "Você ainda não tem nada para salvar.",
    cancelar: "Cancelar",
    confirmar: "Isso substitui o que você tem agora neste celular. Continuar?",
  },
} as const;

export default function CopiaSeguridad() {
  const { idioma } = useIdioma();
  const x = TEXTOS[idioma] ?? TEXTOS.es;
  const entrada = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState("");
  const [pendiente, setPendiente] = useState<{ clave: string; valor: unknown }[] | null>(null);

  const exportar = () => {
    const datos: Record<string, unknown> = {};
    for (const c of CLAVES) {
      try {
        const v = JSON.parse(localStorage.getItem(c) ?? "null");
        if (Array.isArray(v) && v.length) datos[c] = v;
      } catch {}
    }
    if (!Object.keys(datos).length) return setAviso(x.vacio);
    const blob = new Blob([JSON.stringify({ app: "luna-brillante", version: 1, datos })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `luna-brillante-copia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setAviso("");
  };

  const importar = async (archivo: File) => {
    try {
      if (archivo.size > 5_000_000) throw new Error();
      const j = JSON.parse(await archivo.text());
      if (j?.app !== "luna-brillante" || typeof j.datos !== "object" || !j.datos) throw new Error();
      const nuevos = CLAVES.filter((c) => Array.isArray(j.datos[c]));
      if (!nuevos.length) throw new Error();
      setAviso("");
      setPendiente(nuevos.map((c) => ({ clave: c, valor: j.datos[c] })));
    } catch {
      setAviso(x.error);
    }
  };

  const aplicar = () => {
    if (!pendiente) return;
    for (const d of pendiente) localStorage.setItem(d.clave, JSON.stringify(d.valor));
    setPendiente(null);
    setAviso(x.ok);
    setTimeout(() => location.reload(), 1200);
  };

  return (
    <section className="space-y-3 rounded-2xl border border-borde bg-papel p-4">
      <h2 className="text-xl">{x.titulo}</h2>
      <p className="text-sm text-tinta-suave">{x.texto}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={exportar} className="rounded-full bg-lavanda-fuerte px-5 py-2.5 text-sm text-white">
          {x.exportar}
        </button>
        <button onClick={() => entrada.current?.click()} className="rounded-full border border-lavanda-fuerte px-5 py-2.5 text-sm text-lavanda-fuerte">
          {x.importar}
        </button>
        <input
          ref={entrada}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) importar(f);
          }}
        />
      </div>
      {pendiente && (
        <div role="alertdialog" className="space-y-2 rounded-2xl bg-crema p-3 text-sm">
          <p>{x.confirmar}</p>
          <div className="flex gap-2">
            <button onClick={aplicar} className="rounded-full bg-lavanda-fuerte px-4 py-2 font-semibold text-white">
              {x.importar}
            </button>
            <button onClick={() => setPendiente(null)} className="rounded-full border border-borde bg-papel px-4 py-2">
              {x.cancelar}
            </button>
          </div>
        </div>
      )}
      {aviso && (
        <p role="status" className="text-sm text-tinta">
          {aviso}
        </p>
      )}
    </section>
  );
}
