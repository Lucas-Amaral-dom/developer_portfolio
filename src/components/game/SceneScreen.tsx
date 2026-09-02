import type { PortfolioData, SkillRow } from "@/lib/portfolio-content";
import type { SceneId } from "@/game/world";
import { PixelButton } from "@/components/pixel/PixelButton";
import { ContactForm } from "@/components/pixel/ContactForm";

const stars = (level: number) =>
  "★".repeat(Math.max(0, Math.min(5, level))).padEnd(5, "☆");

const safeUrl = (v: string | null | undefined) =>
  v && /^https?:\/\//i.test(v) ? v : null;

const TITLES: Record<Exclude<SceneId, "city">, string> = {
  home: "Sobre mim",
  lab: "Habilidades",
  arena: "Projetos",
  shop: "Contato",
};

export function SceneScreen({
  scene,
  data,
  onClose,
}: {
  scene: Exclude<SceneId, "city">;
  data: PortfolioData;
  onClose: () => void;
}) {
  const c = data.content;
  const t = (k: string) => c[k] ?? "";

  return (
    <div className="bg-background/85 absolute inset-0 z-40 flex items-start justify-center overflow-y-auto p-3 backdrop-blur-sm">
      <div className="bg-card text-card-foreground pixel-frame w-full max-w-2xl space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="pixel-font text-primary text-[11px]">{TITLES[scene]}</h2>
          <PixelButton variant="ghost" onClick={onClose}>
            ✕ Fechar
          </PixelButton>
        </div>

        {scene === "home" && <AboutSection data={data} t={t} />}
        {scene === "lab" && <SkillsSection data={data} t={t} />}
        {scene === "arena" && <ProjectsSection data={data} t={t} />}
        {scene === "shop" && <ContactSection t={t} />}

        <p className="pixel-font text-muted-foreground text-[8px]">
          Feche esta tela para continuar explorando o cenário.
        </p>
      </div>
    </div>
  );
}

type T = (k: string) => string;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="pixel-font text-secondary text-[9px] uppercase">{title}</h3>
      <div className="text-sm leading-relaxed whitespace-pre-line">{children}</div>
    </section>
  );
}

function AboutSection({ data, t }: { data: PortfolioData; t: T }) {
  const photo = safeUrl(t("photoUrl"));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        {photo && (
          <img
            src={photo}
            alt={`Foto de ${t("playerName") || "perfil"}`}
            loading="lazy"
            className="pixel-frame-sm h-24 w-24 object-cover"
          />
        )}
        <div>
          <p className="pixel-font text-[11px]">{t("playerName") || "Portfólio"}</p>
          <p className="text-muted-foreground text-sm">{t("tagline")}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        {[
          ["Classe", t("homeClass")],
          ["Origem", t("homeOrigin")],
          ["Foco", t("homeFocus")],
          ["Modo", t("homeMode")],
        ].map(([k, v]) => (
          <div key={k} className="pixel-frame-sm px-3 py-2">
            <dt className="pixel-font text-muted-foreground text-[8px] uppercase">{k}</dt>
            <dd className="mt-1">{v || "-"}</dd>
          </div>
        ))}
      </dl>
      {t("aboutIntro") && <Block title="Apresentação">{t("aboutIntro")}</Block>}
      {t("aboutStory") && <Block title="Trajetória">{t("aboutStory")}</Block>}
      {t("aboutSeeking") && <Block title="O que busco">{t("aboutSeeking")}</Block>}
      {t("aboutHobby") && <Block title="Fora do código">{t("aboutHobby")}</Block>}
      <Block title="Resumo rápido">
        {data.skills.length} habilidades cadastradas · {data.projects.length} projetos.
      </Block>
    </div>
  );
}

function SkillsSection({ data, t }: { data: PortfolioData; t: T }) {
  const groups = data.skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    (acc[s.group_key] ??= []).push(s);
    return acc;
  }, {});
  const entries = Object.entries(groups);

  return (
    <div className="space-y-5">
      {t("skillsIntro") && <Block title="Visão geral">{t("skillsIntro")}</Block>}
      {entries.length === 0 && <p className="text-sm">Nenhuma habilidade cadastrada ainda.</p>}
      {entries.map(([group, list]) => (
        <section key={group} className="space-y-2">
          <h3 className="pixel-font text-secondary text-[9px] uppercase">{group}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map((s) => (
              <li key={s.id} className="pixel-frame-sm px-3 py-2">
                <p className="pixel-font text-[9px]">{s.title}</p>
                <p className="text-secondary text-xs">{stars(s.level)}</p>
                <p className="text-muted-foreground mt-1 text-xs">{s.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ProjectsSection({ data, t }: { data: PortfolioData; t: T }) {
  return (
    <div className="space-y-5">
      {t("projectsIntro") && <Block title="Sobre os projetos">{t("projectsIntro")}</Block>}
      {data.projects.length === 0 && <p className="text-sm">Nenhum projeto cadastrado ainda.</p>}
      <ul className="space-y-3">
        {data.projects.map((p) => {
          const links = [
            ["Repo front-end", safeUrl(p.front_url)],
            ["Repo back-end", safeUrl(p.back_url)],
            ["Ver demo", safeUrl(p.demo_url)],
          ].filter(([, href]) => href) as [string, string][];
          return (
            <li key={p.id} className="pixel-frame-sm space-y-2 px-3 py-3">
              <p className="pixel-font text-[10px]">{p.title}</p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{p.description}</p>
              {p.tags.length > 0 && (
                <p className="pixel-font text-muted-foreground text-[8px] uppercase">
                  {p.tags.join(" · ")}
                </p>
              )}
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {links.map(([labelText, href]) => (
                    <a
                      key={labelText}
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="pixel-font pixel-press bg-secondary text-secondary-foreground px-2 py-1 text-[8px] uppercase"
                    >
                      {labelText}
                    </a>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContactSection({ t }: { t: T }) {
  const email = t("contactEmail");
  const links = [
    ...(email.includes("@") ? [["E-mail", `mailto:${email}`] as [string, string]] : []),
    ...(safeUrl(t("contactLinkedin"))
      ? [["LinkedIn", safeUrl(t("contactLinkedin"))!] as [string, string]]
      : []),
    ...(safeUrl(t("contactGithub"))
      ? [["GitHub", safeUrl(t("contactGithub"))!] as [string, string]]
      : []),
  ];

  return (
    <div className="space-y-5">
      {t("contactIntro") && <Block title="Vamos conversar">{t("contactIntro")}</Block>}
      {t("contactCity") && <Block title="Base">{t("contactCity")}</Block>}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map(([labelText, href]) => (
            <a
              key={labelText}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="pixel-font pixel-press bg-secondary text-secondary-foreground px-3 py-2 text-[9px] uppercase"
            >
              {labelText}
            </a>
          ))}
        </div>
      )}
      <div className="pixel-frame-sm p-3">
        <ContactForm />
      </div>
    </div>
  );
}
