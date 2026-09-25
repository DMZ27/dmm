import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileDown, Send } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  attachFile,
  getFileData,
  getOrder,
  postMessage,
  updateOrderStatus,
  type FileRow,
  type MessageRow,
  type OrderPayload,
} from "@/lib/dmm/server";
import { ORDER_STATUSES, STATUS_META } from "@/lib/dmm/status";
import { downloadBase64, packFiles } from "@/lib/dmm/files-client";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKz, orderCode } from "@/lib/utils";

export const Route = createFileRoute("/admin/$orderId")({ component: AdminOrder });

function AdminOrder() {
  const { orderId } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<OrderPayload | null>(null);
  const [err, setErr] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("DELIVERED");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getOrder({ data: orderId })
      .then((d) => {
        setData(d);
        if (d.me.role !== "ADMIN") setErr("FORBIDDEN");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, [orderId]);

  useEffect(() => {
    if (!isPending && user) load();
  }, [isPending, user, load]);

  if (isPending || !data) {
    if (!isPending && !user) return <RedirectToSignIn />;
    if (err) {
      return (
        <div className="mx-auto max-w-[900px] px-4 py-16">
          <p className="text-bad">{err === "FORBIDDEN" ? "Acesso reservado à equipa DMM." : err}</p>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { order, files, messages, quote } = data;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    await postMessage({ data: { orderId, body } });
    setBody("");
    setBusy(false);
    load();
  }

  async function deliver(list: FileList | null) {
    setBusy(true);
    try {
      if (list?.length) {
        const [file] = await packFiles(list);
        await attachFile({ data: { orderId, file, kind: "FINAL" } });
      } else {
        await updateOrderStatus({ data: { orderId, status } });
      }
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha na entrega.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
      <Link to="/admin" className="inline-flex h-11 items-center gap-2 text-sm font-semibold">
        <ArrowLeft size={16} /> Painel
      </Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] bg-cream p-6 md:p-8">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-wait">{orderCode(order.code)}</p>
              <h1 className="mt-1 font-display text-3xl">{order.title}</h1>
              <p className="mt-1 text-sm text-fog">
                {order.client_name} · {order.service_name}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-4 text-sm leading-relaxed">{order.description}</p>
          <h2 className="mt-8 font-display text-xl">Ficheiros</h2>
          <div className="mt-2 space-y-2">
            {files.map((f) => (
              <button
                key={f.id}
                type="button"
                className="flex w-full items-center justify-between rounded-[12px] border border-line bg-paper px-3 py-3 text-left text-sm"
                onClick={async () => {
                  const file = await getFileData({ data: f.id });
                  downloadBase64(file.name, file.mimeType, file.dataBase64);
                }}
              >
                <span>
                  {f.name} <span className="text-xs text-fog">{f.kind}</span>
                </span>
                <FileDown size={15} />
              </button>
            ))}
            {!files.length && <p className="text-sm text-fog">Sem ficheiros.</p>}
          </div>
          <h2 className="mt-8 font-display text-xl">Conversa</h2>
          <div className="mt-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="border-b border-line pb-3">
                <p className="text-xs font-semibold text-fog">
                  {m.author === "ADMIN" ? "DMM" : "Cliente"} · {new Date(m.created_at).toLocaleString("pt-PT")}
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="mt-4 space-y-3">
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Responder ao cliente..." />
            <Button type="submit" disabled={busy}>
              Enviar <Send size={15} />
            </Button>
          </form>
        </div>
        <aside className="space-y-4">
          <div className="rounded-[24px] bg-cream p-5">
            <h2 className="font-display text-xl">Entregar</h2>
            <label className="mt-3 block text-xs font-semibold tracking-wide text-fog">Estado</label>
            <NativeSelect className="mt-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </NativeSelect>
            <label className="mt-4 block text-xs font-semibold tracking-wide text-fog">Ficheiro final</label>
            <input
              className="mt-2 block w-full text-sm"
              type="file"
              onChange={(e) => void deliver(e.target.files)}
            />
            <Button className="mt-4 w-full" disabled={busy} onClick={() => void deliver(null)}>
              Guardar estado
            </Button>
          </div>
          {quote && (
            <div className="rounded-[24px] bg-ink p-5 text-paper">
              <p className="text-xs font-semibold tracking-[0.16em] text-brass">ORÇAMENTO</p>
              <p className="mt-2 font-display text-3xl">{formatKz(quote.price)}</p>
              <p className="mt-2 text-sm text-mist">Prazo {quote.deadline}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
