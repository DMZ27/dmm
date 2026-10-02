import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { chatLLM, type ChatMessage } from "@/lib/ai/llm";

const SYSTEM_ASSISTANT = `És o assistente oficial da DMM (Central de Serviços em Benguela, Angola).

Missão:
- esclarecer serviços da DMM (trabalhos académicos, design, informática);
- apoio académico ético (estrutura, formatação APA/ABNT, método) — nunca entregues trabalhos completos para o aluno apresentar como seus;
- orientação para currículos e apresentação profissional.

Estilo de resposta (obrigatório):
- Português de Angola/Portugal, tom moderno, claro e profissional.
- Frases curtas ou médias; parágrafos curtos (2–4 linhas).
- Usa listas com hífen ou números só quando ajudam a ler.
- NÃO uses linhas decorativas (---, ===, ___), caixas ASCII, tabelas feitas com caracteres, nem "figura X" / "tabela Y" inventadas.
- NÃO uses markdown pesado (títulos com #, blocos de código) salvo se o utilizador pedir código.
- Quando comparares opções, escreve em texto corrido ou lista simples, sem grelhas ASCII.
- Se precisares de destacar um ponto, usa uma frase directa — não um banner de símbolos.
- Se não souberes algo da DMM, indica o WhatsApp 923 078 760.`;

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
    const messages: ChatMessage[] = [{ role: "system", content: SYSTEM_ASSISTANT }, ...history];
    const reply = await chatLLM(messages);
    return { reply };
  });

export const aiChatPdf = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      question: string;
      /** Texto já extraído do PDF (cliente ou servidor) */
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
        content: `Gera o conteúdo do currículo em JSON com chaves: summary (string), experience (string com bullets separados por \\n), education (string), skills (string). Dados:\n${JSON.stringify(payload, null, 2)}`,
      },
    ];
    const reply = await chatLLM(messages);
    // try parse JSON from reply
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
    // limite ~4MB base64
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
