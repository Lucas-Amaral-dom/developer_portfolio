// Pure, browser-safe map data for the pixel-art portfolio.
// No engine imports here so both SSR routes and the lazy game module can use it.

export const TILE = 32;

export type SceneId = "city" | "home" | "lab" | "arena" | "shop";

export type FurnitureKind =
  | "npc"
  | "desk"
  | "shelf"
  | "plant"
  | "trophy"
  | "counter"
  | "painting"
  | "bed"
  | "rug"
  | "console"
  | "swing"
  | "slide"
  | "sandbox"
  | "bench"
  | "fountain"
  | "sign";

export interface Interactable {
  /** tile coords of the object itself */
  x: number;
  y: number;
  kind: FurnitureKind;
  /** row of the NPC spritesheet (0-12), only for kind "npc" */
  npc?: number;
  /** which way the NPC looks: down | up | left | right */
  face?: "down" | "up" | "left" | "right";
  /** floating label above the object */
  label: string;
  /** id resolved to dialogue pages by the React layer */
  dialogue: string;
}

export interface Exit {
  x: number;
  y: number;
  to: SceneId;
  spawn: { x: number; y: number };
}

export interface BuildingDef {
  sprite: "home" | "lab" | "arena" | "shop";
  /** top-left tile of the collision footprint */
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number };
  to: SceneId;
  sign: string;
}

export interface SceneDef {
  id: SceneId;
  title: string;
  grid: string[];
  spawn: { x: number; y: number };
  interactables: Interactable[];
  exits: Exit[];
  buildings: BuildingDef[];
  indoor: boolean;
  hint: string;
}

/* ── grid helpers (build arrays instead of hand-counted string art) ───────── */

function makeGrid(w: number, h: number, fill: string): string[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
}

function set(g: string[][], x: number, y: number, ch: string) {
  const row = g[y];
  if (row && row[x] !== undefined) row[x] = ch;
}

function fillRect(g: string[][], x: number, y: number, w: number, h: number, ch: string) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      set(g, col, row, ch);
    }
  }
}

function border(g: string[][], ch: string) {
  const h = g.length;
  const w = g[0]!.length;
  fillRect(g, 0, 0, w, 1, ch);
  fillRect(g, 0, h - 1, w, 1, ch);
  fillRect(g, 0, 0, 1, h, ch);
  fillRect(g, w - 1, 0, 1, h, ch);
}

function toRows(g: string[][]): string[] {
  return g.map((row) => row.join(""));
}

/* ── city ────────────────────────────────────────────────────────────────── */

const CITY_W = 30;
const CITY_H = 22;

export const CITY_BUILDINGS: BuildingDef[] = [
  {
    sprite: "home",
    x: 3,
    y: 3,
    w: 5,
    h: 4,
    door: { x: 5, y: 7 },
    to: "home",
    sign: "CASA — Sobre mim",
  },
  {
    sprite: "lab",
    x: 12,
    y: 3,
    w: 5,
    h: 4,
    door: { x: 14, y: 7 },
    to: "lab",
    sign: "LAB SENAI — Skills",
  },
  {
    sprite: "arena",
    x: 21,
    y: 3,
    w: 5,
    h: 4,
    door: { x: 23, y: 7 },
    to: "arena",
    sign: "ARENA — Projetos",
  },
  {
    sprite: "shop",
    x: 12,
    y: 13,
    w: 5,
    h: 4,
    door: { x: 14, y: 17 },
    to: "shop",
    sign: "LOJA — Contato",
  },
];

function buildCity(): SceneDef {
  const g = makeGrid(CITY_W, CITY_H, "g");

  // route ground ring around the town, like the GBA reference map
  fillRect(g, 1, 1, CITY_W - 2, 1, "r");
  fillRect(g, 1, CITY_H - 2, CITY_W - 2, 1, "r");
  fillRect(g, 1, 1, 1, CITY_H - 2, "r");
  fillRect(g, CITY_W - 2, 1, 1, CITY_H - 2, "r");

  // dirt paths (main streets)
  fillRect(g, 1, 8, CITY_W - 2, 2, "p");
  fillRect(g, 1, 18, CITY_W - 2, 2, "p");
  fillRect(g, 14, 8, 2, 12, "p");
  fillRect(g, 5, 7, 1, 2, "p");
  fillRect(g, 23, 7, 1, 2, "p");
  fillRect(g, 14, 17, 1, 2, "p");
  // side paths
  fillRect(g, 4, 10, 1, 8, "p");
  fillRect(g, 24, 10, 1, 8, "p");
  fillRect(g, 18, 12, 1, 6, "p");

  // pond with sandy shore (right side, like the reference town)
  fillRect(g, 21, 11, 7, 5, "s");
  fillRect(g, 22, 12, 5, 3, "w");

  // tall grass patches on the route ground
  fillRect(g, 2, 3, 2, 3, "t");
  fillRect(g, 26, 15, 2, 3, "t");
  fillRect(g, 20, 20, 3, 1, "t");

  // playground (left side): sand floor + fence
  fillRect(g, 6, 11, 7, 6, "d");
  fillRect(g, 6, 10, 7, 1, "h");
  fillRect(g, 6, 11, 1, 6, "h");
  fillRect(g, 12, 11, 1, 6, "h");
  set(g, 9, 10, "d"); // playground entrance

  // flower gardens with fences
  fillRect(g, 26, 3, 3, 3, "f");
  fillRect(g, 26, 6, 3, 1, "h");
  fillRect(g, 1, 11, 3, 3, "f");

  // trees
  for (const [x, y] of [
    [10, 20],
    [19, 11],
    [19, 16],
    [28, 11],
    [28, 16],
    [2, 16],
    [2, 20],
    [27, 20],
    [20, 20],
    [9, 3],
    [18, 3],
  ] as const) {
    set(g, x, y, "T");
  }
  // flower patches
  for (const [x, y] of [
    [13, 7],
    [16, 7],
    [4, 7],
    [7, 7],
    [22, 7],
    [25, 7],
    [12, 20],
    [17, 20],
    [5, 20],
  ] as const) {
    set(g, x, y, "f");
  }
  // lamp posts
  for (const [x, y] of [
    [13, 10],
    [17, 10],
    [13, 16],
    [21, 18],
    [8, 18],
    [26, 10],
  ] as const) {
    set(g, x, y, "L");
  }

  // tree border
  border(g, "T");

  // building footprints block movement
  for (const b of CITY_BUILDINGS) {
    fillRect(g, b.x, b.y, b.w, b.h, "B");
    set(g, b.door.x, b.door.y, "p");
  }

  return {
    id: "city",
    title: "Cidade Dev",
    grid: toRows(g),
    spawn: { x: 15, y: 11 },
    indoor: false,
    hint: "Setas / WASD para andar. As portas abrem sozinhas — aperte A na porta para entrar.",
    buildings: CITY_BUILDINGS,
    interactables: [
      { x: 17, y: 12, kind: "sign", label: "Placa da cidade", dialogue: "city-sign" },
      {
        x: 12,
        y: 9,
        kind: "npc",
        npc: 4,
        face: "down",
        label: "Guia",
        dialogue: "city-guide",
      },
      {
        x: 9,
        y: 14,
        kind: "npc",
        npc: 2,
        face: "left",
        label: "Garoto do parquinho",
        dialogue: "city-kid",
      },
      {
        x: 20,
        y: 13,
        kind: "npc",
        npc: 5,
        face: "right",
        label: "Moça do lago",
        dialogue: "city-lake",
      },
      {
        x: 17,
        y: 18,
        kind: "npc",
        npc: 8,
        face: "up",
        label: "Senhor da praça",
        dialogue: "city-oldman",
      },
      { x: 7, y: 12, kind: "swing", label: "Balanço", dialogue: "city-playground" },
      { x: 11, y: 12, kind: "slide", label: "Escorregador", dialogue: "city-playground" },
      { x: 9, y: 16, kind: "sandbox", label: "Caixa de areia", dialogue: "city-playground" },
      { x: 16, y: 20, kind: "bench", label: "Banco", dialogue: "city-bench" },
      { x: 18, y: 20, kind: "bench", label: "Banco", dialogue: "city-bench" },
      { x: 15, y: 11, kind: "fountain", label: "Fonte", dialogue: "city-fountain" },
    ],
    exits: CITY_BUILDINGS.map((b) => ({
      x: b.door.x,
      y: b.door.y,
      to: b.to,
      spawn: { x: 6, y: 7 },
    })),
  };
}

/* ── interiors ───────────────────────────────────────────────────────────── */

function buildInterior(
  id: SceneId,
  title: string,
  interactables: Interactable[],
  hint: string,
): SceneDef {
  const w = 13;
  const h = 9;
  const g = makeGrid(w, h, ".");
  border(g, "W");
  fillRect(g, 1, 1, w - 2, 1, "V"); // decorated back wall
  set(g, 6, h - 1, "C"); // exit carpet in the wall row

  return {
    id,
    title,
    grid: toRows(g),
    spawn: { x: 6, y: 7 },
    indoor: true,
    hint,
    buildings: [],
    interactables,
    exits: [{ x: 6, y: h - 1, to: "city", spawn: { x: 0, y: 0 } }],
  };
}

export const SCENES: Record<SceneId, SceneDef> = {
  city: buildCity(),
  home: buildInterior(
    "home",
    "Casa — Sobre mim",
    [
      { x: 6, y: 4, kind: "npc", npc: 2, face: "down", label: "Lucas", dialogue: "about-intro" },
      { x: 2, y: 2, kind: "painting", label: "Quadro", dialogue: "about-card" },
      { x: 10, y: 2, kind: "bed", label: "Cama", dialogue: "about-hobby" },
      { x: 4, y: 6, kind: "desk", label: "Escrivaninha", dialogue: "about-story" },
      { x: 9, y: 6, kind: "console", label: "Console", dialogue: "about-seeking" },
      { x: 1, y: 6, kind: "plant", label: "Planta", dialogue: "flavor-plant" },
    ],
    "Fale com o Lucas e vasculhe os móveis. Aperte A perto de cada um.",
  ),
  lab: buildInterior(
    "lab",
    "Lab SENAI — Skills",
    [
      { x: 2, y: 3, kind: "desk", label: "Bancada 1", dialogue: "skill-base" },
      { x: 5, y: 3, kind: "desk", label: "Bancada 2", dialogue: "skill-web" },
      { x: 8, y: 3, kind: "desk", label: "Bancada 3", dialogue: "skill-data" },
      { x: 11, y: 3, kind: "desk", label: "Bancada 4", dialogue: "skill-quality" },
      {
        x: 6,
        y: 6,
        kind: "npc",
        npc: 9,
        face: "down",
        label: "Instrutor",
        dialogue: "skills-intro",
      },
      { x: 1, y: 6, kind: "shelf", label: "Estante", dialogue: "skills-list" },
    ],
    "Cada bancada mostra um grupo de competências.",
  ),
  arena: buildInterior(
    "arena",
    "Arena — Projetos",
    [
      { x: 3, y: 3, kind: "trophy", label: "Projeto 1", dialogue: "project-0" },
      { x: 6, y: 3, kind: "trophy", label: "Projeto 2", dialogue: "project-1" },
      { x: 9, y: 3, kind: "trophy", label: "Projeto 3", dialogue: "project-2" },
      {
        x: 11,
        y: 6,
        kind: "npc",
        npc: 6,
        face: "left",
        label: "Juíza",
        dialogue: "projects-intro",
      },
      { x: 1, y: 6, kind: "shelf", label: "Mural", dialogue: "projects-all" },
    ],
    "Cada troféu é um projeto, com links pros repositórios.",
  ),
  shop: buildInterior(
    "shop",
    "Loja — Contato",
    [
      { x: 6, y: 3, kind: "counter", label: "Balcão", dialogue: "contact-form" },
      {
        x: 6,
        y: 2,
        kind: "npc",
        npc: 1,
        face: "down",
        label: "Atendente",
        dialogue: "contact-intro",
      },
      { x: 2, y: 6, kind: "shelf", label: "Prateleira", dialogue: "contact-links" },
      { x: 10, y: 6, kind: "plant", label: "Planta", dialogue: "flavor-plant" },
      { x: 10, y: 3, kind: "console", label: "Terminal", dialogue: "contact-city" },
    ],
    "Fale com a atendente para enviar uma mensagem de verdade.",
  ),
};

export const SOLID_TILES = new Set(["T", "w", "B", "W", "V", "h"]);

export const BADGES: { scene: SceneId; name: string }[] = [
  { scene: "home", name: "Insígnia da Casa" },
  { scene: "lab", name: "Insígnia do Lab" },
  { scene: "arena", name: "Insígnia da Arena" },
  { scene: "shop", name: "Insígnia da Loja" },
];
