"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SendHorizontal, X } from "lucide-react";

// Chat con Clubi para owners y colaboradores (ticket "V2 Agregar bot / CLUBI").
// La charla vive en memoria: cerrar el panel la conserva, recargar la pagina la borra.
const FACE = "/images/sitio/clubi-cabeza.png";
const MAX_INPUT = 500;

type Turn = { id: number; role: "user" | "assistant"; content: string };

function Avatar({ size }: { size: number }) {
  return (
    <span
      className="flex shrink-0 items-end justify-center overflow-hidden rounded-full border-2 border-white bg-[#FFDDEB] shadow-sm"
      style={{ width: size, height: size }}
    >
      <Image src={FACE} alt="" width={277} height={311} className="h-auto w-[90%]" />
    </span>
  );
}

export function ClubiChat() {
  const t = useTranslations("Clubi");
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const nextId = React.useRef(0);
  const turn = (role: Turn["role"], content: string): Turn => ({ id: nextId.current++, role, content });

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  const send = async (text: string) => {
    // Sin guardas: el submit se deshabilita vacio o esperando, y las sugerencias
    // desaparecen con el primer turno.
    const content = text.trim();
    // Los errores se muestran en el hilo pero no viajan como historia.
    const asked = turn("user", content);
    // El id viaja de mas: el z.object de la ruta lo descarta.
    const history = [...turns, asked].filter((m) => !m.content.startsWith("⚠"));
    setTurns((prev) => [...prev, asked]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/clubi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data: { reply?: string; error?: string } = await res.json();
      const reply = res.ok && data.reply ? data.reply : `⚠ ${data.error ?? t("error")}`;
      const answer = turn("assistant", reply);
      setTurns((prev) => [...prev, answer]);
    } catch {
      const failure = turn("assistant", `⚠ ${t("error")}`);
      setTurns((prev) => [...prev, failure]);
    } finally {
      setPending(false);
    }
  };

  const bubble = "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-5";

  return (
    <>
      {open ? (
        <section
          aria-label="Clubi"
          className="fixed bottom-28 right-4 z-50 flex h-[min(560px,calc(100dvh-9rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-[var(--brand-pink)] px-4 py-3 text-white">
            <Avatar size={40} />
            <div className="flex-1 leading-tight">
              <p className="font-semibold">Clubi</p>
              <p className="flex items-center gap-1 text-xs opacity-90">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {t("online")}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="rounded-full p-1 hover:bg-white/20">
              <X size={20} />
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div className="flex items-start gap-2">
              <Avatar size={32} />
              <p className={`${bubble} bg-[var(--brand-pink)]/10`}>{t("greeting")}</p>
            </div>
            {turns.length === 0 ? (
              <div className="flex flex-col items-center gap-2 pt-1">
                {(["suggestion1", "suggestion2", "suggestion3"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => send(t(key))}
                    className="rounded-full border border-[var(--brand-pink)] px-4 py-1.5 text-xs font-medium text-[var(--brand-pink)] hover:bg-[var(--brand-pink)]/10"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            ) : null}
            {turns.map((m) =>
              m.role === "user" ? (
                <p key={m.id} className={`${bubble} self-end bg-[var(--brand-pink)] text-white`}>{m.content}</p>
              ) : (
                <div key={m.id} className="flex items-start gap-2">
                  <Avatar size={32} />
                  <p className={`${bubble} bg-[var(--brand-pink)]/10`}>{m.content}</p>
                </div>
              ),
            )}
            {pending ? (
              <div className="flex items-start gap-2">
                <Avatar size={32} />
                <p className={`${bubble} animate-pulse bg-[var(--brand-pink)]/10 italic`}>{t("thinking")}</p>
              </div>
            ) : null}
          </div>

          <form
            className="flex items-center gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_INPUT}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="h-10 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus:border-[var(--brand-pink)]"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label={t("send")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--brand-pink)] hover:bg-[var(--brand-pink)]/10 disabled:opacity-40"
            >
              <SendHorizontal size={20} />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("close") : t("open")}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-50 flex h-20 w-20 items-end justify-center overflow-hidden rounded-full border-4 border-white bg-[var(--brand-pink)] shadow-xl transition-transform hover:scale-105"
      >
        <Image src={FACE} alt="" width={277} height={311} className="h-auto w-[88%]" />
      </button>
    </>
  );
}
