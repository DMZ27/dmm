import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({ component: Termos });

function Termos() {
  return (
    <article className="mx-auto w-full max-w-[720px] px-4 py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-wait">DMM</p>
      <h1 className="mt-2 font-display text-4xl">Termos de serviço</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/80">
        <p>
          A DMM aceita pedidos de formatação, revisão estrutural, design, informática e serviços associados em Benguela. O conteúdo académico original é sempre da responsabilidade do cliente.
        </p>
        <h2 className="font-display text-2xl text-ink">Orçamento e pagamento</h2>
        <p>
          O trabalho avança após acordo do orçamento. Pagamentos por Transferência Express para o número publicado no site. Envie o comprovativo no próprio pedido.
        </p>
        <h2 className="font-display text-2xl text-ink">Prazos e revisões</h2>
        <p>
          O prazo e o número de revisões constam do orçamento. Atrasos por falta de informação do cliente não contam contra a DMM.
        </p>
        <h2 className="font-display text-2xl text-ink">Ficheiros</h2>
        <p>
          O cliente garante ter direito a enviar os materiais. A DMM não publica esses ficheiros e entrega o resultado apenas na conta do pedido.
        </p>
        <p className="text-fog">Texto-base: deve ser revisto juridicamente antes de um lançamento comercial.</p>
      </div>
    </article>
  );
}
