import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { PixelButton } from "@/components/pixel/PixelButton";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Portfolio Quest de Lucas Amaral" },
      {
        name: "description",
        content:
          "Área restrita do portfólio em pixel art: entre para editar textos, skills, projetos e ler mensagens.",
      },
      { property: "og:title", content: "Entrar — Portfolio Quest" },
      {
        property: "og:description",
        content: "Área restrita para editar o conteúdo do portfólio 2D.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada! Confirme o e-mail se for solicitado.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/admin" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não deu para entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/admin" });
  }

  const field = "pixel-frame-sm bg-input/40 w-full px-3 py-2 text-sm outline-none";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="bg-card text-card-foreground pixel-frame w-full max-w-md p-6">
        <h1 className="pixel-font text-[12px]">
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Área do dono do portfólio: editar textos, skills, projetos e ler mensagens.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="pixel-font text-muted-foreground mb-1 block text-[9px]">E-mail</span>
            <input
              className={field}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="pixel-font text-muted-foreground mb-1 block text-[9px]">Senha</span>
            <input
              className={field}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <PixelButton type="submit" disabled={busy} className="w-full">
            {busy ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </PixelButton>
        </form>

        <PixelButton variant="ghost" onClick={google} className="mt-3 w-full">
          Entrar com Google
        </PixelButton>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="pixel-font text-primary text-[9px] underline"
          >
            {mode === "signin" ? "Criar conta" : "Já tenho conta"}
          </button>
          <Link to="/" className="pixel-font text-[9px] underline">
            ← Voltar ao jogo
          </Link>
        </div>
      </div>
    </main>
  );
}
