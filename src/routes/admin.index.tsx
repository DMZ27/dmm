import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { adminResetClientPassword, adminStats, sendQuote, updateOrderStatus, type OrderListRow } from "@/lib/dmm/server";
import { aiAdminPrioritize } from "@/lib/dmm/ai";
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
  const [resetEmail, setResetEmail] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");

  function load() {
    adminStats()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }

  async function runAiSummary() {
    setAiBusy(true);
    setAiErr("");
    try {
      const res = await aiAdminPrioritize();
      setAiSummary(res.reply);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Erro na IA");
    } finally {
      setAiBusy(false);
    }
  }

  useEffect(() => {
    if (!isPending && user) load();
  }, [isPending, user]);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 py-10">
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (err === "FORBIDDEN") {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Acesso reservado</h1>
        <p className="mt-2 text-fog">Este painel é só para a equipa DMM.</p>
        <Button asChild className="mt-6 h-11 rounded-full">
          <Link to="/dashboard">Voltar à área do cliente</Link>
        </Button>
      </div>
    );
  }
  if (err) {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16">
        <p className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{err}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 py-10">
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  async function status(id: string, next: string) {
    setBusy(id);
    try {
      await updateOrderStatus({ data: { orderId: id, status: next } });
      load();
    } finally {
      setBusy("");
    }
  }

  async function quoteSend(id: string) {
    const q = quote[id];
    if (!q?.price || !q?.deadline) return;
    setBusy(id);
    try {
      await sendQuote({
        data: {
          orderId: id,
          price: Number(q.price),
          deadline: q.deadline,
        },
      });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar orçamento");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="min-h-[70vh] bg-[#f6f7fb]">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brass">Equipa DMM</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Painel admin</h1>
            <p className="mt-1 text-sm text-fog">Pedidos, orçamentos e recuperação de acesso.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="cream" className="h-11 rounded-full">
              <Link to="/admin/conteudo">Conteúdo / Blog</Link>
            </Button>
            <Button asChild variant="cream" className="h-11 rounded-full">
              <Link to="/dashboard">Área do cliente</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(
            [
              ["Pedidos", data.counts.orders],
              ["Clientes", data.counts.clients],
              ["Em curso", data.counts.production],
              ["Concluídos", data.counts.completed],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-fog">{k}</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums">{v}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-bold">Recuperar acesso de cliente</h2>
          <p className="mt-1 text-sm text-fog">
            Defina uma senha temporária e envie-a ao cliente pelo WhatsApp.
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setResetBusy(true);
              setResetMsg("");
              void adminResetClientPassword({ data: { email: resetEmail, newPassword: resetPass } })
                .then(() => {
                  setResetMsg(`Senha actualizada para ${resetEmail}. Envie-a pelo WhatsApp.`);
                  setResetPass("");
                })
                .catch((e) => setResetMsg(e instanceof Error ? e.message : "Erro"))
                .finally(() => setResetBusy(false));
            }}
          >
            <div>
              <label className="text-xs font-semibold text-fog">Email da conta</label>
              <Input
                type="email"
                required
                className="mt-1"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">Nova senha (mín. 8)</label>
              <Input
                type="text"
                required
                minLength={8}
                className="mt-1"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
                placeholder="senha-temporaria"
              />
            </div>
            <Button type="submit" disabled={resetBusy} className="h-11 rounded-full">
              {resetBusy ? "A guardar…" : "Definir senha"}
            </Button>
          </form>
          {resetMsg && <p className="mt-3 text-sm text-fog">{resetMsg}</p>}
        </section>


        <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Assistente do admin</h2>
              <p className="mt-1 text-sm text-fog">Resumo e priorização dos pedidos abertos.</p>
            </div>
            <Button
              type="button"
              className="h-10 rounded-full"
              disabled={aiBusy}
              onClick={() => void runAiSummary()}
            >
              {aiBusy ? "A analisar…" : "Gerar resumo IA"}
            </Button>
          </div>
          {aiErr && <p className="mt-3 text-sm text-bad">{aiErr}</p>}
          {aiSummary && (
            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f4f5f8] px-4 py-3 text-sm leading-relaxed text-ink">
              {aiSummary}
            </div>
          )}
        </section>

        <div className="mt-8">
          <h2 className="font-display text-xl font-bold">Pedidos recentes</h2>
          <p className="mt-1 text-sm text-fog">Altere o estado ou envie orçamento directamente.</p>

          {data.orders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
              <p className="font-display text-xl font-bold">Sem pedidos ainda</p>
              <p className="mt-1 text-sm text-fog">Quando um cliente enviar um briefing, aparece aqui.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.orders.map((o: OrderListRow) => (
                <li key={o.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-fog">{orderCode(o.code)}</p>
                      <p className="mt-0.5 font-semibold text-ink">{o.title}</p>
                      <p className="mt-0.5 text-sm text-fog">
                        {o.client_name} · {o.service_name}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="text-[11px] font-semibold text-fog">Estado</label>
                      <NativeSelect
                        className="mt-1"
                        value={o.status}
                        onChange={(e) => void status(o.id, e.target.value)}
                        disabled={busy === o.id}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-fog">Preço (Kz)</label>
                      <Input
                        className="mt-1"
                        type="number"
                        min={1}
                        placeholder="Ex: 25000"
                        value={quote[o.id]?.price ?? ""}
                        onChange={(e) =>
                          setQuote({
                            ...quote,
                            [o.id]: { ...(quote[o.id] ?? { deadline: "" }), price: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-fog">Prazo</label>
                      <Input
                        className="mt-1"
                        type="date"
                        value={quote[o.id]?.deadline ?? ""}
                        onChange={(e) =>
                          setQuote({
                            ...quote,
                            [o.id]: { ...(quote[o.id] ?? { price: "" }), deadline: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        className="h-11 w-full rounded-full"
                        disabled={busy === o.id}
                        onClick={() => void quoteSend(o.id)}
                      >
                        Enviar orçamento
                      </Button>
                    </div>
                  </div>

                  <Link
                    to="/admin/$orderId"
                    params={{ orderId: o.id }}
                    className="mt-3 inline-flex text-sm font-semibold text-brass hover:underline"
                  >
                    Abrir detalhes do pedido →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
