import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { chatLLM, type ChatMessage } from "@/lib/ai/llm";
import { listServices, createOrder, listMyOrders } from "@/lib/dmm/server";
import { STATUS_META, type OrderStatus } from "@/lib/dmm/status";
import { CATEGORIES } from "@/lib/dmm/catalog";

/** Constrói o texto com a lista real de serviços para injectar no system prompt */
async function buildServicesContext(): Promise<string> {
  try {
    const services = await listServices();
    if (!services || services.length === 0) {
      return "Lista de serviços temporariamente indisponível.";
    }

    const byCat: Record<string, typeof services> = {};
    for (const s of services) {
      if (!byCat[s.category]) byCat[s.category] = [];
      byCat[s.category].push(s);
    }

    let text = "SERVIÇOS REAIS DA DMM (usa sempre estes nomes e o id exacto):\n\n";

    for (const cat of CATEGORIES) {
      const list = byCat[cat.id];
      if (!list || list.length === 0) continue;

      text += `${cat.name.toUpperCase()}:\n`;
      for (const s of list) {
        text += `- id: "${s.id}" | ${s.name}: ${s.description}\n  Detalhes: ${s.details}\n`;
      }
      text += "\n";
    }

    return text.trim();
  } catch {
    return "Não foi possível carregar a lista de serviços neste momento.";
  }
}

/** Constrói resumo dos pedidos do utilizador logado (só os dele) */
async function buildOrdersContext(): Promise<string> {
  try {
    const orders = await listMyOrders();
    if (!orders || orders.length === 0) {
      return "PEDIDOS DO CLIENTE: Ainda não tem nenhum pedido registado.";
    }

    // Limita aos 8 mais recentes para não explodir o prompt
    const recent = orders.slice(0, 8);
    let text = "PEDIDOS DESTE CLIENTE (só podes falar destes — nunca de outros clientes):\n\n";

    for (const o of recent) {
      const statusLabel =
        STATUS_META[o.status as OrderStatus]?.label || o.status;
      const deadline = o.deadline ? ` | Prazo: ${o.deadline}` : "";
      const price = o.quoted_price ? ` | Orçamento: ${o.quoted_price}` : "";
      text += `- Pedido #${o.code} | ${o.service_name} | "${o.title}" | Estado: ${statusLabel}${deadline}${price}\n`;
    }

    if (orders.length > 8) {
      text += `\n(Existem mais ${orders.length - 8} pedidos antigos. Se precisar de um específico, peça o número.)\n`;
    }

    return text.trim();
  } catch {
    return "Não foi possível carregar os pedidos do cliente neste momento.";
  }
}



const SYSTEM_ASSISTANT_BASE = `És o assistente oficial da DMM (Central de Serviços em Benguela, Angola).

Missão:
- esclarecer os serviços reais da DMM (usa sempre a lista fornecida abaixo);
- ajudar o cliente a escolher o serviço certo através de perguntas guiadas;
- recolher os dados necessários e criar a encomenda quando o cliente confirmar;
- informar o cliente sobre o estado dos SEUS pedidos (usa só a lista de pedidos fornecida);
- apoio académico ético (estrutura, formatação APA/ABNT, método) — nunca entregues trabalhos completos para o aluno apresentar como seus;
- orientação para currículos e apresentação profissional.

SOBRE OS PEDIDOS DO CLIENTE:
- Só podes falar dos pedidos que aparecem na secção "PEDIDOS DESTE CLIENTE".
- Nunca inventes números de pedido, estados ou preços.
- Se o cliente perguntar "como está o meu pedido?" e tiver mais do que um, pergunta qual o número (#) ou mostra a lista resumida.
- Se não tiver pedidos, diz isso claramente e oferece ajuda para criar um.
- Nunca reveles informação de outros clientes.

COMO AJUDAR A ESCOLHER (perguntas guiadas):
Quando o cliente não souber exactamente o que precisa, ou disser coisas vagas como "preciso de ajuda", "quero um trabalho", "preciso de design", segue este fluxo:

1. Pergunta o objectivo principal (ex: "É para a faculdade, para um evento, ou para o teu negócio/computador?").
2. Pergunta o prazo aproximado (ex: "Tens uma data limite?").
3. Pergunta o tipo de entrega que prefere (ficheiro digital, impressão, ou os dois).
4. Com base nas respostas, recomenda 1 ou 2 serviços concretos da lista real e explica porquê em 2-3 frases.
5. Pergunta se quer que prepares a encomenda.

COMO CRIAR A ENCOMENDA:
Quando o cliente confirmar que quer encomendar (ex: "sim", "pode criar", "quero encomendar", "vamos"), recolhe estes 3 dados:
- serviceId (o id exacto da lista, ex: "monografias")
- title (título curto do pedido, 5-80 caracteres)
- description (descrição do que precisa, prazo, detalhes)

Quando tiveres os 3 dados e o cliente confirmar, responde EXACTAMENTE neste formato (nada mais depois do bloco):

---PEDIDO---
{"serviceId":"ID_AQUI","title":"TÍTULO AQUI","description":"DESCRIÇÃO AQUI"}
---FIM---

Regras importantes:
- Só usa o bloco ---PEDIDO--- quando tiveres os 3 campos e o cliente tiver confirmado.
- Nunca inventes um serviceId que não exista na lista.
- O title deve ser claro e curto.
- A description deve incluir prazo e detalhes importantes que o cliente disse.
- Antes de emitir o bloco, podes escrever uma frase curta tipo "Perfeito, vou criar o teu pedido agora."

Estilo de resposta (obrigatório):
- Português de Angola/Portugal, tom moderno, claro e profissional.
- Frases curtas ou médias; parágrafos curtos (2–4 linhas).
- Usa listas com hífen ou números só quando ajudam a ler.
- NÃO uses linhas decorativas (---, ===, ___), caixas ASCII, tabelas feitas com caracteres, nem "figura X" / "tabela Y" inventadas — EXCEPTO o bloco ---PEDIDO--- / ---FIM--- que é obrigatório para criar a encomenda.
- NÃO uses markdown pesado (títulos com #, blocos de código) salvo se o utilizador pedir código.
- Quando comparares opções, escreve em texto corrido ou lista simples, sem grelhas ASCII.
- Se não souberes algo da DMM, indica o WhatsApp 923 078 760.
`;

const SYSTEM_PDF = `És um assistente que responde com base no texto de um documento PDF.

Regras de conteúdo:
- Baseia-te sobretudo no documento; se não estiver no texto, diz com honestidade.
- Português claro; podes resumir, explicar e indicar secções.
- Não inventes citações, páginas ou dados que não apareçam no texto.

Estilo (obrigatório):
- Texto moderno e profissional, parágrafos curtos.
- Listas simples quando útil.
- Proibido: linhas --- / ===, tabelas ASCII, molduras de caracteres, placeholders do tipo "[figura]" ou "Tabela 1: ...".
- Escreve como num relatório limpo, não como num documento técnico antigo.`;

const SYSTEM_CV = `És um redator de currículos profissionais.

Com os dados do candidato, produz:
1) Resumo profissional (4–6 linhas, tom confiante e moderno);
2) Experiência com bullets claros (resultados quando possível);
3) Formação e competências bem organizadas.

Regras:
- Português de Angola/Portugal; não inventes empregos, datas nem diplomas.
- Sem linhas decorativas, tabelas ASCII ou símbolos de preenchimento.
- Linguagem actual de RH, sem frases vazias cliché em excesso.`;

export const aiChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { messages: { role: "user" | "assistant"; content: string }[] }) => input)
  .handler(async ({ data }) => {
    const history = (data.messages || []).slice(-12).map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content || "").slice(0, 8000),
    }));
    if (!history.length) throw new Error("Escreva uma mensagem.");

    const [servicesContext, ordersContext] = await Promise.all([
      buildServicesContext(),
      buildOrdersContext(),
    ]);
    const systemPrompt = `${SYSTEM_ASSISTANT_BASE}\n\n${servicesContext}\n\n${ordersContext}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history,
    ];
    const reply = await chatLLM(messages);
    return { reply };
  });

/** Cria o pedido a partir dos dados recolhidos pelo assistente */
export const aiCreateOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { serviceId: string; title: string; description?: string }) => input,
  )
  .handler(async ({ data }) => {
    const result = await createOrder({
      data: {
        serviceId: data.serviceId,
        title: data.title,
        description: data.description || "",
      },
    });
    return result;
  });

export const aiChatPdf = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      question: string;
      documentText: string;
      documentName?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const question = String(data.question || "").trim().slice(0, 2000);
    const doc = String(data.documentText || "").trim().slice(0, 24000);
    if (!question) throw new Error("Escreva a pergunta.");
    if (doc.length < 20) throw new Error("Documento vazio ou ilegível. Tente outro PDF (com texto, não só imagem).");
    const name = (data.documentName || "documento.pdf").slice(0, 120);
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PDF },
      {
        role: "user",
        content: `Documento: ${name}\n\n---\n${doc}\n---\n\nPergunta: ${question}`,
      },
    ];
    const reply = await chatLLM(messages);
    return { reply };
  });

export const aiGenerateCv = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      fullName: string;
      email?: string;
      phone?: string;
      city?: string;
      targetRole?: string;
      summary?: string;
      experience?: string;
      education?: string;
      skills?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const fullName = String(data.fullName || "").trim();
    if (fullName.length < 2) throw new Error("Indique o nome completo.");
    const payload = {
      fullName,
      email: data.email || "",
      phone: data.phone || "",
      city: data.city || "Benguela",
      targetRole: data.targetRole || "",
      summary: data.summary || "",
      experience: data.experience || "",
      education: data.education || "",
      skills: data.skills || "",
    };
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_CV },
      {
        role: "user",
        content: `Dados do candidato:\n${JSON.stringify(payload, null, 2)}\n\nGera o currículo em JSON com as chaves: summary, experience, education, skills.`,
      },
    ];
    const reply = await chatLLM(messages);

    let summary = payload.summary;
    let experience = payload.experience;
    let education = payload.education;
    let skills = payload.skills;
    try {
      const match = reply.match(/\{[\s\S]*\}/);
      if (match) {
        const j = JSON.parse(match[0]) as Record<string, string>;
        summary = j.summary || summary;
        experience = j.experience || experience;
        education = j.education || education;
        skills = j.skills || skills;
      } else {
        summary = reply;
      }
    } catch {
      summary = reply;
    }
    return {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      city: payload.city,
      targetRole: payload.targetRole,
      summary,
      experience,
      education,
      skills,
    };
  });

/** Chat com PDF: envia base64 do ficheiro; extrai texto no servidor (pdf-parse). */
export const aiChatPdfFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { question: string; fileBase64: string; fileName?: string }) => input,
  )
  .handler(async ({ data }) => {
    const question = String(data.question || "").trim().slice(0, 2000);
    if (!question) throw new Error("Escreva a pergunta.");
    const b64 = String(data.fileBase64 || "").replace(/^data:application\/pdf;base64,/, "");
    if (b64.length < 100) throw new Error("Ficheiro PDF inválido.");
    if (b64.length > 5_500_000) throw new Error("PDF demasiado grande (máx. ~4 MB).");

    const buffer = Buffer.from(b64, "base64");
    let documentText = "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = (await import("pdf-parse")).default as (b: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      documentText = (parsed.text || "").replace(/\s+/g, " ").trim();
    } catch {
      throw new Error(
        "Não foi possível ler o PDF. Instale a dependência pdf-parse (npm i pdf-parse) ou use um PDF com texto seleccionável.",
      );
    }
    if (documentText.length < 20) {
      throw new Error("Não há texto legível neste PDF (pode ser só imagens/scanners).");
    }

    const name = (data.fileName || "documento.pdf").slice(0, 120);
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PDF },
      {
        role: "user",
        content: `Documento: ${name}\n\n---\n${documentText.slice(0, 24000)}\n---\n\nPergunta: ${question}`,
      },
    ];
    const reply = await chatLLM(messages);
    return { reply, chars: documentText.length };
  });
