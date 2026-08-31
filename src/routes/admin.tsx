import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PixelButton } from "@/components/pixel/PixelButton";
import {
  CONTENT_FIELDS,
  portfolioQuery,
  type ProjectRow,
  type SkillRow,
} from "@/lib/portfolio-content";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do portfólio — editar conteúdo" },
      {
        name: "description",
        content:
          "Painel restrito para atualizar textos, skills, projetos e ler mensagens do portfólio jogável.",
      },
      { property: "og:title", content: "Painel do portfólio" },
      { property: "og:description", content: "Área restrita de edição do portfólio 2D." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const field = "pixel-frame-sm bg-input/40 w-full px-3 py-2 text-sm outline-none";
const label = "pixel-font text-muted-foreground mb-1 block text-[9px]";

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <Shell>Verificando acesso...</Shell>;
  }

  if (!isAdmin) {
    return (
      <Shell>
        <p className="text-sm">
          Sua conta ({session.user.email}) não tem permissão de administrador.
        </p>
        <ClaimAdmin />
      </Shell>
    );
  }

  return <Editor />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="bg-card text-card-foreground pixel-frame w-full max-w-md space-y-4 p-6">
        <h1 className="pixel-font text-[11px]">Painel</h1>
        {children}
        <Link to="/" className="pixel-font block text-[9px] underline">
          ← Voltar ao jogo
        </Link>
      </div>
    </main>
  );
}

function ClaimAdmin() {
  const [busy, setBusy] = useState(false);
  async function claim() {
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) {
      toast.success("Você agora é administrador!");
      window.location.reload();
    } else {
      toast.error("Já existe um administrador neste portfólio.");
    }
  }
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        Se você é o dono e ninguém reivindicou o painel ainda, pode assumir o acesso agora.
      </p>
      <PixelButton onClick={claim} disabled={busy}>
        {busy ? "..." : "Sou o dono"}
      </PixelButton>
      <PixelButton variant="ghost" onClick={() => supabase.auth.signOut()}>
        Sair
      </PixelButton>
    </div>
  );
}

function Editor() {
  const qc = useQueryClient();
  const { data } = useQuery(portfolioQuery);
  const [tab, setTab] = useState<"texts" | "skills" | "projects" | "inbox">("texts");

  if (!data) return <Shell>Carregando conteúdo...</Shell>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["portfolio"] });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="pixel-font text-[12px]">Painel do portfólio</h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="pixel-font pixel-press bg-secondary text-secondary-foreground px-3 py-2 text-[10px] uppercase"
          >
            Ver jogo
          </Link>
          <PixelButton variant="ghost" onClick={() => supabase.auth.signOut()}>
            Sair
          </PixelButton>
        </div>
      </header>

      <nav className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["texts", "Textos"],
            ["skills", "Skills"],
            ["projects", "Projetos"],
            ["inbox", "Mensagens"],
          ] as const
        ).map(([id, name]) => (
          <PixelButton
            key={id}
            variant={tab === id ? "primary" : "ghost"}
            onClick={() => setTab(id)}
          >
            {name}
          </PixelButton>
        ))}
      </nav>

      {tab === "texts" && <TextsTab content={data.content} onSaved={refresh} />}
      {tab === "skills" && <SkillsTab skills={data.skills} onSaved={refresh} />}
      {tab === "projects" && <ProjectsTab projects={data.projects} onSaved={refresh} />}
      {tab === "inbox" && <InboxTab />}
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-card text-card-foreground pixel-frame mb-8 space-y-4 p-5">
      {children}
    </section>
  );
}

function TextsTab({
  content,
  onSaved,
}: {
  content: Record<string, string>;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(content);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const rows = CONTENT_FIELDS.map((f) => ({ key: f.key, value: draft[f.key] ?? "" }));
    const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Textos salvos na nuvem!");
    onSaved();
  }

  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {CONTENT_FIELDS.map((f) => (
          <label key={f.key} className={f.multiline ? "sm:col-span-2" : ""}>
            <span className={label}>{f.label}</span>
            {f.multiline ? (
              <textarea
                className={field}
                rows={3}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            ) : (
              <input
                className={field}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      <PixelButton onClick={save} disabled={busy}>
        {busy ? "Salvando..." : "Salvar textos"}
      </PixelButton>
    </Card>
  );
}

function SkillsTab({ skills, onSaved }: { skills: SkillRow[]; onSaved: () => void }) {
  const [rows, setRows] = useState<SkillRow[]>(skills);
  const [busy, setBusy] = useState(false);

  function update(id: string, patch: Partial<SkillRow>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("skills").upsert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Skills salvas!");
    onSaved();
  }

  async function add() {
    const { data, error } = await supabase
      .from("skills")
      .insert({
        group_key: "outros",
        title: "Nova skill",
        description: "Descreva onde você usa isso.",
        level: 3,
        sort_order: rows.length,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows([...rows, data as SkillRow]);
    onSaved();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows(rows.filter((r) => r.id !== id));
    onSaved();
  }

  return (
    <Card>
      {rows.map((r) => (
        <div key={r.id} className="border-border/40 grid gap-3 border-b-2 pb-4 sm:grid-cols-2">
          <label>
            <span className={label}>Título</span>
            <input
              className={field}
              value={r.title}
              onChange={(e) => update(r.id, { title: e.target.value })}
            />
          </label>
          <label>
            <span className={label}>Grupo</span>
            <input
              className={field}
              value={r.group_key}
              onChange={(e) => update(r.id, { group_key: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Descrição</span>
            <textarea
              className={field}
              rows={2}
              value={r.description}
              onChange={(e) => update(r.id, { description: e.target.value })}
            />
          </label>
          <label>
            <span className={label}>Nível (1-5)</span>
            <input
              className={field}
              type="number"
              min={1}
              max={5}
              value={r.level}
              onChange={(e) => update(r.id, { level: Number(e.target.value) })}
            />
          </label>
          <div className="flex items-end">
            <PixelButton variant="danger" onClick={() => remove(r.id)}>
              Remover
            </PixelButton>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <PixelButton onClick={save} disabled={busy}>
          {busy ? "Salvando..." : "Salvar skills"}
        </PixelButton>
        <PixelButton variant="secondary" onClick={add}>
          + Nova skill
        </PixelButton>
      </div>
    </Card>
  );
}

function ProjectsTab({ projects, onSaved }: { projects: ProjectRow[]; onSaved: () => void }) {
  const [rows, setRows] = useState<ProjectRow[]>(projects);
  const [busy, setBusy] = useState(false);

  function update(id: string, patch: Partial<ProjectRow>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("projects").upsert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Projetos salvos!");
    onSaved();
  }

  async function add() {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        title: "Novo projeto",
        description: "O que ele faz e qual problema resolve.",
        tags: [],
        sort_order: rows.length,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows([...rows, data as ProjectRow]);
    onSaved();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows(rows.filter((r) => r.id !== id));
    onSaved();
  }

  return (
    <Card>
      {rows.map((r) => (
        <div key={r.id} className="border-border/40 grid gap-3 border-b-2 pb-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={label}>Título</span>
            <input
              className={field}
              value={r.title}
              onChange={(e) => update(r.id, { title: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Descrição</span>
            <textarea
              className={field}
              rows={3}
              value={r.description}
              onChange={(e) => update(r.id, { description: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Tags (separadas por vírgula)</span>
            <input
              className={field}
              value={r.tags.join(", ")}
              onChange={(e) =>
                update(r.id, {
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <label>
            <span className={label}>Repositório front</span>
            <input
              className={field}
              value={r.front_url ?? ""}
              onChange={(e) => update(r.id, { front_url: e.target.value || null })}
            />
          </label>
          <label>
            <span className={label}>Repositório back</span>
            <input
              className={field}
              value={r.back_url ?? ""}
              onChange={(e) => update(r.id, { back_url: e.target.value || null })}
            />
          </label>
          <label>
            <span className={label}>Demo / site</span>
            <input
              className={field}
              value={r.demo_url ?? ""}
              onChange={(e) => update(r.id, { demo_url: e.target.value || null })}
            />
          </label>
          <div className="flex items-end">
            <PixelButton variant="danger" onClick={() => remove(r.id)}>
              Remover
            </PixelButton>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <PixelButton onClick={save} disabled={busy}>
          {busy ? "Salvando..." : "Salvar projetos"}
        </PixelButton>
        <PixelButton variant="secondary" onClick={add}>
          + Novo projeto
        </PixelButton>
      </div>
    </Card>
  );
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

function InboxTab() {
  const { data, isPending } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id,name,email,message,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
  });

  if (isPending) return <Card>Carregando mensagens...</Card>;
  if (!data || data.length === 0) return <Card>Nenhuma mensagem ainda.</Card>;

  return (
    <Card>
      {data.map((m) => (
        <article key={m.id} className="border-border/40 border-b-2 pb-3">
          <p className="pixel-font text-[9px]">
            {m.name} · {m.email}
          </p>
          <p className="text-muted-foreground text-[10px]">
            {new Date(m.created_at).toLocaleString("pt-BR")}
          </p>
          <p className="mt-2 text-sm whitespace-pre-line">{m.message}</p>
        </article>
      ))}
    </Card>
  );
}
