import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, Upload } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/dmm/catalog";
import { createOrder, listServices, type ServiceRow } from "@/lib/dmm/server";
import { packFiles } from "@/lib/dmm/files-client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { orderCode } from "@/lib/utils";

type Search = { cat?: string; service?: string; nota?: string };

export const Route = createFileRoute("/servicos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    cat: typeof s.cat === "string" ? s.cat : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
    nota: typeof s.nota === "string" ? s.nota : undefined,
  }),
  component: Servicos,
});

function Servicos() {
  const search = Route.useSearch();
  const [services, setServices] = useState<ServiceRow[] | null>(null);
  const [err, setErr] = useState("");
  const initialCat = (CATEGORIES.some((c) => c.id === search.cat) ? search.cat : "Todos") as string;
  const [cat, setCat] = useState(initialCat);
  const [selected, setSelected] = useState<ServiceRow | null>(null);

  useEffect(() => {
    listServices()
      .then((rows) => {
        setServices(rows);
        const match = rows.find((s) => s.slug === search.service || s.id === search.service);
        if (match) setSelected(match);
      })
      .catch(() => setErr("Não foi possível carregar os serviços."));
  }, [search.service]);

  const filtered = useMemo(() => {
    if (!services) return [];
    if (cat === "Todos") return services;
    return services.filter((s) => s.category === cat);
  }, [services, cat]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
      {!selected ? (
        <>
          <div className="flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-brass" />
            <p className="text-xs font-semibold tracking-[0.18em] text-fog uppercase">Catálogo</p>
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Escolha o serviço</h1>
          <p className="mt-2 max-w-xl text-fog">
            O formulário adapta-se ao tipo de encomenda. Precisa de conta para enviar.
          </p>
          {err && <p className="mt-4 text-sm text-bad">{err}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            {["Todos", ...CATEGORIES.map((c) => c.id)].map((id) => {
              const label = id === "Todos" ? "Todos" : CATEGORIES.find((c) => c.id === id)?.name;
              const on = cat === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCat(id)}
                  className={`h-10 rounded-full px-4 text-sm font-semibold transition ${
                    on
                      ? "bg-brass text-ink shadow-[var(--shadow-gold)]"
                      : "border border-line bg-cream text-ink hover:border-brass/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!services &&
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-[20px]" />)}
            {filtered.map((s) => (
              <article
                key={s.id}
                className="flex flex-col rounded-[20px] border border-line bg-cream p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
              >
                <p className="text-[11px] font-semibold tracking-wide text-brass uppercase">
                  {CATEGORIES.find((c) => c.id === s.category)?.name}
                </p>
                <h2 className="mt-2 font-display text-xl font-bold">{s.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-fog">{s.description}</p>
                <Button className="mt-5" onClick={() => setSelected(s)}>
                  Encomendar <Send size={15} />
                </Button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <OrderForm
          service={selected}
          nota={search.nota}
          back={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function OrderForm({
  service,
  nota,
  back,
}: {
  service: ServiceRow;
  nota?: string;
  back: () => void;
}) {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({ description: nota ?? "" });
  const [members, setMembers] = useState([""]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; code: number } | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!isPending && !user) {
    return (
      <div className="rounded-[24px] bg-cream p-8">
        <p className="font-display text-2xl">Entre para enviar o pedido</p>
        <p className="mt-2 text-sm text-fog">O catálogo é público; a encomenda fica ligada à sua conta.</p>
        <Button asChild className="mt-6">
          <Link to="/login">Entrar / criar conta</Link>
        </Button>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const input = (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[type="file"]');
      const files = input?.files?.length ? await packFiles(input.files) : [];
      const payload = { ...form, members: members.filter(Boolean) };
      const row = await createOrder({
        data: {
          serviceId: service.id,
          title: form.title || service.name,
          description: form.description,
          formData: payload,
          files,
        },
      });
      setCreated(row);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Não foi possível criar o pedido.";
      if (text.includes("Unauthorized")) {
        void navigate({ to: "/login" });
        return;
      }
      setMsg(text);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-[24px] bg-cream p-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-good">PEDIDO CRIADO</p>
        <h2 className="mt-2 font-display text-3xl">{orderCode(created.code)}</h2>
        <p className="mt-2 text-fog">Recebemos o briefing. A DMM responde com o orçamento nesta área.</p>
        <Button asChild className="mt-6">
          <Link to="/dashboard/$orderId" params={{ orderId: created.id }}>
            Abrir o pedido
          </Link>
        </Button>
      </div>
    );
  }

  const academic = service.category === "academico";
  const design = service.category === "design";
  const tech = service.category === "tech";

  return (
    <div>
      <button type="button" onClick={back} className="inline-flex h-11 items-center gap-2 text-sm font-semibold">
        <ArrowLeft size={16} /> Voltar ao catálogo
      </button>
      <form onSubmit={submit} className="mt-5 rounded-[28px] bg-cream p-6 shadow-[var(--shadow-soft)] md:p-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-wait">NOVA ENCOMENDA</p>
        <h2 className="mt-2 font-display text-3xl">{service.name}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fog">{service.details}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Título do pedido">
            <Input required value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Formatação da monografia" />
          </Field>
          <Field label="Prazo pretendido">
            <Input type="date" value={form.deadline ?? ""} onChange={(e) => set("deadline", e.target.value)} />
          </Field>
          <Field label="O seu nome">
            <Input required value={form.clientName ?? ""} onChange={(e) => set("clientName", e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input required value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="923..." />
          </Field>
          {academic && (
            <>
              <Field label="Tema">
                <Input value={form.theme ?? ""} onChange={(e) => set("theme", e.target.value)} />
              </Field>
              <Field label="Curso / disciplina">
                <Input value={form.course ?? ""} onChange={(e) => set("course", e.target.value)} />
              </Field>
              <Field label="Instituição">
                <Input value={form.institution ?? ""} onChange={(e) => set("institution", e.target.value)} />
              </Field>
              <Field label="Norma">
                <NativeSelect value={form.norm ?? ""} onChange={(e) => set("norm", e.target.value)}>
                  <option value="">Selecione</option>
                  <option>APA</option>
                  <option>ABNT</option>
                  <option>Norma da instituição</option>
                  <option>Não sei</option>
                </NativeSelect>
              </Field>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold tracking-wide text-fog">Membros do grupo</p>
                <div className="mt-2 space-y-2">
                  {members.map((m, i) => (
                    <Input
                      key={i}
                      value={m}
                      placeholder={`Membro ${i + 1}`}
                      onChange={(e) => {
                        const next = [...members];
                        next[i] = e.target.value;
                        setMembers(next);
                      }}
                    />
                  ))}
                  <Button type="button" variant="cream" size="sm" onClick={() => setMembers([...members, ""])}>
                    Adicionar membro
                  </Button>
                </div>
              </div>
            </>
          )}
          {design && (
            <>
              <Field label="Tipo de peça">
                <Input value={form.piece ?? ""} onChange={(e) => set("piece", e.target.value)} placeholder="Convite, cartaz, logótipo..." />
              </Field>
              <Field label="Medida / formato">
                <Input value={form.size ?? ""} onChange={(e) => set("size", e.target.value)} placeholder="A4, 50×70, story..." />
              </Field>
            </>
          )}
          {tech && (
            <>
              <Field label="Equipamento / sistema">
                <Input value={form.device ?? ""} onChange={(e) => set("device", e.target.value)} />
              </Field>
              <Field label="Zona em Benguela">
                <Input value={form.zone ?? ""} onChange={(e) => set("zone", e.target.value)} />
              </Field>
            </>
          )}
          <Field label="Detalhes e instruções" className="md:col-span-2">
            <Textarea rows={5} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Tudo o que devemos saber..." />
          </Field>
        </div>
        <div className="mt-5 rounded-[18px] border border-dashed border-line bg-paper/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Upload size={16} /> Anexos (PDF, Office, imagens, ZIP · máx. ~900 KB cada)
          </p>
          <input className="mt-3 block w-full text-sm" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.zip" />
        </div>
        <Button type="submit" className="mt-6" disabled={busy || isPending}>
          {busy ? "A enviar…" : "Enviar encomenda"} <Send size={16} />
        </Button>
        {msg && <p className="mt-4 rounded-[12px] bg-wait/10 px-3 py-2 text-sm text-wait">{msg}</p>}
      </form>
    </div>
  );
}
