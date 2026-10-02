import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, MessageCircle, Mail, MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CONTACT } from "@/lib/dmm/catalog";
import { Button } from "@/components/ui/button";
import { cn, whatsappHref } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", hash: undefined as string | undefined },
  { to: "/servicos", label: "Serviços", hash: undefined },
  { to: "/", label: "Sobre Nós", hash: "sobre" },
  { to: "/assistente", label: "Assistente IA", hash: undefined },
  { to: "/contato", label: "Contactos", hash: undefined },
];

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />;
  }
  if (user) {
    return (
      <div className="flex items-center gap-2 text-paper">
        <Link
          to="/dashboard"
          className="hidden h-10 items-center rounded-full px-3 text-sm font-semibold text-brass-2 hover:bg-white/10 sm:inline-flex"
        >
          Meus pedidos
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

function AccountMenuLinks({ onClick }: { onClick?: () => void }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || !user) return null;
  return (
    <div className="mt-2 space-y-1 border-t border-white/10 pt-3">
      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brass-2">A sua conta</p>
      <Link
        to="/dashboard"
        onClick={onClick}
        className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-white/5"
      >
        Meus pedidos
      </Link>
      <Link
        to="/admin"
        onClick={onClick}
        className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-white/5"
      >
        Painel admin
      </Link>
      <Link
        to="/conta"
        onClick={onClick}
        className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-white/5"
      >
        Definições da conta
      </Link>
    </div>
  );
}

function NavLink({
  to,
  label,
  hash,
  pathname,
  onClick,
  mobile,
}: {
  to: string;
  label: string;
  hash?: string;
  pathname: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const active = !hash && pathname === to;
  const className = cn(
    mobile ? "rounded-xl px-3 py-3 text-sm font-medium" : "rounded-full px-4 py-2 font-medium transition-colors",
    active ? "bg-brass text-ink" : mobile ? "hover:bg-white/5" : "text-paper/80 hover:bg-white/10 hover:text-paper",
  );

  if (hash) {
    return (
      <a href={`/#${hash}`} onClick={onClick} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={to} onClick={onClick} className={className}>
      {label}
    </Link>
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

        <nav className="hidden items-center gap-1 text-sm lg:flex">
          {NAV.map((item) => (
            <NavLink key={item.label} {...item} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AuthSlot />
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                {...item}
                pathname={pathname}
                mobile
                onClick={() => setOpen(false)}
              />
            ))}
            <AccountMenuLinks onClick={() => setOpen(false)} />
            <div className="mt-3 border-t border-white/10 pt-3 md:hidden">
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
    <footer className="border-t border-white/10 bg-navy text-paper">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <img src="/logo-dmm.svg" alt="DMM" className="h-10 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">
            Ideias que se tornam resultados. Central de serviços em Benguela — pedido, orçamento e
            entrega num só sítio.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-brass-2">SERVIÇOS</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/75">
            <li>Trabalhos académicos</li>
            <li>Design e imagem</li>
            <li>Informática e tecnologia</li>
            <li>Pedidos personalizados</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-brass-2">CONTACTOS</p>
          <ul className="mt-3 space-y-3 text-sm text-paper/80">
            <li className="flex items-center gap-2">
              <MessageCircle size={16} className="text-brass-2" />
              {CONTACT.phoneDisplay}
              <span className="rounded-full bg-good/20 px-2 py-0.5 text-[10px] font-semibold text-good">
                Disponível
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-brass-2" />
              {CONTACT.email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} className="text-brass-2" />
              Benguela, Angola
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-brass-2">ATENDIMENTO</p>
          <p className="mt-3 text-sm leading-relaxed text-paper/75">
            Qualquer zona de Benguela, conforme o serviço. Transferências Express no mesmo número.
          </p>
          <a
            href={whatsappHref("Olá DMM!")}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-brass px-5 text-sm font-bold text-ink"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} DMM — Todos os direitos reservados.
        <span className="mt-1 block text-[11px] text-paper/40">
          Sistema criado por Daniel Menezes Monteiro
        </span>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideFooter = pathname === "/assistente" || pathname.startsWith("/assistente/");
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className={hideFooter ? "pb-0" : undefined}>{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
