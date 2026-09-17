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
    sprite: "lab",
    x: 11,
    y: 4,
    w: 5,
    h: 4,
    door: { x: 13, y: 8 },
    to: "lab",
    sign: "LAB SENAI — Skills",
  },
  {
    sprite: "shop",
    x: 21,
    y: 4,
    w: 5,
    h: 4,
    door: { x: 23, y: 8 },
    to: "shop",
    sign: "LOJA — Contato",
  },
  {
    sprite: "home",
    x: 4,
    y: 13,
    w: 5,
    h: 4,
    door: { x: 6, y: 17 },
    to: "home",
    sign: "CASA — Sobre mim",
  },
  {
    sprite: "arena",
    x: 20,
    y: 13,
    w: 5,
    h: 4,
    door: { x: 22, y: 17 },
    to: "arena",
    sign: "ARENA — Projetos",
  },
];

function buildCity(): SceneDef {
  const g = makeGrid(CITY_W, CITY_H, "g");

  // GBA-style cliff border on top and left, like the reference town
  fillRect(g, 0, 0, CITY_W, 2, "R");
  fillRect(g, 0, 0, 2, CITY_H, "R");
  // decorative gate openings
  set(g, 14, 1, "g");
  set(g, 15, 1, "g");
  set(g, 1, 12, "g");
  set(g, 1, 13, "g");

  // pond with rock border in the top-left
  fillRect(g, 2, 3, 8, 6, "s"); // sand shore
  fillRect(g, 3, 4, 6, 4, "w"); // water
  // rock rim around the pond (only where it does not touch the cliff)
  for (const [x, y] of [
    [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3],
    [9, 3], [9, 4], [9, 5], [9, 6], [9, 7], [9, 8],
    [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8],
    [2, 4], [2, 5], [2, 6], [2, 7],
  ] as const) {
    if (g[y]![x] === "s") set(g, x, y, "R");
  }

  // sand plaza connecting buildings and the pond
  fillRect(g, 2, 7, 26, 2, "s");
  fillRect(g, 2, 11, 26, 2, "s");
  fillRect(g, 2, 15, 26, 2, "s");
  // vertical paths from doors to plazas
  fillRect(g, 13, 7, 1, 10, "s");
  fillRect(g, 23, 7, 1, 10, "s");
  fillRect(g, 5, 17, 1, 2, "s");
  fillRect(g, 21, 17, 1, 2, "s");
  // dirt shortcuts through grass
  fillRect(g, 8, 9, 1, 4, "p");
  fillRect(g, 18, 9, 1, 4, "p");

  // tall grass patches at the wild edges
  fillRect(g, 26, 3, 3, 3, "t");
  fillRect(g, 26, 15, 3, 3, "t");
  fillRect(g, 20, 19, 8, 2, "t");
  fillRect(g, 3, 19, 8, 2, "t");

  // flower gardens
  fillRect(g, 16, 3, 3, 2, "f");
  fillRect(g, 6, 3, 3, 2, "f");
  fillRect(g, 17, 13, 2, 2, "f");

  // trees
  for (const [x, y] of [
    [4, 11], [8, 11], [10, 7], [18, 7], [27, 7], [28, 11],
    [28, 16], [3, 16], [11, 15], [25, 15], [10, 19], [19, 19],
    [23, 13], [26, 8], [7, 8],
  ] as const) {
    set(g, x, y, "T");
  }

  // lamp posts along the plazas
  for (const [x, y] of [
    [11, 9], [19, 9], [7, 13], [25, 13], [15, 15], [6, 18], [24, 18],
  ] as const) {
    set(g, x, y, "L");
  }

  // building footprints block movement; door tiles are passable shadows
  for (const b of CITY_BUILDINGS) {
    fillRect(g, b.x, b.y, b.w, b.h, "B");
    set(g, b.door.x, b.door.y, "D");
  }

  return {
    id: "city",
    title: "Cidade Dev",
    grid: toRows(g),
    spawn: { x: 15, y: 13 },
    indoor: false,
    hint: "Setas / WASD para andar. Chegue perto de uma porta para abri-la e caminhe sobre a sombra para entrar.",
    buildings: CITY_BUILDINGS,
    interactables: [
      { x: 15, y: 11, kind: "sign", label: "Placa da cidade", dialogue: "city-sign" },
      { x: 10, y: 13, kind: "npc", npc: 1, face: "down", label: "Guia", dialogue: "city-guide" },
      { x: 4, y: 10, kind: "npc", npc: 2, face: "right", label: "Garoto do lago", dialogue: "city-kid" },
      { x: 24, y: 10, kind: "npc", npc: 3, face: "left", label: "Moça do lago", dialogue: "city-lake" },
      { x: 8, y: 18, kind: "npc", npc: 4, face: "up", label: "Senhor da praça", dialogue: "city-oldman" },
      { x: 22, y: 18, kind: "npc", npc: 5, face: "up", label: "Treinador", dialogue: "city-playground" },
      { x: 15, y: 16, kind: "fountain", label: "Fonte", dialogue: "city-fountain" },
      { x: 13, y: 5, kind: "bench", label: "Banco", dialogue: "city-bench" },
      { x: 23, y: 5, kind: "bench", label: "Banco", dialogue: "city-bench" },
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

export const SOLID_TILES = new Set(["T", "w", "B", "W", "V", "h", "R"]);
export const DOOR_TILES = new Set(["D"]);

export const BADGES: { scene: SceneId; name: string }[] = [
  { scene: "home", name: "Insígnia da Casa" },
  { scene: "lab", name: "Insígnia do Lab" },
  { scene: "arena", name: "Insígnia da Arena" },
  { scene: "shop", name: "Insígnia da Loja" },
];
