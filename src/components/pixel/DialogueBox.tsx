import { useEffect, useState } from "react";
import type { Dialogue } from "@/lib/portfolio-content";
import { PixelButton } from "./PixelButton";

interface Props {
  dialogue: Dialogue;
  onClose: () => void;
  formSlot?: React.ReactNode;
}

/** Types the current page out one character at a time, Pokémon style. */
function useTypewriter(text: string) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [text]);
  const done = shown.length >= text.length;
  return { shown: done ? text : shown, done, finish: () => setShown(text) };
}

export function DialogueBox({ dialogue, onClose, formSlot }: Props) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [dialogue]);

  const current = dialogue.pages[page] ?? { text: "" };
  const { shown, done, finish } = useTypewriter(current.text);
  const isLast = page >= dialogue.pages.length - 1;

  function advance() {
    if (!done) {
      finish();
      return;
    }
    if (isLast) onClose();
    else setPage((p) => p + 1);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input,textarea")) return;
      if (["Enter", " ", "e", "E"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        advance();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  return (
    <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 md:inset-x-8 md:bottom-6">
      <div className="bg-card text-card-foreground pixel-frame relative p-4 pt-6 md:p-6 md:pt-7">
        <span className="pixel-font bg-primary text-primary-foreground absolute -top-3 left-3 px-2 py-1 text-[9px]">
          {dialogue.speaker}
        </span>

        <p className="min-h-[3.5rem] text-sm leading-relaxed whitespace-pre-line md:text-base">
          {shown}
          {!done && <span className="ml-0.5 inline-block animate-[blink-cursor_1s_steps(1)_infinite]">▌</span>}
        </p>

        {done && current.links && current.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {current.links.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className="pixel-font pixel-press bg-accent text-accent-foreground px-3 py-2 text-[10px]"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        )}

        {done && dialogue.form && formSlot ? <div className="mt-4">{formSlot}</div> : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="pixel-font text-muted-foreground text-[9px]">
            {page + 1}/{dialogue.pages.length} · A / Enter
          </span>
          <div className="flex gap-2">
            <PixelButton variant="ghost" onClick={onClose}>
              Fechar
            </PixelButton>
            <PixelButton onClick={advance}>{isLast && done ? "Ok" : "Próximo ▶"}</PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
