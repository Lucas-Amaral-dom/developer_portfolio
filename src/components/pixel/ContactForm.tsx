import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PixelButton } from "./PixelButton";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.includes("@") || message.trim().length < 3) {
      toast.error("Preencha nome, e-mail válido e uma mensagem.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Não deu para enviar agora. Tente novamente.");
      return;
    }
    setSent(true);
    toast.success("Mensagem enviada!");
  }

  if (sent) {
    return (
      <p className="pixel-font text-primary text-[10px]">
        Recado entregue! Obrigado por passar na loja.
      </p>
    );
  }

  const field =
    "pixel-frame-sm bg-input/40 w-full px-3 py-2 text-sm outline-none focus:bg-input/70";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="pixel-font text-muted-foreground mb-1 block text-[9px]">Nome</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </label>
        <label className="block">
          <span className="pixel-font text-muted-foreground mb-1 block text-[9px]">E-mail</span>
          <input
            className={field}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
          />
        </label>
      </div>
      <label className="block">
        <span className="pixel-font text-muted-foreground mb-1 block text-[9px]">Mensagem</span>
        <textarea
          className={field}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
        />
      </label>
      <PixelButton type="submit" disabled={sending}>
        {sending ? "Enviando..." : "Enviar recado"}
      </PixelButton>
    </form>
  );
}
