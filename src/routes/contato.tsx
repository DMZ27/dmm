import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, UserRound } from "lucide-react";
import { CONTACT } from "@/lib/dmm/catalog";
import { whatsappHref } from "@/lib/utils";

export const Route = createFileRoute("/contato")({ component: Contato });

function Contato() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-16">
      <div className="flex items-center gap-2">
        <span className="h-1 w-8 rounded-full bg-brass" />
        <p className="text-xs font-semibold tracking-[0.18em] text-fog uppercase">Contactos</p>
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Fale com a DMM</h1>
      <p className="mt-3 max-w-xl text-fog">
        Atendimento para qualquer zona de Benguela. O canal mais rápido é o WhatsApp; os pedidos formais ficam na central.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: MessageCircle,
            title: "WhatsApp / Express",
            body: CONTACT.phoneDisplay,
            href: whatsappHref("Olá DMM, vim pelo site."),
            badge: "Disponível",
          },
          { icon: Mail, title: "Email", body: CONTACT.email, href: `mailto:${CONTACT.email}` },
          { icon: MapPin, title: "Área", body: CONTACT.city, href: undefined },
          { icon: UserRound, title: "Atelier", body: CONTACT.name, href: undefined },
        ].map((c) => {
          const inner = (
            <>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brass/15 text-brass">
                <c.icon size={20} />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{c.title}</h2>
              <p className="mt-1 text-sm text-fog">{c.body}</p>
              {"badge" in c && c.badge && (
                <span className="mt-2 inline-block rounded-full bg-good/15 px-2 py-0.5 text-[10px] font-semibold text-good">
                  {c.badge}
                </span>
              )}
            </>
          );
          const cls =
            "rounded-[20px] border border-line bg-cream p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]";
          return c.href ? (
            <a
              key={c.title}
              className={cls}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
            >
              {inner}
            </a>
          ) : (
            <div key={c.title} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
