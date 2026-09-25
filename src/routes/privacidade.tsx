import { createFileRoute } from "@tanstack/react-router";
import { CONTACT } from "@/lib/dmm/catalog";

export const Route = createFileRoute("/privacidade")({ component: Privacidade });

function Privacidade() {
  return (
    <article className="mx-auto w-full max-w-[720px] px-4 py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-wait">DMM</p>
      <h1 className="mt-2 font-display text-4xl">Política de privacidade</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/80">
        <p>
          Recolhemos apenas o necessário para criar contas, processar pedidos, comunicar, emitir orçamentos e entregar ficheiros.
        </p>
        <h2 className="font-display text-2xl text-ink">Ficheiros</h2>
        <p>
          Os anexos ficam ligados ao pedido e só podem ser descarregados pelo cliente dono ou pela administração DMM. Não servimos documentos como ficheiros públicos.
        </p>
        <h2 className="font-display text-2xl text-ink">Retenção</h2>
        <p>
          Guardamos os materiais pelo tempo necessário à prestação do serviço e a um suporte posterior razoável. Depois podem ser eliminados.
        </p>
        <h2 className="font-display text-2xl text-ink">Contacto</h2>
        <p>
          {CONTACT.email} · {CONTACT.phoneDisplay}
        </p>
        <p className="text-fog">Texto-base: deve ser revisto juridicamente antes de um lançamento comercial.</p>
      </div>
    </article>
  );
}
