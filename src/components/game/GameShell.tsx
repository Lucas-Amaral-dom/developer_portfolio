import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { createGame, type Dir, type GameHandle } from "@/game/engine";
import { BADGES, type SceneDef, type SceneId } from "@/game/world";
import { buildDialogues, portfolioQuery, type PortfolioData } from "@/lib/portfolio-content";
import { SceneScreen } from "@/components/game/SceneScreen";

import { DialogueBox } from "@/components/pixel/DialogueBox";
import { ContactForm } from "@/components/pixel/ContactForm";
import { DPad } from "@/components/pixel/DPad";
import { PixelButton } from "@/components/pixel/PixelButton";

export default function GameShell() {
  const { data, isPending, error } = useQuery(portfolioQuery);
  const [started, setStarted] = useState(false);

  const dialogues = useMemo(() => (data ? buildDialogues(data) : {}), [data]);

  if (error) {
    return (
      <Centered>
        <p className="pixel-font text-[10px]">Não deu para carregar o conteúdo do portfólio.</p>
      </Centered>
    );
  }

  if (isPending || !data) {
    return (
      <Centered>
        <p className="pixel-font animate-pulse text-[10px]">Carregando cidade...</p>
      </Centered>
    );
  }

  if (!started) {
    return (
      <TitleScreen
        name={data.content["playerName"] ?? "Portfólio"}
        tagline={data.content["tagline"] ?? ""}
        sub={data.content["heroSub"] ?? ""}
        onStart={() => setStarted(true)}
      />
    );
  }

  return <World dialogues={dialogues} data={data} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">{children}</div>
  );
}

function TitleScreen({
  name,
  tagline,
  sub,
  onStart,
}: {
  name: string;
  tagline: string;
  sub: string;
  onStart: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", " "].includes(e.key)) onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <div className="scanlines relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="bg-card text-card-foreground pixel-frame max-w-xl p-6 md:p-10">
        <p className="pixel-font text-primary text-[10px]">PORTFOLIO QUEST</p>
        <h1 className="pixel-font mt-4 text-lg leading-relaxed md:text-2xl">{name}</h1>
        <p className="pixel-font text-muted-foreground mt-4 text-[9px] leading-relaxed">{tagline}</p>
        <p className="mt-4 text-sm">{sub}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <PixelButton onClick={onStart} className="animate-[bob_1.6s_steps(4)_infinite]">
            ▶ Aperte Start
          </PixelButton>
          <Link
            to="/admin"
            className="pixel-font pixel-press bg-secondary text-secondary-foreground px-3 py-2 text-[10px] uppercase"
          >
            Painel
          </Link>
        </div>
      </div>
      <p className="pixel-font text-[8px] opacity-70">
        Setas / WASD para andar · A, Enter ou E para interagir
      </p>
    </div>
  );
}

function World({
  dialogues,
  data,
}: {
  dialogues: ReturnType<typeof buildDialogues>;
  data: PortfolioData;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [scene, setScene] = useState<SceneDef | null>(null);
  const [prompt, setPrompt] = useState<{ label: string; action: string } | null>(null);
  const [dialogueId, setDialogueId] = useState<string | null>(null);
  const [badges, setBadges] = useState<SceneId[]>([]);
  const [screen, setScreen] = useState<Exclude<SceneId, "city"> | null>(null);

  const handleDialogue = useCallback((id: string) => setDialogueId(id), []);

  useEffect(() => {
    if (!hostRef.current) return;
    const game = createGame(hostRef.current, {
      onDialogue: handleDialogue,
      onScene: (s) => {
        setScene(s);
        setScreen(s.id === "city" ? null : (s.id as Exclude<SceneId, "city">));
        setBadges((prev) =>
          BADGES.some((b) => b.scene === s.id) && !prev.includes(s.id) ? [...prev, s.id] : prev,
        );
      },
      onPrompt: setPrompt,
    });
    gameRef.current = game;
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [handleDialogue]);

  useEffect(() => {
    gameRef.current?.setPaused(dialogueId !== null || screen !== null);
  }, [dialogueId, screen]);

  const dialogue = dialogueId ? dialogues[dialogueId] : undefined;


  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b-4 px-3 py-2">
        <h1 className="pixel-font text-[10px]">{scene?.title ?? "Cidade Dev"}</h1>
        <div className="flex items-center gap-3">
          <span className="pixel-font text-secondary text-[9px]">
            Insígnias {badges.length}/{BADGES.length}
          </span>
          <div className="flex gap-1">
            {BADGES.map((b) => (
              <span
                key={b.scene}
                title={b.name}
                className={`inline-block h-3 w-3 ${
                  badges.includes(b.scene) ? "bg-secondary" : "bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="relative flex-1">
        <div ref={hostRef} className="absolute inset-0" />

        {prompt && !dialogue && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="pixel-font bg-card text-card-foreground pixel-frame-sm px-3 py-2 text-[9px]">
              {prompt.action}: {prompt.label} — aperte A
            </span>
          </div>
        )}

        {!prompt && !dialogue && scene && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
            <span className="pixel-font bg-card/90 text-card-foreground px-3 py-2 text-center text-[8px] leading-relaxed">
              {scene.hint}
            </span>
          </div>
        )}

        {dialogue && (
          <DialogueBox
            dialogue={dialogue}
            onClose={() => setDialogueId(null)}
            formSlot={<ContactForm />}
          />
        )}
      </div>

      <footer className="border-border flex items-center justify-between gap-4 border-t-4 px-3 py-3">
        <DPad
          onDir={(d: Dir | null) => gameRef.current?.setDir(d)}
          onAction={() => (dialogue ? undefined : gameRef.current?.interact())}
          actionLabel="A"
        />
        <div className="hidden md:block">
          <p className="pixel-font text-[8px] opacity-70">
            Setas / WASD para andar · A, Enter ou E para interagir
          </p>
        </div>
        {scene?.indoor ? (
          <PixelButton variant="secondary" onClick={() => gameRef.current?.goTo("city")}>
            ← Cidade
          </PixelButton>
        ) : (
          <Link
            to="/admin"
            className="pixel-font pixel-press bg-secondary text-secondary-foreground px-3 py-2 text-[10px] uppercase"
          >
            Painel
          </Link>
        )}
      </footer>
    </div>
  );
}
