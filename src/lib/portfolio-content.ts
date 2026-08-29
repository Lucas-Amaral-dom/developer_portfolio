import { supabase } from "@/integrations/supabase/client";

export interface SkillRow {
  id: string;
  group_key: string;
  title: string;
  description: string;
  level: number;
  sort_order: number;
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string;
  tags: string[];
  front_url: string | null;
  back_url: string | null;
  demo_url: string | null;
  sort_order: number;
}

export interface PortfolioData {
  content: Record<string, string>;
  skills: SkillRow[];
  projects: ProjectRow[];
}

export const CONTENT_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "playerName", label: "Seu nome" },
  { key: "tagline", label: "Linha de apresentação" },
  { key: "heroSub", label: "Subtítulo da tela de título" },
  { key: "homeClass", label: "Classe" },
  { key: "homeOrigin", label: "Origem" },
  { key: "homeFocus", label: "Foco" },
  { key: "homeMode", label: "Modo" },
  { key: "aboutIntro", label: "Sobre — apresentação", multiline: true },
  { key: "aboutStory", label: "Sobre — trajetória", multiline: true },
  { key: "aboutSeeking", label: "Sobre — o que busco", multiline: true },
  { key: "aboutHobby", label: "Sobre — fora do código", multiline: true },
  { key: "skillsIntro", label: "Intro das skills", multiline: true },
  { key: "projectsIntro", label: "Intro dos projetos", multiline: true },
  { key: "contactIntro", label: "Intro do contato", multiline: true },
  { key: "contactEmail", label: "E-mail" },
  { key: "contactLinkedin", label: "LinkedIn (URL)" },
  { key: "contactGithub", label: "GitHub (URL)" },
  { key: "contactCity", label: "Cidade" },
];

export const portfolioQuery = {
  queryKey: ["portfolio"] as const,
  queryFn: async (): Promise<PortfolioData> => {
    const [contentRes, skillsRes, projectsRes] = await Promise.all([
      supabase.from("site_content").select("key,value"),
      supabase.from("skills").select("*").order("sort_order"),
      supabase.from("projects").select("*").order("sort_order"),
    ]);

    if (contentRes.error) throw contentRes.error;
    if (skillsRes.error) throw skillsRes.error;
    if (projectsRes.error) throw projectsRes.error;

    const content: Record<string, string> = {};
    for (const row of contentRes.data ?? []) content[row.key] = row.value;

    return {
      content,
      skills: (skillsRes.data ?? []) as SkillRow[],
      projects: (projectsRes.data ?? []) as ProjectRow[],
    };
  },
};

/* ── dialogue ─────────────────────────────────────────────────────────────── */

export interface DialogueLink {
  label: string;
  href: string;
}

export interface DialoguePage {
  text: string;
  links?: DialogueLink[];
}

export interface Dialogue {
  speaker: string;
  pages: DialoguePage[];
  /** opens the contact form instead of plain pages */
  form?: boolean;
}

function stars(level: number) {
  return "★".repeat(Math.max(0, Math.min(5, level))).padEnd(5, "☆");
}

function safeUrl(value: string | null | undefined) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

export function buildDialogues(data: PortfolioData): Record<string, Dialogue> {
  const c = data.content;
  const name = c.playerName || "Lucas";
  const out: Record<string, Dialogue> = {};

  out["city-sign"] = {
    speaker: "Placa",
    pages: [
      { text: `CIDADE DEV — portfólio de ${name}.` },
      { text: c.tagline || "" },
      {
        text: "Casa = sobre mim · Lab = skills · Arena = projetos · Loja = contato.",
      },
    ],
  };
  out["city-guide"] = {
    speaker: "Guia",
    pages: [
      { text: `Bem-vindo! Eu cuido da cidade do ${name}.` },
      { text: "Ande até a porta de um prédio e aperte A para entrar." },
      { text: "Visite as 4 construções para juntar todas as insígnias." },
    ],
  };

  out["about-intro"] = {
    speaker: name,
    pages: [{ text: c.aboutIntro || "" }, { text: c.aboutStory || "" }],
  };
  out["about-story"] = {
    speaker: "Escrivaninha",
    pages: [{ text: c.aboutStory || "" }],
  };
  out["about-seeking"] = {
    speaker: "Console",
    pages: [{ text: c.aboutSeeking || "" }],
  };
  out["about-hobby"] = { speaker: "Cama", pages: [{ text: c.aboutHobby || "" }] };
  out["about-card"] = {
    speaker: "Quadro",
    pages: [
      { text: `CLASSE: ${c.homeClass || "-"}` },
      { text: `ORIGEM: ${c.homeOrigin || "-"}` },
      { text: `FOCO: ${c.homeFocus || "-"}` },
      { text: `MODO: ${c.homeMode || "-"}` },
    ],
  };
  out["flavor-plant"] = {
    speaker: "Planta",
    pages: [{ text: "É só uma planta. Mas está bem cuidada." }],
  };

  out["skills-intro"] = {
    speaker: "Instrutor",
    pages: [
      { text: c.skillsIntro || "" },
      { text: "Cada bancada mostra um grupo de competências. Dê uma olhada!" },
    ],
  };
  out["skills-list"] = {
    speaker: "Estante",
    pages: data.skills.map((s) => ({
      text: `${s.title} ${stars(s.level)}`,
    })),
  };
  const groups: Record<string, string> = {
    base: "skill-base",
    web: "skill-web",
    data: "skill-data",
    quality: "skill-quality",
  };
  for (const [groupKey, dialogueId] of Object.entries(groups)) {
    const list = data.skills.filter((s) => s.group_key === groupKey);
    out[dialogueId] = {
      speaker: list[0]?.title || "Bancada",
      pages: list.length
        ? list.flatMap((s) => [
            { text: `${s.title} — nível ${stars(s.level)}` },
            { text: s.description },
          ])
        : [{ text: "Bancada vazia. Adicione competências no painel de edição." }],
    };
  }

  out["projects-intro"] = {
    speaker: "Juíza",
    pages: [
      { text: c.projectsIntro || "" },
      { text: "Toque em cada troféu para ver o projeto e os repositórios." },
    ],
  };
  out["projects-all"] = {
    speaker: "Mural",
    pages: data.projects.map((p) => ({ text: `${p.title} — ${p.tags.join(", ")}` })),
  };
  data.projects.forEach((p, i) => {
    const links: DialogueLink[] = [];
    const front = safeUrl(p.front_url);
    const back = safeUrl(p.back_url);
    const demo = safeUrl(p.demo_url);
    if (front) links.push({ label: "Repo front-end", href: front });
    if (back) links.push({ label: "Repo back-end", href: back });
    if (demo) links.push({ label: "Ver demo", href: demo });
    out[`project-${i}`] = {
      speaker: p.title,
      pages: [
        { text: p.description },
        { text: `TAGS: ${p.tags.join(" · ") || "-"}`, links },
      ],
    };
  });
  // troféus sem projeto correspondente
  for (let i = data.projects.length; i < 6; i++) {
    out[`project-${i}`] = {
      speaker: "Pedestal vazio",
      pages: [{ text: "Nenhum projeto aqui ainda. Em breve!" }],
    };
  }

  out["contact-intro"] = {
    speaker: "Atendente",
    pages: [
      { text: c.contactIntro || "" },
      { text: "Fale com o balcão para me mandar uma mensagem." },
    ],
  };
  const contactLinks: DialogueLink[] = [];
  if (c.contactEmail?.includes("@"))
    contactLinks.push({ label: c.contactEmail, href: `mailto:${c.contactEmail}` });
  const li = safeUrl(c.contactLinkedin);
  if (li) contactLinks.push({ label: "LinkedIn", href: li });
  const gh = safeUrl(c.contactGithub);
  if (gh) contactLinks.push({ label: "GitHub", href: gh });
  out["contact-links"] = {
    speaker: "Prateleira",
    pages: [{ text: "Meus canais:", links: contactLinks }],
  };
  out["contact-city"] = {
    speaker: "Terminal",
    pages: [
      { text: `Base de operações: ${c.contactCity || "-"}` },
      { text: "Aberto a trabalho remoto ou presencial." },
    ],
  };
  out["contact-form"] = {
    speaker: "Balcão",
    form: true,
    pages: [{ text: "Deixe seu recado e eu respondo assim que possível." }],
  };

  return out;
}
