import kaplay from "kaplay";
import type { KAPLAYCtx, GameObj } from "kaplay";

import { SCENES, SOLID_TILES, TILE, type FurnitureKind, type SceneDef, type SceneId } from "./world";

import homeSprite from "@/assets/build-home.png";
import labSprite from "@/assets/build-lab.png";
import arenaSprite from "@/assets/build-arena.png";
import shopSprite from "@/assets/build-shop.png";

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

const PALETTE: Record<string, [number, number, number]> = {
  g: [126, 197, 108],
  r: [222, 205, 168],
  w: [92, 168, 224],
  s: [235, 218, 168],
  T: [96, 168, 96],
  f: [126, 197, 108],
  L: [126, 197, 108],
  B: [126, 197, 108],
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
  root.appendChild(canvas);

  const k: KAPLAYCtx = kaplay({
    canvas,
    width: 640,
    height: 448,
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

  function drawTile(ch: string, col: number, row: number) {
    const px = col * TILE;
    const py = row * TILE;
    k.add([k.rect(TILE, TILE), k.pos(px, py), k.color(rgb(ch)), k.z(0)]);

    if (ch === "g") {
      k.add([k.rect(4, 4), k.pos(px + 7, py + 9), k.color(150, 214, 122), k.z(1)]);
      k.add([k.rect(3, 3), k.pos(px + 21, py + 20), k.color(104, 178, 92), k.z(1)]);
    }
    if (ch === "r") {
      k.add([k.rect(TILE, 3), k.pos(px, py + 15), k.color(236, 222, 190), k.z(1)]);
    }
    if (ch === "w") {
      k.add([k.rect(18, 3), k.pos(px + 5, py + 8), k.color(178, 226, 252), k.z(1)]);
      k.add([k.rect(12, 3), k.pos(px + 12, py + 21), k.color(58, 138, 198), k.z(1)]);
    }
    if (ch === "T") {
      k.add([k.rect(8, 14), k.pos(px + 12, py + 16), k.color(122, 84, 54), k.z(3)]);
      k.add([
        k.rect(26, 22, { radius: 6 }),
        k.pos(px + 3, py + 2),
        k.color(56, 140, 80),
        k.outline(2, k.rgb(28, 60, 40)),
        k.z(4),
      ]);
      k.add([k.rect(8, 6, { radius: 3 }), k.pos(px + 8, py + 6), k.color(86, 176, 104), k.z(5)]);
    }
    if (ch === "f") {
      k.add([k.rect(5, 5), k.pos(px + 8, py + 10), k.color(238, 96, 124), k.z(3)]);
      k.add([k.rect(5, 5), k.pos(px + 19, py + 19), k.color(252, 226, 118), k.z(3)]);
    }
    if (ch === "L") {
      k.add([k.rect(4, 20), k.pos(px + 14, py + 11), k.color(48, 52, 62), k.z(4)]);
      k.add([
        k.rect(14, 12, { radius: 3 }),
        k.pos(px + 9, py + 2),
        k.color(252, 232, 132),
        k.outline(2, k.rgb(48, 52, 62)),
        k.z(5),
      ]);
    }
    if (ch === "s") {
      k.add([k.rect(TILE, 5), k.pos(px, py + 24), k.color(214, 196, 148), k.z(1)]);
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

  function drawFurniture(kind: FurnitureKind, col: number, row: number) {
    const px = col * TILE;
    const py = row * TILE;
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

    switch (kind) {
      case "npc-dev":
      case "npc-clerk":
      case "npc-mentor": {
        const shirt: [number, number, number] =
          kind === "npc-dev" ? [86, 132, 232] : kind === "npc-clerk" ? [232, 118, 132] : [246, 210, 96];
        box(9, 14, 14, 16, shirt, 9);
        box(8, 2, 16, 14, [246, 214, 182], 9);
        box(6, 0, 20, 7, [64, 48, 44], 10);
        k.add([k.rect(3, 3), k.pos(px + 12, py + 9), k.color(40, 34, 46), k.z(11)]);
        k.add([k.rect(3, 3), k.pos(px + 18, py + 9), k.color(40, 34, 46), k.z(11)]);
        break;
      }
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
    }
  }

  function makePlayer(pos: { x: number; y: number }) {
    const p = k.add([
      k.pos(pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2),
      k.anchor("center"),
      k.z(30),
      { facing: "down" as Dir, step: 0 },
      "player",
    ]);
    const part = (
      x: number,
      y: number,
      w: number,
      h: number,
      c: [number, number, number],
      tag?: string,
    ) => {
      const o = p.add([
        k.rect(w, h, { radius: 2 }),
        k.pos(x, y),
        k.color(c[0], c[1], c[2]),
        k.z(1),
        ...(tag ? [tag] : []),
      ]);
      return o;
    };
    part(-8, -2, 16, 16, [72, 118, 220]); // body
    const legL = part(-6, 12, 5, 5, [48, 44, 58], "legL");
    const legR = part(1, 12, 5, 5, [48, 44, 58], "legR");
    part(-9, -16, 18, 15, [248, 216, 184]); // head
    part(-11, -20, 22, 8, [206, 66, 66]); // cap
    const eyeL = part(-6, -9, 3, 4, [40, 34, 46], "eye");
    const eyeR = part(2, -9, 3, 4, [40, 34, 46], "eye");
    return { obj: p, eyes: [eyeL, eyeR] as GameObj[], legL, legR };
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

    // buildings
    for (const b of scene.buildings) {
      const w = b.w * TILE;
      k.add([
        k.sprite(b.sprite),
        k.pos(b.x * TILE - 6, b.y * TILE - TILE * 1.6),
        k.scale((w + 12) / 820),
        k.z(12),
      ]);
      k.add([
        k.rect(TILE, 5),
        k.pos(b.door.x * TILE, b.door.y * TILE - 4),
        k.color(96, 64, 44),
        k.z(6),
      ]);
      k.add([
        k.text(b.sign, { size: 9, font: "monospace", align: "center", width: w + 60 }),
        k.pos(b.x * TILE + w / 2, (b.y + b.h) * TILE + 4),
        k.anchor("top"),
        k.color(28, 40, 30),
        k.z(14),
      ]);
    }

    for (const item of scene.interactables) drawFurniture(item.kind, item.x, item.y);

    const spawn = arg.spawn ?? scene.spawn;
    const { obj: player, eyes, legL, legR } = makePlayer(spawn);

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
        player.step += k.dt() * 10;
        const bob = Math.sin(player.step * 2) * 1.5;
        legL.pos.y = 12 + bob;
        legR.pos.y = 12 - bob;
        for (const e of eyes) e.hidden = player.facing === "up";
      } else {
        player.step = 0;
        legL.pos.y = 12;
        legR.pos.y = 12;
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
            action: "Falar",
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
