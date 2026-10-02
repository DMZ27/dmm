import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  FileText,
  MessageSquare,
  Sparkles,
  User,
  UserRound,
} from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { aiChat, aiChatPdf, aiGenerateCv } from "@/lib/dmm/ai";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistente")({ component: AssistentePage });

type Tab = "chat" | "pdf" | "cv";
type Msg = { role: "user" | "assistant"; content: string };

function AssistentePage() {
  const { user, isPending } = useCurrentUserState();
  const [tab, setTab] = useState<Tab>("chat");

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-fog">A carregar…</div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="flex h-[calc(100vh-70px)] flex-col overflow-hidden bg-[#f4f5f8]">
      {/* Barra superior */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-[920px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-navy text-brass">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">Assistente DMM</h1>
              <p className="text-xs text-fog">Chat · PDF · Currículo</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "chat" as const, label: "Chat", icon: MessageSquare },
                { id: "pdf" as const, label: "PDF", icon: FileText },
                { id: "cv" as const, label: "Currículo", icon: UserRound },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition",
                  tab === id
                    ? "bg-navy text-paper"
                    : "border border-line bg-white text-ink hover:border-brass/40",
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
            <Button asChild variant="cream" className="h-9 rounded-full text-xs">
              <Link to="/dashboard">Área do cliente</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mx-auto flex w-full max-w-[920px] min-h-0 flex-1 flex-col overflow-hidden px-0 sm:px-4">
        {tab === "chat" && <ChatPanel />}
        {tab === "pdf" && (
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <PdfPanel />
          </div>
        )}
        {tab === "cv" && (
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <CvPanel />
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Só a lista de mensagens faz scroll — a barra de baixo não se mexe
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy, err]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setErr("");
    try {
      const { reply } = await aiChat({ data: { messages: next } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro");
    } finally {
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex h-[calc(100vh-130px)] min-h-[420px] flex-col overflow-hidden">
      {/* Só esta zona faz scroll */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        {messages.length === 0 && !busy && (
          <div className="mx-auto flex max-w-[640px] flex-col items-center px-4 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-navy text-brass shadow-md">
              <Bot size={28} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Como posso ajudar?</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-fog">
              Pergunte sobre serviços da DMM, estrutura de trabalhos académicos, formatação ou ideias para o
              seu pedido.
            </p>
            <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
              {[
                "Que serviços a DMM oferece?",
                "Como estruturar uma monografia?",
                "O que é formatação APA?",
                "Como encomendar um trabalho?",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-left text-sm text-ink shadow-sm transition hover:border-brass/50 hover:shadow"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto flex max-w-[720px] flex-col gap-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm",
                  m.role === "user" ? "bg-navy text-brass" : "bg-brass/20 text-navy",
                )}
              >
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={cn(
                  "max-w-[min(100%,560px)] rounded-2xl px-4 py-3.5 text-[15px] leading-[1.65] shadow-sm",
                  m.role === "user"
                    ? "rounded-tr-md bg-navy text-paper"
                    : "rounded-tl-md bg-white text-ink ring-1 ring-black/[0.06]",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brass/20 text-navy">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.06]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-fog [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-fog [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-fog [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-1 shrink-0" />
        </div>
      </div>

      {/* Barra fixa — não sobe com o scroll */}
      <div className="shrink-0 border-t border-line bg-[#f4f5f8] px-4 py-3">
        {err && (
          <p className="mx-auto mb-2 max-w-[720px] rounded-xl bg-bad/10 px-4 py-2 text-sm text-bad">{err}</p>
        )}
        <form
          onSubmit={send}
          className="mx-auto flex max-w-[720px] items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-md"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escreva a sua mensagem…"
            disabled={busy}
            className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-ink outline-none placeholder:text-mist"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
              input.trim() && !busy
                ? "bg-navy text-brass hover:bg-navy/90"
                : "cursor-not-allowed bg-line text-mist",
            )}
            aria-label="Enviar"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-[720px] text-center text-[11px] text-fog">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

async function extractPdfTextInBrowser(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm");
  const lib = pdfjs as {
    getDocument: (opts: { data: Uint8Array }) => {
      promise: Promise<{
        numPages: number;
        getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: { str?: string }[] }> }>;
      }>;
    };
    GlobalWorkerOptions: { workerSrc: string };
  };
  lib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const doc = await lib.getDocument({ data }).promise;
  const parts: string[] = [];
  const maxPages = Math.min(doc.numPages, 40);
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((it) => it.str || "").join(" ");
    if (line.trim()) parts.push(line);
  }
  return parts.join("\n").replace(/\s+/g, " ").trim();
}

function PdfPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function ask(e: FormEvent) {
    e.preventDefault();
    if (!file || !question.trim() || busy) return;
    setBusy(true);
    setErr("");
    setReply("");
    try {
      if (file.size > 8_000_000) throw new Error("PDF demasiado grande (máx. 8 MB).");
      const documentText = await extractPdfTextInBrowser(file);
      if (documentText.length < 20) {
        throw new Error(
          "Não há texto legível neste PDF (pode ser só imagens/scanners). Use um PDF com texto seleccionável.",
        );
      }
      const res = await aiChatPdf({
        data: {
          question: question.trim(),
          documentText: documentText.slice(0, 24000),
          documentName: file.name,
        },
      });
      setReply(res.reply);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[640px] rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-bold">Chat com PDF</h2>
      <p className="mt-1 text-sm text-fog">
        Envie um PDF com texto seleccionável e faça perguntas sobre o conteúdo.
      </p>
      <form onSubmit={ask} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-fog">Ficheiro PDF</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="mt-1 block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && <p className="mt-1 text-xs text-fog">{file.name}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-fog">A sua pergunta</label>
          <Textarea
            className="mt-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Resume as ideias principais."
          />
        </div>
        <Button type="submit" disabled={busy || !file} className="h-11 rounded-full">
          {busy ? "A analisar…" : "Perguntar ao documento"}
        </Button>
      </form>
      {err && <p className="mt-3 text-sm text-bad">{err}</p>}
      {reply && (
        <div className="mt-4 rounded-xl border border-line bg-[#f6f7fb] p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {reply}
        </div>
      )}
    </div>
  );
}

function CvPanel() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Benguela");
  const [targetRole, setTargetRole] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof aiGenerateCv>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function onPhoto(file: File | null) {
    if (!file) {
      setPhoto(null);
      return;
    }
    if (file.size > 1_500_000) {
      setErr("Foto máx. 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function generate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await aiGenerateCv({
        data: { fullName, email, phone, city, targetRole, summary, experience, education, skills },
      });
      setResult(res);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <form onSubmit={generate} className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-bold">Currículo personalizado</h2>
        <p className="mt-1 text-sm text-fog">Preencha os dados. A IA organiza o texto profissionalmente.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Nome completo</label>
            <Input className="mt-1" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-fog">Email</label>
            <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-fog">Telefone</label>
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-fog">Cidade</label>
            <Input className="mt-1" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-fog">Cargo desejado</label>
            <Input className="mt-1" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Sobre si / objectivo</label>
            <Textarea className="mt-1" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Experiência</label>
            <Textarea className="mt-1" value={experience} onChange={(e) => setExperience(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Formação</label>
            <Textarea className="mt-1" value={education} onChange={(e) => setEducation(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Competências</label>
            <Input className="mt-1" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-bad">{err}</p>}
        <Button type="submit" disabled={busy} className="mt-4 h-11 rounded-full">
          {busy ? "A gerar…" : "Gerar currículo com IA"}
        </Button>
      </form>

      {result && (
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm print:border-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              {photo && (
                <img src={photo} alt="" className="h-24 w-24 rounded-xl object-cover" />
              )}
              <div>
                <h2 className="font-display text-2xl font-bold">{result.fullName}</h2>
                {result.targetRole && <p className="font-semibold text-brass">{result.targetRole}</p>}
                <p className="mt-1 text-sm text-fog">
                  {[result.email, result.phone, result.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <Button type="button" variant="cream" className="h-10 rounded-full print:hidden" onClick={() => window.print()}>
              Imprimir / PDF
            </Button>
          </div>
          {result.summary && (
            <section className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brass">Resumo</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{result.summary}</p>
            </section>
          )}
          {result.experience && (
            <section className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brass">Experiência</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{result.experience}</p>
            </section>
          )}
          {result.education && (
            <section className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brass">Formação</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{result.education}</p>
            </section>
          )}
          {result.skills && (
            <section className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brass">Competências</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{result.skills}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
