import type { Dir } from "@/game/engine";

interface Props {
  onDir: (dir: Dir | null) => void;
  onAction: () => void;
  actionLabel: string;
}

export function DPad({ onDir, onAction, actionLabel }: Props) {
  const pad = (dir: Dir, glyph: string, area: string) => (
    <button
      type="button"
      aria-label={dir}
      style={{ gridArea: area }}
      onPointerDown={(e) => {
        e.preventDefault();
        onDir(dir);
      }}
      onPointerUp={() => onDir(null)}
      onPointerLeave={() => onDir(null)}
      onPointerCancel={() => onDir(null)}
      className="pixel-press bg-card text-card-foreground pixel-font flex h-11 w-11 items-center justify-center text-[11px] select-none"
    >
      {glyph}
    </button>
  );

  return (
    <div className="flex items-end justify-between gap-4 md:hidden">
      <div
        className="grid gap-1"
        style={{
          gridTemplateAreas: '". u ." "l . r" ". d ."',
          gridTemplateColumns: "repeat(3, auto)",
        }}
      >
        {pad("up", "▲", "u")}
        {pad("left", "◀", "l")}
        {pad("right", "▶", "r")}
        {pad("down", "▼", "d")}
      </div>
      <button
        type="button"
        onClick={onAction}
        className="pixel-press bg-primary text-primary-foreground pixel-font flex h-16 w-16 items-center justify-center rounded-full text-[11px] select-none"
      >
        {actionLabel}
      </button>
    </div>
  );
}
