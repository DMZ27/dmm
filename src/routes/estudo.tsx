import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  CalendarCheck,
  GraduationCap,
  ExternalLink,
  Search,
  Sparkles,
  Target,
  Clock3,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  aiStudyPlan,
  deleteStudyPlan,
  listMyStudyPlans,
  saveStudyPlan,
  type StudyLink,
  type StudyPlanRow,
} from "@/lib/dmm/estudo";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/estudo")({
  component: EstudoPage,
  head: () => ({
    meta: [
      { title: "DMM Estudo — Pesquisa e produtividade para estudantes" },
      {
        name: "description",
        content:
          "Plano de pesquisa académica, produtividade escolar e orientação para estudantes do ensino superior em Angola. Da ideia ao método — com a DMM.",
      },
    ],
  }),
});

const AREAS = [
  "Ciências da Computação / Informática",
  "Engenharia (várias)",
  "Gestão / Economia / Contabilidade",
  "Direito",
  "Saúde / Enfermagem",
  "Educação",
  "Outra licenciatura",
];

const WORK_TYPES = [
  "Trabalho de cadeira / relatório",
  "Trabalho de grupo",
  "Anteprojecto",
  "Monografia / PFC",
  "Apresentação / seminar",
  "Artigo / resumo",
];

const YEARS = ["1.º ano", "2.º ano", "3.º ano", "4.º ano", "5.º ano / finalista"];

function EstudoPage() {
  const { user, isPending: authPending } = useCurrentUserState();
  const [topic, setTopic] = useState("");
  const [area, setArea] = useState(AREAS[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [workType, setWorkType] = useState(WORK_TYPES[0]);
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reply, setReply] = useState("");
  const [links, setLinks] = useState<StudyLink[]>([]);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saved, setSaved] = useState<StudyPlanRow[] | null>(null);
  const [savedErr, setSavedErr] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function loadSaved() {
    if (!user) {
      setSaved(null);
      return;
    }
    listMyStudyPlans()
      .then((rows) => {
        setSaved(rows);
        setSavedErr("");
      })
      .catch((e) => {
        setSavedErr(e instanceof Error ? e.message : "Não foi possível carregar os planos.");
        setSaved([]);
      });
  }

  useEffect(() => {
    if (!authPending) loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authPending, user?.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = topic.trim();
    if (t.length < 3) {
      setErr("Escreve o tema do teu trabalho.");
      return;
    }
    setBusy(true);
    setErr("");
    setReply("");
    setLinks([]);
    setSaveMsg("");
    try {
      const res = await aiStudyPlan({
        data: {
          topic: t,
          area,
          year,
          workType,
          deadline: deadline.trim() || undefined,
        },
      });
      setReply(res.reply);
      setLinks(res.links || []);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Não foi possível gerar o plano.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!reply) return;
    if (!user) {
      setSaveMsg("Cria conta ou entra para guardar o plano.");
      return;
    }
    setSaveBusy(true);
    setSaveMsg("");
    try {
      await saveStudyPlan({
        data: {
          topic: topic.trim(),
          area,
          year,
          workType,
          deadline: deadline.trim() || undefined,
          planText: reply,
          links,
        },
      });
      setSaveMsg("Plano guardado na tua conta.");
      loadSaved();
    } catch (ex) {
      setSaveMsg(ex instanceof Error ? ex.message : "Erro ao guardar.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Apagar este plano guardado?")) return;
    try {
      await deleteStudyPlan({ data: { id } });
      setSaved((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
      if (openId === id) setOpenId(null);
    } catch (ex) {
      setSavedErr(ex instanceof Error ? ex.message : "Erro ao apagar.");
    }
  }

  function reopen(plan: StudyPlanRow) {
    setTopic(plan.topic);
    if (plan.area) setArea(plan.area);
    if (plan.year_label) setYear(plan.year_label);
    if (plan.work_type) setWorkType(plan.work_type);
    setDeadline(plan.deadline || "");
    setReply(plan.plan_text);
    const lj = plan.links_json;
    setLinks(Array.isArray(lj) ? lj : []);
    setOpenId(plan.id);
    setSaveMsg("");
    document.getElementById("plano")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-[70vh] bg-[#f4f5f8]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-paper">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 50% at 60% 30%, rgba(232,185,35,0.15), transparent 55%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-4 py-12 sm:py-16">
          <div className="flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-brass" />
            <p className="text-xs font-semibold tracking-[0.18em] text-brass-2 uppercase">
              DMM Estudo
            </p>
          </div>
          <h1 className="mt-3 max-w-2xl font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold leading-tight">
            Estuda com método. Pesquisa com clareza. Entrega a tempo.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-paper/75">
            Espaço para estudantes do ensino superior em Angola — do 1.º ano ao finalista.
            Plano de pesquisa, produtividade e caminho até à formatação e entrega com a DMM.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#plano"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brass px-5 text-sm font-bold text-ink shadow-[var(--shadow-gold)]"
            >
              <Search size={16} /> Começar pelo tema
            </a>
            <Link
              to="/assistente"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-paper/25 px-5 text-sm font-semibold text-paper hover:bg-white/10"
            >
              <Sparkles size={16} /> Assistente IA
            </Link>
          </div>
        </div>
      </section>

      {/* 3 pilares */}
      <section className="mx-auto w-full max-w-[1100px] px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Pesquisa académica",
              body: "Palavras-chave, onde procurar (Google Académico, SciELO) e estrutura do trabalho — sem inventar fontes.",
            },
            {
              icon: Target,
              title: "Produtividade",
              body: "Planos por prazo, checklists por tipo de entrega e foco no que importa esta semana.",
            },
            {
              icon: GraduationCap,
              title: "Do 1.º ano ao finalista",
              body: "Relatórios, trabalhos de grupo, anteprojecto, monografia e defesa — orientação por etapa.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-brass">
                <Icon size={20} />
              </div>
              <h2 className="mt-3 font-display text-lg font-bold text-ink">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-fog">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Caixa principal — Fase 1 */}
      <section id="plano" className="scroll-mt-24 border-y border-line bg-white">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-12">
          <div className="flex items-center gap-2">
            <Brain className="text-brass" size={22} />
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Plano de pesquisa em minutos
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-fog sm:text-base">
            Escreve o tema do trabalho. A DMM devolve orientação de pesquisa, palavras-chave e
            links para o Google Académico e outras fontes. Não substitui a tua leitura — organiza
            o caminho.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 grid gap-4 rounded-2xl border border-line bg-[#f4f5f8] p-4 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-fog">Tema do trabalho *</label>
                <Textarea
                  className="mt-1 min-h-[100px] bg-white"
                  placeholder="Ex: Segurança em redes sem fios em ambientes académicos"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={300}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-fog">Área / curso</label>
                  <NativeSelect
                    className="mt-1 bg-white"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <label className="text-xs font-semibold text-fog">Ano</label>
                  <NativeSelect
                    className="mt-1 bg-white"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <label className="text-xs font-semibold text-fog">Tipo de trabalho</label>
                  <NativeSelect
                    className="mt-1 bg-white"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                  >
                    {WORK_TYPES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <label className="text-xs font-semibold text-fog">Prazo (opcional)</label>
                  <Input
                    className="mt-1 bg-white"
                    placeholder="Ex: 10 dias / sexta-feira"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              {err && (
                <p className="rounded-xl bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p>
              )}
              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full rounded-full text-base sm:w-auto sm:px-8"
              >
                {busy ? "A gerar plano…" : "Gerar plano de pesquisa"}
              </Button>
            </div>

            <div className="rounded-xl border border-line bg-white p-4 text-sm text-fog">
              <p className="font-semibold text-ink">O que vais receber</p>
              <ul className="mt-3 space-y-2">
                {[
                  "Leitura clara do tema",
                  "Palavras-chave em PT e EN",
                  "Onde e como pesquisar",
                  "Estrutura sugerida do trabalho",
                  "Plano por dias ou horas",
                  "Links directos para fontes académicas",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brass" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed">
                A DMM não escreve o trabalho por ti. Orientamos método, normas e formatação —
                o conteúdo académico continua a ser responsabilidade do estudante.
              </p>
            </div>
          </form>

          {/* Resultado */}
          {(reply || links.length > 0) && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
                <h3 className="font-display text-lg font-bold text-ink">O teu plano</h3>
                <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                  {reply}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-line bg-navy p-5 text-paper">
                  <h3 className="font-display text-lg font-bold">Pesquisar agora</h3>
                  <p className="mt-1 text-xs text-paper/70">
                    Abre numa nova separa e usa as palavras-chave do plano.
                  </p>
                  <ul className="mt-4 space-y-3">
                    {links.map((l) => (
                      <li key={l.name}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brass-2 hover:underline"
                        >
                          {l.name} <ExternalLink size={14} />
                        </a>
                        <p className="text-xs text-paper/60">{l.hint}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="text-sm font-semibold text-ink">Guardar este plano</p>
                  <p className="mt-1 text-xs text-fog">
                    Com conta, ficas com o histórico para reveres quando quiseres.
                  </p>
                  <Button
                    type="button"
                    className="mt-3 h-10 w-full rounded-full"
                    disabled={saveBusy || !reply}
                    onClick={() => void onSave()}
                  >
                    {saveBusy ? "A guardar…" : user ? "Guardar na minha conta" : "Entrar para guardar"}
                  </Button>
                  {!user && (
                    <Button asChild variant="cream" className="mt-2 h-10 w-full rounded-full">
                      <Link to="/login">Entrar / Registar</Link>
                    </Button>
                  )}
                  {saveMsg && <p className="mt-2 text-xs text-fog">{saveMsg}</p>}
                </div>
                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="text-sm font-semibold text-ink">Precisas de formatação ou revisão?</p>
                  <p className="mt-1 text-xs text-fog">
                    APA/ABNT, estrutura e entrega com acompanhamento no site.
                  </p>
                  <Button asChild className="mt-3 h-10 w-full rounded-full">
                    <Link to="/servicos">
                      Ver serviços <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button asChild variant="cream" className="mt-2 h-10 w-full rounded-full">
                    <Link to="/assistente">Falar com o assistente</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Planos guardados — Fase 2 */}
      <section id="meus-planos" className="scroll-mt-24 border-t border-line bg-white">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-ink">Os meus planos</h2>
          <p className="mt-1 text-sm text-fog">
            Histórico na tua conta. Só tu vês estes planos.
          </p>

          {authPending && (
            <p className="mt-6 text-sm text-fog">A carregar sessão…</p>
          )}

          {!authPending && !user && (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-[#f4f5f8] px-5 py-8 text-center">
              <p className="text-sm text-fog">
                Entra na tua conta para guardar e rever planos de pesquisa.
              </p>
              <Button asChild className="mt-4 h-11 rounded-full">
                <Link to="/login">Entrar / Registar</Link>
              </Button>
            </div>
          )}

          {!authPending && user && savedErr && (
            <p className="mt-4 text-sm text-bad">{savedErr}</p>
          )}

          {!authPending && user && saved && saved.length === 0 && (
            <p className="mt-6 text-sm text-fog">
              Ainda não tens planos guardados. Gera um acima e clica em “Guardar na minha conta”.
            </p>
          )}

          {!authPending && user && saved && saved.length > 0 && (
            <ul className="mt-6 space-y-3">
              {saved.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-line bg-[#f4f5f8] px-4 py-3 sm:px-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{p.topic}</p>
                      <p className="mt-0.5 text-xs text-fog">
                        {[p.area, p.year_label, p.work_type].filter(Boolean).join(" · ")}
                        {p.created_at ? ` · ${p.created_at.slice(0, 10)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="cream"
                        className="h-9 rounded-full text-xs"
                        onClick={() => reopen(p)}
                      >
                        Abrir
                      </Button>
                      <Button
                        type="button"
                        variant="cream"
                        className="h-9 rounded-full text-xs text-bad"
                        onClick={() => void onDelete(p.id)}
                      >
                        Apagar
                      </Button>
                    </div>
                  </div>
                  {openId === p.id && (
                    <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap border-t border-line pt-3 text-xs leading-relaxed text-fog">
                      {p.plan_text.slice(0, 800)}
                      {p.plan_text.length > 800 ? "…" : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Conteúdo geral — produtividade */}
      <section className="mx-auto w-full max-w-[1100px] px-4 py-14">
        <div className="flex items-center gap-2">
          <CalendarCheck className="text-brass" size={22} />
          <h2 className="font-display text-2xl font-bold text-ink">Produtividade escolar</h2>
        </div>
        <p className="mt-2 max-w-2xl text-fog">
          Método simples que funciona em época de testes e de entregas — especialmente se
          estudas e trabalhas ao mesmo tempo.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Regra das 3 prioridades",
              body: "Cada dia, escolhe só 3 tarefas académicas. O resto fica para amanhã. Reduz a ansiedade e aumenta o que realmente entregas.",
            },
            {
              title: "Blocos de 50 minutos",
              body: "Estuda 50 minutos sem telemóvel, pausa 10. Quatro blocos bem feitos valem mais do que uma noite em claro desorganizada.",
            },
            {
              title: "Pesquisa antes de escrever",
              body: "1/3 do tempo a procurar e ler fontes; 1/3 a escrever; 1/3 a rever e formatar. Inverter esta ordem é o erro mais comum.",
            },
            {
              title: "Normas desde o início",
              body: "Define APA ou ABNT no primeiro dia. Corrigir formatação no fim gasta horas que podias usar no conteúdo.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <h3 className="font-display text-base font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Por ano */}
      <section className="border-t border-line bg-cream">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-14">
          <div className="flex items-center gap-2">
            <BookOpen className="text-brass" size={22} />
            <h2 className="font-display text-2xl font-bold text-ink">Do primeiro ao último ano</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "1.º e 2.º ano",
                items: [
                  "Como ler um artigo científico",
                  "Primeiro relatório de cadeira",
                  "Trabalhos de grupo sem caos",
                  "Organizar apontamentos",
                ],
              },
              {
                label: "Meio do curso",
                items: [
                  "Relatórios técnicos e de laboratório",
                  "Gestão de prazos no semestre",
                  "Apresentações orais",
                  "Citar sem plagiar",
                ],
              },
              {
                label: "Finalistas",
                items: [
                  "Anteprojecto e monografia",
                  "Estrutura de capítulos",
                  "Normas e referências",
                  "Currículo e estágio",
                ],
              },
            ].map((col) => (
              <div key={col.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-bold uppercase tracking-wider text-brass">{col.label}</p>
                <ul className="mt-3 space-y-2">
                  {col.items.map((i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-navy text-paper">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold">Método aqui. Entrega com a DMM.</h2>
            <p className="mt-2 max-w-lg text-sm text-paper/70">
              Quando o plano estiver claro, a equipa em Benguela ajuda com formatação, revisão de
              estrutura, impressão e prazos — com acompanhamento no site.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-11 rounded-full bg-brass text-ink hover:bg-brass/90">
              <Link to="/servicos">Encomendar serviço</Link>
            </Button>
            <Button
              asChild
              variant="cream"
              className="h-11 rounded-full border border-paper/20 bg-transparent text-paper hover:bg-white/10"
            >
              <Link to="/registar">Criar conta</Link>
            </Button>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-[1100px] px-4 py-6 text-center text-xs text-fog">
        <Clock3 size={12} className="mr-1 inline" />
        DMM Estudo — orientação académica ética. O conteúdo e a originalidade do trabalho são do
        estudante.
      </p>
    </div>
  );
}
