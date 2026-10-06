import { createServerFn } from "@tanstack/react-start";
import { chatLLM, type ChatMessage } from "@/lib/ai/llm";

const SYSTEM_ESTUDO = `És o orientador de estudo da DMM (Benguela, Angola), para estudantes do ensino superior.

Missão:
- ajudar a planear pesquisa académica e produtividade escolar;
- dar palavras-chave em português e inglês;
- indicar como usar Google Académico, SciELO e repositórios;
- propor estrutura de trabalho e plano de estudo realista;
- NUNCA escrever o trabalho completo para o aluno entregar como seu;
- NUNCA inventar artigos, DOIs ou páginas de livros.

Estilo:
- Português de Angola/Portugal, claro e directo;
- parágrafos curtos; listas com hífen quando útil;
- sem markdown pesado (#, blocos de código) e sem linhas decorativas (---);
- máximo de objectividade para o estudante agir hoje.

Quando o pedido for um plano de pesquisa, organiza a resposta assim:
1) Compreensão do tema (2-3 frases)
2) Palavras-chave (PT e EN)
3) Onde pesquisar (Google Académico, SciELO, etc.) e o que escrever na caixa de pesquisa
4) Estrutura sugerida do trabalho (secções)
5) Plano de 3 a 7 dias (ou horas, se for urgente)
6) Cuidados éticos (citar fontes, não copiar)

No fim, podes lembrar que a DMM ajuda com formatação APA/ABNT e revisão de estrutura.`;

export type StudyPlanInput = {
  topic: string;
  area?: string;
  year?: string;
  workType?: string;
  deadline?: string;
};

/**
 * Público (sem login): gera plano de pesquisa / estudo a partir do tema.
 * Fase 1 do DMM Estudo.
 */
export const aiStudyPlan = createServerFn({ method: "POST" })
  .validator((input: StudyPlanInput) => input)
  .handler(async ({ data }) => {
    const topic = String(data.topic || "").trim().slice(0, 300);
    if (topic.length < 3) throw new Error("Escreve o tema do trabalho (mínimo 3 caracteres).");

    const area = String(data.area || "").trim().slice(0, 80);
    const year = String(data.year || "").trim().slice(0, 40);
    const workType = String(data.workType || "").trim().slice(0, 80);
    const deadline = String(data.deadline || "").trim().slice(0, 80);

    const userBlock = [
      `Tema: ${topic}`,
      area ? `Área / curso: ${area}` : null,
      year ? `Ano do curso: ${year}` : null,
      workType ? `Tipo de trabalho: ${workType}` : null,
      deadline ? `Prazo: ${deadline}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_ESTUDO },
      {
        role: "user",
        content: `Elabora um plano de pesquisa e estudo para este pedido de um estudante em Angola:\n\n${userBlock}`,
      },
    ];

    const reply = await chatLLM(messages);

    // Links de pesquisa prontos (não dependem da IA inventar URLs)
    const q = encodeURIComponent(topic);
    const qEn = encodeURIComponent(topic); // o estudante pode refinar com keywords EN da resposta
    const links = [
      {
        name: "Google Académico",
        url: `https://scholar.google.com/scholar?q=${q}`,
        hint: "Artigos e citações — usa também as palavras-chave em inglês da resposta",
      },
      {
        name: "SciELO",
        url: `https://search.scielo.org/?q=${q}`,
        hint: "Artigos em português e espanhol, acesso aberto",
      },
      {
        name: "Google (PDF académicos)",
        url: `https://www.google.com/search?q=${q}+filetype%3Apdf`,
        hint: "Útil para relatórios e teses em PDF; confirma sempre a fonte",
      },
      {
        name: "ResearchGate (pesquisa)",
        url: `https://www.researchgate.net/search/publication?q=${qEn}`,
        hint: "Muitos autores respondem a pedidos de texto integral",
      },
    ];

    return { reply, links, topic };
  });
