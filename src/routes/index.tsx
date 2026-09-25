import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock3,
  GraduationCap,
  Headphones,
  Laptop,
  Paintbrush,
  Settings,
  ShieldCheck,
  Star,
  CheckCircle2,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { CATEGORIES, CONTACT } from "@/lib/dmm/catalog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { AutoSlideCarousel, ServiceMarquee } from "@/components/dmm/carousel";
import { cn, whatsappHref } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const TRUST = [
  { icon: ShieldCheck, label: "Qualidade Garantida" },
  { icon: Clock3, label: "Entrega no Prazo" },
  { icon: Headphones, label: "Suporte Contínuo" },
  { icon: Star, label: "Clientes Satisfeitos" },
];

const SERVICE_CARDS = [
  {
    id: "academico",
    icon: GraduationCap,
    title: "Trabalhos Académicos",
    color: "bg-[var(--color-pastel-blue)]",
    items: ["Monografias", "Anteprojectos", "Trabalhos em grupo e individuais", "Formatação (APA/ABNT)"],
  },
  {
    id: "design",
    icon: Paintbrush,
    title: "Design e Impressão",
    color: "bg-[var(--color-pastel-purple)]",
    items: ["Convites e cartões", "Painéis e cartazes", "Logótipos e artes personalizadas", "Edição de imagens"],
  },
  {
    id: "tech",
    icon: Laptop,
    title: "Informática e Tecnologia",
    color: "bg-[var(--color-pastel-green)]",
    items: ["Configuração de sistemas", "Redes e segurança", "Instalação de software", "Criação de sites personalizados"],
  },
  {
    id: "outros",
    icon: Settings,
    title: "Outros Serviços",
    color: "bg-[var(--color-pastel-yellow)]",
    items: ["Compra de materiais", "Impressões e digitalizações", "Assistência técnica", "Serviços personalizados"],
  },
];

const PORTFOLIO_SLIDES = [
  { id: "1", image: "/images/atelier-secret.jpg", title: "Monografias e Trabalhos Académicos", caption: "Qualidade académica" },
  { id: "2", image: "/images/print-studio.jpg", title: "Convites Personalizados", caption: "Design & Impressão" },
  { id: "3", image: "/images/hero-estudante.webp", title: "Edição de Imagens", caption: "Tratamento profissional" },
  { id: "4", image: "/images/tech-desk.jpg", title: "Sites e Sistemas Personalizados", caption: "Informática & Tecnologia" },
  { id: "5", image: "/images/mockup-home.webp", title: "Materiais e Impressões", caption: "Serviços sob medida" },
];

const MARQUEE_ITEMS = [
  { img: "/images/atelier-secret.jpg", label: "Monografias" },
  { img: "/images/print-studio.jpg", label: "Convites" },
  { img: "/images/hero-estudante.webp", label: "Edição" },
  { img: "/images/tech-desk.jpg", label: "Sites" },
  { img: "/images/mockup-home.webp", label: "Impressões" },
];

function Home() {
  const navigate = useNavigate();
  const [cat, setCat] = useState(CATEGORIES[0].id);
  const [nota, setNota] = useState("");

  function start(e: FormEvent) {
    e.preventDefault();
    void navigate({
      to: "/servicos",
      search: { cat, nota: nota.trim() || undefined, service: undefined },
    });
  }

  return (
    <>
      <section className="hero-bg relative overflow-hidden text-paper">
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-brass/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-brass/5 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-brass-2">
              CENTRAL DE SERVIÇOS DMM
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              O Seu Projeto,
              <br />
              <span className="text-brass-2">Nosso Compromisso!</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-paper/80">
              Trabalhos académicos, design, informática e muito mais. Aqui você encontra qualidade,
              rapidez e total confiança.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-paper/85">
                  <Icon size={16} className="text-brass-2" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="cta-pulse h-12 rounded-full bg-brass px-7 text-ink hover:bg-brass-2">
                <Link to="/servicos">
                  Encomendar Agora <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-paper/30 text-paper hover:bg-paper/10"
              >
                <a href="#servicos">Ver serviços</a>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-brass/30 to-transparent opacity-60 blur-sm" />
            <form
              onSubmit={start}
              className="relative rounded-[24px] bg-cream p-6 text-ink shadow-[var(--shadow-soft)]"
            >
              <h2 className="font-display text-xl font-bold">Encomende o Seu Trabalho</h2>
              <p className="mt-1 text-sm text-fog">Preencha o formulário e receba um orçamento.</p>

              <div className="mt-5 space-y-3.5">
                <Field label="Selecione o serviço">
                  <NativeSelect value={cat} onChange={(e) => setCat(e.target.value as typeof cat)}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Descreva o que precisa">
                  <Textarea
                    rows={3}
                    className="min-h-[88px]"
                    placeholder="Tema, prazo, formato, detalhes..."
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                  />
                </Field>
                <Button type="submit" className="h-12 w-full rounded-full bg-brass text-ink hover:bg-brass-2">
                  Enviar Encomenda <ArrowRight size={16} />
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <a
                  href={whatsappHref("Olá DMM, gostaria de um orçamento.")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-good hover:underline"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-good/10 text-good text-base">
                    ☎
                  </span>
                  WhatsApp / Transferências Express
                </a>
                <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  {CONTACT.phoneDisplay}
                  <span className="rounded-full bg-good/15 px-2 py-0.5 text-[10px] font-semibold text-good">
                    Disponível
                  </span>
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section id="servicos" className="bg-paper">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1 w-8 rounded-full bg-brass" />
                <p className="text-xs font-semibold tracking-[0.18em] text-fog uppercase">Nossos Serviços</p>
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                Escolha o serviço que você precisa
              </h2>
              <p className="mt-1 text-fog">e faça a sua encomenda.</p>
            </div>
            <Link
              to="/servicos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:text-brass hover:underline"
            >
              Ver todos os serviços <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.id}
                  to="/servicos"
                  search={{ cat: card.id, service: undefined, nota: undefined }}
                  className={cn(
                    "group flex flex-col rounded-[20px] p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]",
                    card.color,
                  )}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cream shadow-sm">
                    <Icon size={22} className="text-ink" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{card.title}</h3>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-fog">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brass" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink transition group-hover:text-brass">
                    Saber mais <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-cream py-6">
        <ServiceMarquee>
          {MARQUEE_ITEMS.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className="flex w-[220px] shrink-0 items-center gap-3 rounded-2xl border border-line bg-paper px-3 py-2.5 shadow-sm"
            >
              <img src={item.img} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <p className="text-xs font-semibold text-fog">Serviço</p>
                <p className="font-display text-sm font-bold text-ink">{item.label}</p>
              </div>
            </div>
          ))}
        </ServiceMarquee>
      </section>

      <section className="bg-navy text-paper">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1 w-8 rounded-full bg-brass" />
                <p className="text-xs font-semibold tracking-[0.18em] text-brass-2 uppercase">
                  Alguns dos Nossos Trabalhos
                </p>
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold">Qualidade que fala por si</h2>
              <p className="mt-1 max-w-md text-paper/70">
                Veja alguns exemplos do que podemos fazer por você.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <AutoSlideCarousel slides={PORTFOLIO_SLIDES} intervalMs={4200} />
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Segurança dos Seus Dados", body: "Seus arquivos são protegidos e mantidos em sigilo." },
            { icon: Clock3, title: "Processo Simples", body: "Encomende em poucos minutos." },
            { icon: Headphones, title: "Acompanhamento em Tempo Real", body: "Saiba sempre o estado do seu pedido." },
            { icon: Star, title: "Atendimento Personalizado", body: "Estamos sempre prontos para ajudar." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brass/15 text-brass">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
                <p className="mt-0.5 text-sm text-fog">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
