import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/dmm/catalog";
import { whatsappHref } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/esqueci-senha")({ component: EsqueciSenha });

function EsqueciSenha() {
  const msg =
    "Olá DMM, esqueci a senha da minha conta no site. O meu email é: ";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1180px] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-cream p-7 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold tracking-[0.18em] text-wait">RECUPERAR ACESSO</p>
        <h1 className="mt-2 font-display text-3xl">Esqueci a senha</h1>
        <p className="mt-4 text-sm leading-relaxed text-fog">
          Para recuperar o acesso, contacte a DMM pelo WhatsApp e indique o{" "}
          <strong className="text-ink">email da conta</strong>. A equipa confirma a identidade e
          define uma senha temporária para voltar a entrar.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-fog">
          <li>Diga o email com que se registou</li>
          <li>Se possível, o número de WhatsApp da conta</li>
          <li>Receberá uma senha nova para entrar e pode alterá-la depois</li>
        </ul>
        <a
          href={whatsappHref(msg)}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brass text-sm font-bold text-ink transition hover:bg-brass-2"
        >
          <MessageCircle size={18} />
          WhatsApp {CONTACT.phoneDisplay}
        </a>
        <p className="mt-6 text-center text-sm text-fog">
          <Link to="/login" className="font-semibold text-ink">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}