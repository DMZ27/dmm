import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useRef, useState } from "react";
import { FileText, MessageSquare, Sparkles, UserRound } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { aiChat, aiChatPdfFile, aiGenerateCv } from "@/lib/dmm/ai";
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
    return <div className="mx-auto max-w-[900px] px-4 py-16 text-sm text-fog">A carregar…</div>;
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-[75vh] bg-[#f6f7fb]">
      <div className="mx-auto w-full max-w-[900px] px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brass">Ferramentas DMM</p>
            <h1 className="mt-1 font-display text-3xl font-bold">Assistente IA</h1>
            <p className="mt-1 text-sm text-fog">
              Chat de apoio, perguntas sobre PDF e geração de currículo personalizado.
            </p>
          </div>
          <Button asChild variant="cream" className="h-11 rounded-full">
            <Link to="/dashboard">Área do cliente</Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              { id: "chat" as const, label: "Chat", icon: MessageSquare },
              { id: "pdf" as const, label: "Chat PDF", icon: FileText },
              { id: "cv" as const, label: "Currículo", icon: UserRound },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
                tab === id ? "bg-navy text-paper" : "bg-white text-ink border border-line hover:border-brass/40",
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "chat" && <ChatPanel />}
          {tab === "pdf" && <PdfPanel />}
          {tab === "cv" && <CvPanel />}
        </div>
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send(e: FormEvent) {
    e.preventDefault();
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
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Sparkles size={16} className="text-brass" />
        <p className="text-sm font-semibold">Assistente DMM</p>
      </div>
      <div className="flex max-h-[420px] min-h-[280px] flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-fog">
            Pergunte sobre serviços da DMM, estrutura de trabalhos académicos, formatação, ou peça ideias
            para o seu pedido.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "user" ? "ml-auto bg-navy text-paper" : "bg-[#f6f7fb] text-ink",
            )}
          >
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
      </div>
      {err && <p className="px-4 pb-2 text-sm text-bad">{err}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva a sua pergunta…"
          disabled={busy}
        />
        <Button type="submit" disabled={busy} className="h-11 shrink-0 rounded-full px-5">
          {busy ? "…" : "Enviar"}
        </Button>
      </form>
    </div>
  );
}

function PdfPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function ask(e: FormEvent) {
    e.preventDefault();
    if (!file || !question.trim() || busy) return;
    setBusy(true);
    setErr("");
    setReply("");
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const fileBase64 = btoa(binary);
      const res = await aiChatPdfFile({
        data: { question: question.trim(), fileBase64, fileName: file.name },
      });
      setReply(res.reply);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-bold">Chat com PDF</h2>
      <p className="mt-1 text-sm text-fog">
        Envie um PDF com texto (não só imagens) e faça perguntas sobre o conteúdo — resumos, explicações,
        secções do trabalho.
      </p>
      <form onSubmit={ask} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-fog">Ficheiro PDF (máx. ~4 MB)</label>
          <input
            ref={inputRef}
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
            placeholder="Ex: Resume as ideias principais do capítulo 2."
          />
        </div>
        <Button type="submit" disabled={busy || !file} className="h-11 rounded-full">
          {busy ? "A analisar…" : "Perguntar ao documento"}
        </Button>
      </form>
      {err && <p className="mt-3 text-sm text-bad">{err}</p>}
      {reply && (
        <div className="mt-4 rounded-xl bg-[#f6f7fb] p-4 text-sm leading-relaxed whitespace-pre-wrap">
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

  function printCv() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={generate} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl font-bold">Currículo personalizado</h2>
        <p className="mt-1 text-sm text-fog">
          Preencha os dados. A IA organiza o texto profissionalmente. Pode adicionar uma foto.
        </p>
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
            <Textarea
              className="mt-1"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Empresa, cargo, datas, responsabilidades…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Formação</label>
            <Textarea className="mt-1" value={education} onChange={(e) => setEducation(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-fog">Competências</label>
            <Input className="mt-1" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Ex: Excel, Word, atendimento…" />
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
                <img src={photo} alt="" className="h-24 w-24 rounded-xl object-cover print:h-28 print:w-28" />
              )}
              <div>
                <h2 className="font-display text-2xl font-bold">{result.fullName}</h2>
                {result.targetRole && <p className="text-brass font-semibold">{result.targetRole}</p>}
                <p className="mt-1 text-sm text-fog">
                  {[result.email, result.phone, result.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <Button type="button" variant="cream" className="h-10 rounded-full print:hidden" onClick={printCv}>
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
