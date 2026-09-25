import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileDown, Send, Upload } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  attachFile,
  getFileData,
  getOrder,
  postMessage,
  type FileRow,
  type MessageRow,
  type OrderPayload,
  type QuoteRow,
} from "@/lib/dmm/server";
import { STATUS_META, type OrderStatus } from "@/lib/dmm/status";
import { downloadBase64, packFiles } from "@/lib/dmm/files-client";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKz, orderCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/$orderId")({ component: OrderDetail });

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<OrderPayload | null>(null);
  const [err, setErr] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getOrder({ data: orderId })
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, [orderId]);

  useEffect(() => {
    if (!isPending && user) load();
  }, [isPending, user, load]);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (err) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
        <p className="text-bad">{err}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold">
          Voltar
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { order, files, messages, quote } = data;
  const meta = STATUS_META[order.status as OrderStatus];

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await postMessage({ data: { orderId, body } });
      setBody("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function proof(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    try {
      const [file] = await packFiles(list);
      await attachFile({ data: { orderId, file, kind: "PAYMENT_PROOF" } });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha no comprovativo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
      <Link to="/dashboard" className="inline-flex h-11 items-center gap-2 text-sm font-semibold">
        <ArrowLeft size={16} /> Área do cliente
      </Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] bg-cream p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-wait">{orderCode(order.code)}</p>
              <h1 className="mt-1 font-display text-3xl">{order.title}</h1>
              <p className="mt-1 text-sm text-fog">{order.service_name}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-4 text-sm leading-relaxed">{order.description}</p>
          <p className="mt-2 text-sm text-fog">{meta?.hint}</p>
          <h2 className="mt-8 font-display text-xl">Ficheiros</h2>
          <FileList files={files} />
          <h2 className="mt-8 font-display text-xl">Conversa</h2>
          <div className="mt-3 space-y-3">
            {messages.length === 0 && <p className="text-sm text-fog">Ainda não há mensagens neste pedido.</p>}
            {messages.map((m: MessageRow) => (
              <div key={m.id} className="border-b border-line pb-3">
                <p className="text-xs font-semibold tracking-wide text-fog">
                  {m.author === "ADMIN" ? "DMM" : "Você"} · {new Date(m.created_at).toLocaleString("pt-PT")}
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="mt-4 space-y-3">
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva à DMM..." />
            <Button type="submit" disabled={busy}>
              Enviar <Send size={15} />
            </Button>
          </form>
        </div>
        <aside className="space-y-4">
          {quote && <QuoteCard quote={quote} />}
          <div className="rounded-[24px] bg-cream p-5">
            <h2 className="font-display text-xl">Comprovativo Express</h2>
            <p className="mt-2 text-sm text-fog">
              Após o orçamento, envie o comprovativo da transferência para o 923 078 760.
            </p>
            <label className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-line bg-paper text-sm font-semibold">
              <Upload size={15} /> Carregar comprovativo
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => void proof(e.target.files)} />
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuoteCard({ quote }: { quote: QuoteRow }) {
  return (
    <div className="rounded-[24px] bg-ink p-5 text-paper">
      <p className="text-xs font-semibold tracking-[0.16em] text-brass">ORÇAMENTO</p>
      <p className="mt-2 font-display text-3xl tabular-nums">{formatKz(quote.price)}</p>
      <p className="mt-2 text-sm text-mist">Prazo: {quote.deadline}</p>
      <p className="text-sm text-mist">Revisões: {quote.revisions}</p>
      {quote.note && <p className="mt-3 text-sm">{quote.note}</p>}
    </div>
  );
}

function FileList({ files }: { files: FileRow[] }) {
  const [msg, setMsg] = useState("");
  async function download(id: string) {
    setMsg("");
    try {
      const file = await getFileData({ data: id });
      downloadBase64(file.name, file.mimeType, file.dataBase64);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha no download.");
    }
  }
  if (!files.length) return <p className="mt-2 text-sm text-fog">Nenhum ficheiro ainda.</p>;
  return (
    <div className="mt-2 space-y-2">
      {files.map((f) => (
        <button
          key={f.id}
          type="button"
          className="flex w-full items-center justify-between rounded-[12px] border border-line bg-paper px-3 py-3 text-left text-sm"
          onClick={() => void download(f.id)}
        >
          <span>
            {f.name}
            <span className="ml-2 text-xs text-fog">{f.kind}</span>
          </span>
          <FileDown size={15} />
        </button>
      ))}
      {msg && <p className="text-sm text-wait">{msg}</p>}
    </div>
  );
}
