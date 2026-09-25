import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, updateMyProfile } from "@/lib/dmm/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/conta")({ component: Conta });

function Conta() {
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Benguela");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending || !user) return;
    getMyProfile()
      .then((p) => {
        setName(p.name);
        setPhone(p.phone ?? "");
        setCity(p.city ?? "Benguela");
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [isPending, user]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function save(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await updateMyProfile({ data: { name, phone, city } });
      setMsg("Dados actualizados.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Não foi possível guardar.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <p className="text-xs font-semibold tracking-[0.18em] text-wait">CONTA</p>
      <h1 className="mt-2 font-display text-4xl">Os seus dados</h1>
      <p className="mt-2 text-sm text-fog">Usados nos pedidos e no contacto com a DMM. Não partilhamos com terceiros.</p>
      {!ready ? (
        <Skeleton className="mt-6 h-64" />
      ) : (
        <form onSubmit={save} className="mt-6 space-y-4 rounded-[28px] bg-cream p-6">
          <Field label="Nome">
            <Input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Localidade">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Button type="submit">Guardar</Button>
          {msg && <p className="text-sm text-fog">{msg}</p>}
        </form>
      )}
      <Link to="/dashboard" className="mt-6 inline-flex h-11 items-center text-sm font-semibold">
        Voltar aos pedidos
      </Link>
    </div>
  );
}
