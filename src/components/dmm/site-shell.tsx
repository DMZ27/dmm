import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, MessageCircle, Mail, MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CONTACT } from "@/lib/dmm/catalog";
import { Button } from "@/components/ui/button";
import { cn, whatsappHref } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/contato", label: "Contactos" },
];

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />;
  }
  if (user) {
    return (
      <div className="flex items-center gap-3 text-paper">
        <Link
          to="/dashboard"
          className="hidden h-10 items-center text-sm font-semibold text-brass-2 underline-offset-4 hover:underline sm:inline-flex"
        >
          Pedidos
        </Link>
        <div className="[&_span.text-sm.font-medium]:hidden">
          <UserButton />
        </div>
      </div>
    );
  }
  return (
    <Button
      asChild
      size="sm"
      className="h-10 rounded-full border border-brass/50 bg-transparent px-5 text-brass-2 hover:bg-brass hover:text-ink"
    >
      <Link to="/login">Entrar / Registar</Link>
    </Button>
  );
}

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <header className="nav-blur sticky top-0 z-40 border-b border-white/10 text-paper">
      <div className="mx-auto flex h-[70px] w-full max-w-[1180px] items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-dmm.svg" alt="DMM" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-full px-4 py-2 font-medium transition-colors",
                pathname === item.to
                  ? "bg-brass text-ink"
                  : "text-paper/80 hover:bg-white/10 hover:text-paper",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AuthSlot />
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 md:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm font-medium",
                  pathname === item.to ? "bg-brass text-ink" : "hover:bg-white/5",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-sm hover:bg-white/5"
            >
              Área do cliente
            </Link>
            <div className="px-3 py-2">
              <AuthSlot />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy text-paper">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <img src="/logo-dmm.svg" alt="DMM" className="h-11 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            {CONTACT.slogan}. Central de serviços em Benguela — pedido, orçamento e entrega num só sítio.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brass">SERVIÇOS</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/75">
            <li>
              <Link to="/servicos" search={{ cat: "academico", service: undefined, nota: undefined }} className="hover:text-brass-2">
                Trabalhos académicos
              </Link>
            </li>
            <li>
              <Link to="/servicos" search={{ cat: "design", service: undefined, nota: undefined }} className="hover:text-brass-2">
                Design e imagem
              </Link>
            </li>
            <li>
              <Link to="/servicos" search={{ cat: "tech", service: undefined, nota: undefined }} className="hover:text-brass-2">
                Informática e tecnologia
              </Link>
            </li>
            <li>
              <Link to="/servicos" search={{ cat: "outros", service: undefined, nota: undefined }} className="hover:text-brass-2">
                Pedidos personalizados
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brass">CONTACTOS</p>
          <ul className="mt-4 space-y-3 text-sm text-paper/80">
            <li className="flex items-center gap-2">
              <MessageCircle size={14} className="text-brass" />
              <a href={whatsappHref()} className="hover:text-brass-2">
                {CONTACT.phoneDisplay}
              </a>
              <span className="rounded-full bg-good/20 px-1.5 py-0.5 text-[10px] font-semibold text-good">
                Disponível
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-brass" />
              <a href={`mailto:${CONTACT.email}`} className="hover:text-brass-2">
                {CONTACT.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-brass" />
              {CONTACT.city}
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brass">ATENDIMENTO</p>
          <p className="mt-4 text-sm leading-relaxed text-paper/75">
            Qualquer zona de Benguela, conforme o serviço. Transferências Express no mesmo número.
          </p>
          <a
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brass px-5 text-sm font-bold text-ink transition hover:bg-brass-2"
            href={whatsappHref("Olá DMM, gostaria de um orçamento.")}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-4 py-5 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DMM — Todos os direitos reservados.</span>
          <span className="flex flex-wrap gap-4">
            <Link to="/privacidade" className="hover:text-brass-2">Privacidade</Link>
            <Link to="/termos" className="hover:text-brass-2">Termos</Link>
            <span className="hidden text-paper/40 sm:inline">
              Mais do que serviços, é a realização dos seus objectivos.
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
