import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";

import {
  SCENES,
  SOLID_TILES,
  TILE,
  type FurnitureKind,
  type Interactable,
  type SceneDef,
  type SceneId,
} from "./world";

import homeSprite from "@/assets/build-home.png";
import labSprite from "@/assets/build-lab.png";
import arenaSprite from "@/assets/build-arena.png";
import shopSprite from "@/assets/build-shop.png";
import charactersSheet from "@/assets/characters.png";

export type Dir = "up" | "down" | "left" | "right";

export interface GameCallbacks {
  onDialogue: (id: string) => void;
  onScene: (scene: SceneDef) => void;
  onPrompt: (prompt: { label: string; action: string } | null) => void;
}

export interface GameHandle {
  destroy: () => void;
  setPaused: (paused: boolean) => void;
  setDir: (dir: Dir | null) => void;
  interact: () => void;
  goTo: (scene: SceneId) => void;
}

const SPRITES: Record<string, string> = {
  home: homeSprite,
  lab: labSprite,
  arena: arenaSprite,
  shop: shopSprite,
};

/**
 * characters.png — GBA-style trainer sheets stacked vertically.
 * 4 columns (idle, step A, idle, step B) and 4 rows per character
 * (down, left, right, up). Character 0 is the player.
 */
const CHAR_COLS = 4;
const CHAR_COUNT = 6;
const DIR_ROW: Record<Dir, number> = { down: 0, left: 1, right: 2, up: 3 };
const charFrame = (char: number, dir: Dir, col: number) =>
  ((char % CHAR_COUNT) * 4 + DIR_ROW[dir]) * CHAR_COLS + col;
/** NPC ids from world.ts map onto characters 1..5 (0 is the player) */
const npcChar = (id: number) => 1 + (Math.abs(id) % (CHAR_COUNT - 1));

/** minimal structural types so we can mutate kaplay objects with strict TS */
type LeafObj = { width: number; pos: { x: number; y: number } };
type PlayerObj = {
  pos: { x: number; y: number };
  frame: number;
  flipX: boolean;
  facing: Dir;
  step: number;
};

/** GBA town palette, sampled from the reference route/town tiles */
const PALETTE: Record<string, [number, number, number]> = {
  g: [124, 190, 148], // town grass (teal-green)
  p: [214, 176, 150], // dirt path
  r: [198, 154, 128], // dirt border / route ground
  w: [120, 190, 226], // water
  s: [230, 208, 166], // sand shore
  d: [226, 196, 146], // playground sand
  h: [180, 138, 96], // fence
  t: [96, 170, 116], // tall grass
  T: [124, 190, 148],
  f: [124, 190, 148],
  L: [124, 190, 148],
  B: [124, 190, 148],
  ".": [238, 224, 196],
  W: [122, 92, 72],
  V: [150, 116, 92],
  C: [206, 92, 92],
};

export function createGame(root: HTMLElement, cb: GameCallbacks): GameHandle {
  // Own the canvas so it always fills the React container instead of the window.
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.outline = "none";
  canvas.tabIndex = 0;
  root.appendChild(canvas);
  // keyboard events are bound to the canvas, so it must hold focus
  canvas.addEventListener("pointerdown", () => canvas.focus());
  requestAnimationFrame(() => canvas.focus());

  const k: KAPLAYCtx = kaplay({
    canvas,
    width: 960,
    height: 704,
    background: [46, 62, 48],
    global: false,
    crisp: true,
    pixelDensity: 1,
    stretch: true,
    letterbox: true,
    debug: false,
    focus: false,
  });

  for (const [name, src] of Object.entries(SPRITES)) k.loadSprite(name, src);
  k.loadSprite("chars", charactersSheet, { sliceX: CHAR_COLS, sliceY: CHAR_COUNT * 4 });

  const state = {
    paused: false,
    dir: null as Dir | null,
    facing: "down" as Dir,
    interact: null as null | (() => void),
  };

  function rgb(ch: string) {
    const c = PALETTE[ch] ?? PALETTE["g"]!;
    return k.rgb(c[0], c[1], c[2]);
  }

  /** stable per-tile pseudo random so the texture never flickers */
  const noise = (col: number, row: number, salt = 0) => {
    const n = Math.sin((col * 127.1 + row * 311.7 + salt * 74.7) * 43758.5453);
    return n - Math.floor(n);
  };

  function drawTile(ch: string, col: number, row: number) {
    const px = col * TILE;
    const py = row * TILE;
    const dot = (x: number, y: number, w: number, h: number, c: [number, number, number], z = 1) =>
      k.add([k.rect(w, h), k.pos(px + x, py + y), k.color(c[0], c[1], c[2]), k.z(z)]);

    k.add([k.rect(TILE, TILE), k.pos(px, py), k.color(rgb(ch)), k.z(0)]);

    if (ch === "g" || ch === "T" || ch === "f" || ch === "L" || ch === "B") {
      // GBA town grass: soft checker plus little blade clusters
      if ((col + row) % 2 === 0) dot(0, 0, TILE, TILE, [132, 198, 154], 0);
      const n = noise(col, row);
      dot(4 + Math.floor(n * 8), 6 + Math.floor(n * 10), 6, 2, [104, 172, 128]);
      dot(6 + Math.floor(n * 8), 8 + Math.floor(n * 10), 2, 3, [104, 172, 128]);
      dot(20 - Math.floor(n * 6), 20 + Math.floor(n * 6), 5, 2, [150, 212, 168]);
      dot(22 - Math.floor(n * 6), 18 + Math.floor(n * 6), 2, 3, [150, 212, 168]);
    }
    if (ch === "p" || ch === "r") {
      // packed dirt with pebbles, like the route ground in the reference
      const n = noise(col, row, 3);
      dot(0, 0, TILE, 3, ch === "r" ? [186, 142, 118] : [204, 164, 138], 1);
      dot(3 + Math.floor(n * 18), 8 + Math.floor(n * 12), 4, 3, [188, 146, 122]);
      dot(18 - Math.floor(n * 12), 20 - Math.floor(n * 10), 3, 2, [230, 196, 172]);
      dot(9 + Math.floor(n * 10), 24, 5, 2, [190, 150, 126]);
      if (n > 0.82) {
        dot(12, 12, 7, 5, [168, 150, 140], 2);
        dot(12, 12, 7, 2, [200, 186, 176], 3);
      }
    }
    if (ch === "d") {
      const n = noise(col, row, 5);
      dot(3 + Math.floor(n * 16), 10 + Math.floor(n * 12), 5, 3, [210, 176, 128]);
      dot(20 - Math.floor(n * 10), 21, 4, 3, [242, 218, 176]);
    }
    if (ch === "t") {
      // tall grass patch
      for (let i = 0; i < 5; i++) {
        const x = 2 + i * 6;
        dot(x, 8 + ((i * 5) % 9), 4, TILE - 10, [78, 152, 100], 3);
        dot(x, 6 + ((i * 5) % 9), 4, 4, [112, 190, 132], 4);
      }
    }
    if (ch === "h") {
      k.add([k.rect(TILE, 4), k.pos(px, py + 10), k.color(196, 154, 110), k.z(6)]);
      k.add([k.rect(TILE, 4), k.pos(px, py + 20), k.color(196, 154, 110), k.z(6)]);
      k.add([k.rect(5, 24), k.pos(px + 4, py + 5), k.color(150, 108, 70), k.z(7)]);
      k.add([k.rect(5, 24), k.pos(px + 22, py + 5), k.color(150, 108, 70), k.z(7)]);
    }
    if (ch === "w") {
      // water with animated highlight lines
      dot(0, 0, TILE, TILE, [104, 176, 218], 0);
      const a = k.add([
        k.rect(16, 3),
        k.pos(px + 4, py + 9),
        k.color(184, 228, 250),
        k.z(1),
        k.opacity(0.9),
      ]) as unknown as { pos: { x: number } };
      const b = k.add([
        k.rect(11, 3),
        k.pos(px + 14, py + 21),
        k.color(78, 148, 200),
        k.z(1),
      ]) as unknown as { pos: { x: number } };
      const ox = px + 4;
      const oxb = px + 14;
      k.onUpdate(() => {
        a.pos.x = ox + Math.sin(k.time() * 1.5 + col) * 3;
        b.pos.x = oxb + Math.cos(k.time() * 1.2 + row) * 3;
      });
    }
    if (ch === "T") {
      // rounded GBA tree: trunk, shaded canopy, highlights
      k.add([k.rect(9, 12), k.pos(px + 12, py + 19), k.color(126, 88, 58), k.z(3)]);
      k.add([k.rect(9, 3), k.pos(px + 12, py + 28), k.color(96, 66, 44), k.z(4)]);
      k.add([k.circle(15), k.pos(px + 16, py + 14), k.color(46, 118, 74), k.z(4)]);
      k.add([k.circle(12), k.pos(px + 14, py + 12), k.color(64, 148, 92), k.z(5)]);
      k.add([k.circle(6), k.pos(px + 11, py + 9), k.color(104, 184, 118), k.z(6)]);
      k.add([k.circle(3), k.pos(px + 22, py + 18), k.color(34, 96, 62), k.z(6)]);
    }
    if (ch === "f") {
      const n = noise(col, row, 7);
      const petals: [number, number, number] = n > 0.5 ? [238, 108, 132] : [246, 224, 120];
      for (const [ox, oy] of [
        [7, 9],
        [19, 18],
        [12, 22],
      ] as const) {
        dot(ox, oy, 5, 5, petals, 3);
        dot(ox + 1, oy + 1, 3, 3, [252, 250, 236], 4);
      }
    }
    if (ch === "L") {
      k.add([k.rect(5, 22), k.pos(px + 14, py + 10), k.color(58, 62, 74), k.z(4)]);
      k.add([k.rect(13, 4), k.pos(px + 10, py + 30), k.color(46, 50, 60), k.z(5)]);
      k.add([
        k.rect(15, 13, { radius: 3 }),
        k.pos(px + 9, py + 1),
        k.color(252, 232, 132),
        k.outline(2, k.rgb(58, 62, 74)),
        k.z(5),
      ]);
      k.add([k.rect(5, 4), k.pos(px + 11, py + 3), k.color(255, 252, 210), k.z(6)]);
    }
    if (ch === "s") {
      // sandy shore with pebble rim
      const n = noise(col, row, 11);
      dot(2 + Math.floor(n * 20), 6 + Math.floor(n * 14), 5, 4, [214, 190, 146], 1);
      dot(16 - Math.floor(n * 10), 22, 6, 4, [244, 228, 190], 1);
      if (n > 0.6) {
        dot(10, 12, 9, 7, [162, 150, 138], 2);
        dot(10, 12, 9, 3, [198, 188, 176], 3);
      }
    }
    if (ch === "W") {
      k.add([k.rect(TILE, 6), k.pos(px, py + 26), k.color(94, 68, 52), k.z(2)]);
    }
    if (ch === "V") {
      k.add([k.rect(TILE - 8, 12), k.pos(px + 4, py + 8), k.color(178, 148, 118), k.z(2)]);
    }
    if (ch === "C") {
      k.add([k.rect(TILE - 6, 10), k.pos(px + 3, py + 18), k.color(234, 128, 128), k.z(2)]);
    }
  }

  function drawFurniture(item: Interactable) {
    const { kind, x: col, y: row } = item;
    const px = col * TILE;
    const py = row * TILE;

    if (kind === "npc") {
      const face = item.face ?? "down";
      const char = npcChar(item.npc ?? 0);
      const spr = k.add([
        k.sprite("chars", { frame: charFrame(char, face, 0) }),
        k.pos(px + TILE / 2, py + TILE - 2),
        k.anchor("bot"),
        k.scale(0.8),
        k.z(20),
      ]) as unknown as { frame: number };
      // gentle idle breathing: alternate between the two step frames
      k.onUpdate(() => {
        const t = Math.floor(k.time() * 1.6) % 4;
        spr.frame = charFrame(char, face, t === 1 ? 1 : t === 3 ? 3 : 0);
      });
      return;
    }

    const box = (
      x: number,
      y: number,
      w: number,
      h: number,
      c: [number, number, number],
      z = 8,
    ) =>
      k.add([
        k.rect(w, h, { radius: 2 }),
        k.pos(px + x, py + y),
        k.color(c[0], c[1], c[2]),
        k.outline(2, k.rgb(40, 34, 46)),
        k.z(z),
      ]);

    switch (kind as FurnitureKind) {
      case "desk":
        box(1, 12, 30, 6, [156, 112, 76]);
        box(3, 18, 5, 12, [126, 90, 60]);
        box(24, 18, 5, 12, [126, 90, 60]);
        box(8, 2, 16, 11, [72, 88, 132], 9);
        k.add([k.rect(12, 7), k.pos(px + 10, py + 4), k.color(146, 226, 202), k.z(10)]);
        break;
      case "shelf":
        box(2, 0, 28, 30, [148, 106, 72]);
        box(5, 4, 22, 5, [214, 96, 96], 9);
        box(5, 13, 22, 5, [96, 148, 214], 9);
        box(5, 22, 22, 5, [246, 206, 106], 9);
        break;
      case "plant":
        box(11, 20, 11, 11, [186, 118, 82]);
        box(6, 2, 20, 18, [72, 158, 96], 9);
        break;
      case "trophy":
        box(8, 22, 17, 9, [126, 90, 60]);
        box(13, 12, 6, 11, [244, 206, 92]);
        box(7, 2, 18, 12, [252, 222, 118], 9);
        break;
      case "counter":
        box(0, 8, TILE, 22, [178, 130, 88]);
        box(2, 4, TILE - 4, 6, [220, 178, 128], 9);
        break;
      case "painting":
        box(3, 2, 26, 22, [92, 76, 132]);
        box(6, 5, 20, 16, [156, 206, 236], 9);
        k.add([k.rect(8, 8), k.pos(px + 9, py + 10), k.color(246, 216, 120), k.z(10)]);
        break;
      case "bed":
        box(4, 2, 24, 28, [226, 226, 236]);
        box(4, 2, 24, 9, [236, 246, 252], 9);
        box(4, 18, 24, 12, [96, 148, 214], 9);
        break;
      case "rug":
        box(1, 6, 30, 20, [214, 132, 132], 2);
        break;
      case "console":
        box(4, 8, 24, 22, [72, 70, 86]);
        box(7, 11, 18, 12, [126, 226, 196], 9);
        k.add([k.rect(4, 4), k.pos(px + 22, py + 25), k.color(238, 108, 108), k.z(10)]);
        break;
      case "swing": {
        box(2, 2, 4, 28, [168, 120, 76], 9);
        box(26, 2, 4, 28, [168, 120, 76], 9);
        box(2, 2, 28, 4, [186, 138, 90], 10);
        const seat = k.add([
          k.rect(12, 4, { radius: 1 }),
          k.pos(px + 10, py + 20),
          k.color(214, 92, 92),
          k.outline(2, k.rgb(40, 34, 46)),
          k.z(11),
        ]);
        k.onUpdate(() => {
          seat.pos.x = px + 10 + Math.sin(k.time() * 2) * 4;
        });
        break;
      }
      case "slide":
        box(20, 2, 8, 26, [156, 112, 76], 9);
        box(4, 8, 24, 6, [246, 196, 92], 10);
        box(2, 12, 8, 18, [214, 138, 82], 9);
        break;
      case "sandbox":
        box(0, 6, TILE, 24, [238, 214, 162], 6);
        box(3, 9, 26, 18, [246, 228, 186], 7);
        k.add([k.rect(8, 6), k.pos(px + 12, py + 16), k.color(206, 176, 128), k.z(8)]);
        break;
      case "bench":
        box(1, 14, 30, 6, [168, 120, 76]);
        box(1, 8, 30, 5, [186, 138, 90], 9);
        box(4, 20, 4, 10, [126, 88, 56]);
        box(24, 20, 4, 10, [126, 88, 56]);
        break;
      case "fountain": {
        box(0, 6, TILE, 24, [186, 190, 198], 6);
        box(4, 10, 24, 16, [108, 178, 226], 7);
        const jet = k.add([
          k.rect(6, 12, { radius: 3 }),
          k.pos(px + 13, py + 6),
          k.color(196, 232, 252),
          k.z(9),
        ]);
        k.onUpdate(() => {
          jet.pos.y = py + 4 + Math.sin(k.time() * 4) * 3;
        });
        break;
      }
      case "sign":
        box(13, 14, 6, 16, [140, 100, 66], 9);
        box(2, 2, 28, 16, [196, 150, 100], 10);
        k.add([k.rect(20, 3), k.pos(px + 6, py + 7), k.color(90, 62, 40), k.z(11)]);
        k.add([k.rect(14, 3), k.pos(px + 6, py + 13), k.color(90, 62, 40), k.z(11)]);
        break;
      default:
        break;
    }
  }

  function makePlayer(pos: { x: number; y: number }) {
    const p = k.add([
      k.sprite("chars", { frame: charFrame(0, "down", 0) }),
      k.pos(pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2),
      k.anchor("center"),
      k.scale(0.8),
      k.z(30),
      { facing: "down" as Dir, step: 0 },
      "player",
    ]);
    return p;
  }

  function isSolid(rows: string[], col: number, row: number) {
    const line = rows[row];
    if (!line) return true;
    const ch = line[col];
    if (ch === undefined) return true;
    return SOLID_TILES.has(ch);
  }

  k.scene("play", (arg: { id: SceneId; spawn?: { x: number; y: number } }) => {
    const scene = SCENES[arg.id];
    const rows = scene.grid;
    const mapW = rows[0]!.length;
    const mapH = rows.length;

    for (let row = 0; row < mapH; row++) {
      for (let col = 0; col < mapW; col++) {
        drawTile(rows[row]![col] ?? "g", col, row);
      }
    }

    // buildings + automatic sliding doors
    const doors: {
      x: number;
      y: number;
      open: number;
      apply: (open: number) => void;
    }[] = [];

    for (const b of scene.buildings) {
      const w = b.w * TILE;
      k.add([
        k.sprite(b.sprite),
        k.pos(b.x * TILE - 6, b.y * TILE - TILE * 1.6),
        k.scale((w + 12) / 820),
        k.z(12),
      ]);

      const dx = b.door.x * TILE;
      const dy = b.door.y * TILE - TILE;
      // dark doorway behind the leaves
      k.add([k.rect(TILE - 4, TILE + 2), k.pos(dx + 2, dy - 2), k.color(38, 30, 34), k.z(13)]);
      k.add([
        k.rect(TILE, 6),
        k.pos(dx, dy - 8),
        k.color(126, 88, 56),
        k.outline(2, k.rgb(52, 38, 30)),
        k.z(16),
      ]);
      const leaf = (offX: number) =>
        k.add([
          k.rect(13, TILE - 2, { radius: 1 }),
          k.pos(dx + offX, dy),
          k.color(146, 198, 226),
          k.outline(2, k.rgb(66, 92, 116)),
          k.z(15),
        ]) as unknown as LeafObj;
      const left = leaf(2);
      const right = leaf(17);
      doors.push({
        x: b.door.x,
        y: b.door.y,
        open: 0,
        apply: (open: number) => {
          const lw = Math.max(1, 13 * (1 - open));
          left.width = lw;
          right.width = lw;
          right.pos.x = dx + 30 - lw;
        },
      });

      // door mat
      k.add([k.rect(TILE - 6, 6), k.pos(dx + 3, b.door.y * TILE + 4), k.color(206, 92, 92), k.z(6)]);

      k.add([
        k.text(b.sign, { size: 9, font: "monospace", align: "center", width: w + 60 }),
        k.pos(b.x * TILE + w / 2, (b.y + b.h) * TILE + 4),
        k.anchor("top"),
        k.color(28, 40, 30),
        k.z(14),
      ]);
    }

    for (const item of scene.interactables) drawFurniture(item);

    const spawn = arg.spawn ?? scene.spawn;
    const player = makePlayer(spawn) as unknown as PlayerObj;

    // camera
    k.onUpdate(() => {
      const halfW = k.width() / 2;
      const halfH = k.height() / 2;
      const cx =
        mapW * TILE <= k.width()
          ? (mapW * TILE) / 2
          : Math.min(Math.max(player.pos.x, halfW), mapW * TILE - halfW);
      const cy =
        mapH * TILE <= k.height()
          ? (mapH * TILE) / 2
          : Math.min(Math.max(player.pos.y, halfH), mapH * TILE - halfH);
      k.setCamPos(cx, cy);
    });

    const SPEED = 116;

    k.onUpdate(() => {
      // doors slide open when the player is close, even while paused
      const ptxD = player.pos.x / TILE - 0.5;
      const ptyD = player.pos.y / TILE - 0.5;
      for (const d of doors) {
        const near = Math.hypot(d.x - ptxD, d.y - ptyD) < 1.8;
        d.open += ((near ? 1 : 0) - d.open) * Math.min(1, k.dt() * 8);
        d.apply(d.open);
      }

      if (state.paused) return;

      let dx = 0;
      let dy = 0;
      if (k.isKeyDown("right") || k.isKeyDown("d")) dx += 1;
      if (k.isKeyDown("left") || k.isKeyDown("a")) dx -= 1;
      if (k.isKeyDown("down") || k.isKeyDown("s")) dy += 1;
      if (k.isKeyDown("up") || k.isKeyDown("w")) dy -= 1;
      if (state.dir === "right") dx += 1;
      if (state.dir === "left") dx -= 1;
      if (state.dir === "down") dy += 1;
      if (state.dir === "up") dy -= 1;

      dx = Math.sign(dx);
      dy = Math.sign(dy);

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        const vx = (dx / len) * SPEED * k.dt();
        const vy = (dy / len) * SPEED * k.dt();

        // axis-separated collision against the tile grid
        const tryMove = (nx: number, ny: number) => {
          const half = 9;
          const corners = [
            [nx - half, ny + 2],
            [nx + half, ny + 2],
            [nx - half, ny + 13],
            [nx + half, ny + 13],
          ];
          return corners.every(
            ([cx, cy]) => !isSolid(rows, Math.floor(cx! / TILE), Math.floor(cy! / TILE)),
          );
        };
        if (tryMove(player.pos.x + vx, player.pos.y)) player.pos.x += vx;
        if (tryMove(player.pos.x, player.pos.y + vy)) player.pos.y += vy;

        player.facing = dy > 0 ? "down" : dy < 0 ? "up" : dx > 0 ? "right" : "left";
        state.facing = player.facing;
        player.step += k.dt() * 7;
        // walk cycle: idle, step-left, idle, step-right
        const cycle = [0, 1, 0, 3];
        player.frame = charFrame(0, player.facing, cycle[Math.floor(player.step) % 4] ?? 0);
      } else {
        player.step = 0;
        player.frame = charFrame(0, player.facing, 0);
      }

      // nearest action
      const ptx = player.pos.x / TILE - 0.5;
      const pty = player.pos.y / TILE - 0.5;
      let best: { label: string; action: string; run: () => void; dist: number } | null = null;

      for (const item of scene.interactables) {
        const d = Math.hypot(item.x - ptx, item.y - pty);
        if (d < 1.35 && (!best || d < best.dist)) {
          best = {
            label: item.label,
            action: item.kind === "npc" ? "Falar" : "Olhar",
            dist: d,
            run: () => cb.onDialogue(item.dialogue),
          };
        }
      }
      for (const exit of scene.exits) {
        const d = Math.hypot(exit.x - ptx, exit.y - pty);
        if (d < 1.1 && (!best || d < best.dist)) {
          const target = SCENES[exit.to];
          best = {
            label: scene.indoor ? "Voltar pra cidade" : target.title,
            action: scene.indoor ? "Sair" : "Entrar",
            dist: d,
            run: () => goTo(exit.to),
          };
        }
      }

      state.interact = best ? best.run : null;
      cb.onPrompt(best ? { label: best.label, action: best.action } : null);
    });

    k.onKeyPress("enter", () => triggerInteract());
    k.onKeyPress("space", () => triggerInteract());
    k.onKeyPress("e", () => triggerInteract());

    cb.onScene(scene);
  });

  function goTo(id: SceneId) {
    const target = SCENES[id];
    let spawn = target.spawn;
    if (id === "city") {
      // return in front of whichever building we came from
      const from = currentSceneId;
      const b = SCENES.city.buildings.find((x) => x.to === from);
      if (b) spawn = { x: b.door.x, y: b.door.y + 1 };
    }
    currentSceneId = id;
    state.dir = null;
    cb.onPrompt(null);
    k.go("play", { id, spawn });
  }

  function triggerInteract() {
    if (state.paused) return;
    state.interact?.();
  }

  let currentSceneId: SceneId = "city";
  k.go("play", { id: "city" });

  return {
    destroy: () => {
      k.quit();
      canvas.remove();
    },
    setPaused: (paused) => {
      state.paused = paused;
      if (paused) state.dir = null;
    },
    setDir: (dir) => {
      state.dir = dir;
    },
    interact: triggerInteract,
    goTo,
  };
}
