import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { updateMyProfile } from "@/lib/dmm/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

export const Route = createFileRoute("/registar")({ component: Register });

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await authClient.signUp.email({ email, password, name, callbackURL: "/dashboard" });
    if (error) {
      setBusy(false);
      setMsg(error.message || "Não foi possível criar a conta.");
      return;
    }
    try {
      await updateMyProfile({ data: { name, phone, city: "Benguela" } });
    } catch {
      /* profile can be completed later */
    }
    setBusy(false);
    void navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1180px] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-cream p-7 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold tracking-[0.18em] text-wait">CRIAR CONTA</p>
        <h1 className="mt-2 font-display text-3xl">Comece o seu pedido</h1>
        <form onSubmit={go} className="mt-6 space-y-3">
          <Field label="Nome completo">
            <Input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="WhatsApp">
            <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="923..." />
          </Field>
          <Field label="Senha (mín. 8 caracteres)">
            <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "A criar…" : "Criar conta"}
          </Button>
          {msg && <p className="rounded-[12px] bg-wait/10 px-3 py-2 text-sm text-wait">{msg}</p>}
        </form>
        <p className="mt-6 text-sm text-fog">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-ink">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
