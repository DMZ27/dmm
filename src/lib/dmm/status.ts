export const ORDER_STATUSES = [
  "RECEIVED",
  "ANALYSIS",
  "QUOTED",
  "PAYMENT_PENDING",
  "IN_PRODUCTION",
  "WAITING_INFO",
  "COMPLETED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_META: Record<
  OrderStatus,
  { label: string; hint: string; tone: "neutral" | "brass" | "good" | "wait" | "bad" }
> = {
  RECEIVED: { label: "Pedido recebido", hint: "Chegou à central DMM.", tone: "neutral" },
  ANALYSIS: { label: "Em análise", hint: "Estamos a ler o briefing e os anexos.", tone: "wait" },
  QUOTED: { label: "Orçamento enviado", hint: "Revise o valor e o prazo.", tone: "brass" },
  PAYMENT_PENDING: { label: "Pagamento pendente", hint: "Envie o comprovativo Express.", tone: "wait" },
  IN_PRODUCTION: { label: "Em produção", hint: "O trabalho está a ser feito.", tone: "brass" },
  WAITING_INFO: { label: "Aguardando informações", hint: "Falta um detalhe seu para avançar.", tone: "wait" },
  COMPLETED: { label: "Concluído", hint: "Pronto para entrega.", tone: "good" },
  DELIVERED: { label: "Entregue", hint: "Ficheiro final disponível.", tone: "good" },
  CANCELLED: { label: "Cancelado", hint: "Este pedido foi encerrado.", tone: "bad" },
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
