// Pure, browser-safe map data for the pixel-art portfolio.
// No engine imports here so both SSR routes and the lazy game module can use it.

export const TILE = 32;

export type SceneId = "city" | "home" | "lab" | "arena" | "shop";

export type FurnitureKind =
  | "npc-dev"
  | "npc-clerk"
  | "npc-mentor"
  | "desk"
  | "shelf"
  | "plant"
  | "trophy"
  | "counter"
  | "painting"
  | "bed"
  | "rug"
  | "console";

export interface Interactable {
  /** tile coords of the object itself */
  x: number;
  y: number;
  kind: FurnitureKind;
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

  // roads
  fillRect(g, 1, 8, CITY_W - 2, 2, "r");
  fillRect(g, 1, 18, CITY_W - 2, 2, "r");
  fillRect(g, 14, 8, 2, 12, "r");
  fillRect(g, 5, 7, 1, 2, "r");
  fillRect(g, 23, 7, 1, 2, "r");
  fillRect(g, 14, 17, 1, 2, "r");

  // pond
  fillRect(g, 3, 12, 6, 4, "w");
  fillRect(g, 3, 11, 6, 1, "s"); // sand shore

  // decoration
  for (const [x, y] of [
    [10, 10],
    [10, 14],
    [19, 11],
    [19, 15],
    [25, 12],
    [25, 15],
    [2, 20],
    [27, 20],
  ] as const) {
    set(g, x, y, "T");
  }
  for (const [x, y] of [
    [13, 7],
    [16, 7],
    [4, 7],
    [7, 7],
    [22, 7],
    [25, 7],
    [12, 20],
    [17, 20],
  ] as const) {
    set(g, x, y, "f");
  }
  for (const [x, y] of [
    [13, 10],
    [17, 10],
    [13, 16],
    [21, 18],
    [8, 18],
  ] as const) {
    set(g, x, y, "L");
  }

  // tree border
  border(g, "T");

  // building footprints block movement
  for (const b of CITY_BUILDINGS) {
    fillRect(g, b.x, b.y, b.w, b.h, "B");
    set(g, b.door.x, b.door.y, "r");
  }

  return {
    id: "city",
    title: "Cidade Dev",
    grid: toRows(g),
    spawn: { x: 15, y: 11 },
    indoor: false,
    hint: "Use as setas / WASD para andar. Fique na porta e aperte A.",
    buildings: CITY_BUILDINGS,
    interactables: [
      {
        x: 17,
        y: 11,
        kind: "console",
        label: "Placa da cidade",
        dialogue: "city-sign",
      },
      {
        x: 12,
        y: 11,
        kind: "npc-mentor",
        label: "Guia",
        dialogue: "city-guide",
      },
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
      { x: 6, y: 4, kind: "npc-dev", label: "Lucas", dialogue: "about-intro" },
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
      { x: 6, y: 6, kind: "npc-mentor", label: "Instrutor", dialogue: "skills-intro" },
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
      { x: 11, y: 6, kind: "npc-mentor", label: "Juíza", dialogue: "projects-intro" },
      { x: 1, y: 6, kind: "shelf", label: "Mural", dialogue: "projects-all" },
    ],
    "Cada troféu é um projeto, com links pros repositórios.",
  ),
  shop: buildInterior(
    "shop",
    "Loja — Contato",
    [
      { x: 6, y: 3, kind: "counter", label: "Balcão", dialogue: "contact-form" },
      { x: 6, y: 2, kind: "npc-clerk", label: "Atendente", dialogue: "contact-intro" },
      { x: 2, y: 6, kind: "shelf", label: "Prateleira", dialogue: "contact-links" },
      { x: 10, y: 6, kind: "plant", label: "Planta", dialogue: "flavor-plant" },
      { x: 10, y: 3, kind: "console", label: "Terminal", dialogue: "contact-city" },
    ],
    "Fale com a atendente para enviar uma mensagem de verdade.",
  ),
};

export const SOLID_TILES = new Set(["T", "w", "B", "W", "V"]);

export const BADGES: { scene: SceneId; name: string }[] = [
  { scene: "home", name: "Insígnia da Casa" },
  { scene: "lab", name: "Insígnia do Lab" },
  { scene: "arena", name: "Insígnia da Arena" },
  { scene: "shop", name: "Insígnia da Loja" },
];
