import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isPending && user) {
    return <Navigate to="/dashboard" />;
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await authClient.signIn.email({ email, password, callbackURL: "/dashboard" });
    setBusy(false);
    if (error) setMsg(error.message || "Email ou senha incorrectos.");
    else void navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1180px] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-cream p-7 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold tracking-[0.18em] text-wait">DMM</p>
        <h1 className="mt-2 font-display text-3xl">Entrar na central</h1>
        <p className="mt-2 text-sm text-fog">Acompanhe pedidos, orçamentos e entregas.</p>
        {authEnabled ? (
          <form onSubmit={onEmail} className="mt-6 space-y-3">
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Senha">
              <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <div className="flex justify-end">
              <Link to="/esqueci-senha" className="text-sm font-semibold text-brass hover:underline">
                Esqueci a senha
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "A entrar…" : "Entrar"}
            </Button>
            {msg && <p className="rounded-[12px] bg-wait/10 px-3 py-2 text-sm text-wait">{msg}</p>}
          </form>
        ) : (
          <p className="mt-6 text-sm text-fog">A autenticação está desligada neste ambiente.</p>
        )}
        <p className="mt-6 text-sm text-fog">
          Ainda não tem conta?{" "}
          <Link to="/registar" className="font-semibold text-ink">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}