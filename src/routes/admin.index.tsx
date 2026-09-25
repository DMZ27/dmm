import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { adminStats, sendQuote, updateOrderStatus, type OrderListRow } from "@/lib/dmm/server";
import { ORDER_STATUSES, STATUS_META } from "@/lib/dmm/status";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { orderCode } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({ component: Admin });

function Admin() {
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null);
  const [err, setErr] = useState("");
  const [quote, setQuote] = useState<Record<string, { price: string; deadline: string }>>({});
  const [busy, setBusy] = useState("");

  function load() {
    adminStats()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }

  useEffect(() => {
    if (!isPending && user) load();
  }, [isPending, user]);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (err === "FORBIDDEN") {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-16">
        <h1 className="font-display text-3xl">Acesso reservado</h1>
        <p className="mt-2 text-fog">Este painel é só para a equipa DMM.</p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Voltar à área do cliente</Link>
        </Button>
      </div>
    );
  }
  if (err) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-16">
        <p className="text-bad">{err}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
        <Skeleton className="h-40" />
      </div>
    );
  }

  async function status(id: string, next: string) {
    setBusy(id);
    await updateOrderStatus({ data: { orderId: id, status: next } });
    setBusy("");
    load();
  }

  async function quoteSend(id: string) {
    const q = quote[id];
    if (!q?.price || !q.deadline) return;
    setBusy(id);
    try {
      await sendQuote({ data: { orderId: id, price: Number(q.price), deadline: q.deadline } });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Orçamento inválido.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
      <p className="text-xs font-semibold tracking-[0.18em] text-wait">ADMINISTRAÇÃO</p>
      <h1 className="mt-2 font-display text-4xl">Central DMM</h1>
      <p className="mt-2 text-fog">Pedidos, orçamentos e entrega — Benguela.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Pedidos", data.counts.orders],
          ["Clientes", data.counts.clients],
          ["Em curso", data.counts.production],
          ["Concluídos", data.counts.completed],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-[20px] bg-cream p-5">
            <p className="text-xs font-semibold tracking-wide text-fog">{k}</p>
            <p className="mt-2 font-display text-3xl tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {data.orders.length === 0 && (
          <div className="rounded-[24px] bg-cream p-8">
            <p className="font-display text-2xl">Sem pedidos ainda</p>
            <p className="mt-2 text-sm text-fog">Quando um cliente enviar um briefing, aparece aqui.</p>
          </div>
        )}
        {data.orders.map((o: OrderListRow) => (
          <article key={o.id} className="rounded-[24px] bg-cream p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {orderCode(o.code)} — {o.title}
                </p>
                <p className="text-sm text-fog">
                  {o.client_name} · {o.service_name}
                </p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              <NativeSelect value={o.status} onChange={(e) => void status(o.id, e.target.value)} disabled={busy === o.id}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </NativeSelect>
              <Input
                type="number"
                min={1}
                placeholder="Preço em Kz"
                value={quote[o.id]?.price ?? ""}
                onChange={(e) => setQuote({ ...quote, [o.id]: { ...(quote[o.id] ?? { deadline: "" }), price: e.target.value } })}
              />
              <Input
                type="date"
                value={quote[o.id]?.deadline ?? ""}
                onChange={(e) => setQuote({ ...quote, [o.id]: { ...(quote[o.id] ?? { price: "" }), deadline: e.target.value } })}
              />
              <Button disabled={busy === o.id} onClick={() => void quoteSend(o.id)}>
                Enviar orçamento
              </Button>
            </div>
            <Link to="/admin/$orderId" params={{ orderId: o.id }} className="mt-3 inline-flex h-11 items-center text-sm font-semibold">
              Abrir pedido
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
