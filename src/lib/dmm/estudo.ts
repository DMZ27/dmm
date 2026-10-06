import { createServerFn } from "@tanstack/react-start";
import { chatLLM, type ChatMessage } from "@/lib/ai/llm";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

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

export type StudyLink = { name: string; url: string; hint: string };

export type StudyPlanRow = {
  id: string;
  topic: string;
  area: string | null;
  year_label: string | null;
  work_type: string | null;
  deadline: string | null;
  plan_text: string;
  links_json: StudyLink[] | null;
  created_at: string;
};

function buildSearchLinks(topic: string): StudyLink[] {
  const q = encodeURIComponent(topic);
  return [
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
      url: `https://www.researchgate.net/search/publication?q=${q}`,
      hint: "Muitos autores respondem a pedidos de texto integral",
    },
  ];
}

/**
 * Público (sem login): gera plano de pesquisa / estudo a partir do tema.
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
    const links = buildSearchLinks(topic);

    return { reply, links, topic };
  });

/** Lista planos guardados do utilizador logado */
export const listMyStudyPlans = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    try {
      return await sql<StudyPlanRow>`
        select id, topic, area, year_label, work_type, deadline, plan_text,
               links_json, created_at::text as created_at
        from study_plans
        where user_id = ${context.userId}
        order by created_at desc
        limit 30
      `;
    } catch {
      // tabela ainda não migrada
      return [] as StudyPlanRow[];
    }
  });

/** Guarda um plano na conta do estudante */
export const saveStudyPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      topic: string;
      area?: string;
      year?: string;
      workType?: string;
      deadline?: string;
      planText: string;
      links?: StudyLink[];
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const topic = String(data.topic || "").trim().slice(0, 300);
    const planText = String(data.planText || "").trim().slice(0, 20000);
    if (topic.length < 3) throw new Error("Tema inválido.");
    if (planText.length < 20) throw new Error("Plano vazio.");

    // Limite gratuito: 15 planos guardados (empura organização / serviços DMM)
    try {
      const counts = await sql<{ n: number }>`
        select count(*)::int as n from study_plans where user_id = ${context.userId}
      `;
      if ((counts[0]?.n ?? 0) >= 15) {
        throw new Error(
          "Atingiste o limite de 15 planos guardados no plano gratuito. Apaga alguns ou contacta a DMM para apoio académico completo.",
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("15 planos")) throw e;
      // se a tabela falhar, deixa tentar o insert
    }

    const id = crypto.randomUUID();
    const area = (data.area || "").trim().slice(0, 80) || null;
    const year_label = (data.year || "").trim().slice(0, 40) || null;
    const work_type = (data.workType || "").trim().slice(0, 80) || null;
    const deadline = (data.deadline || "").trim().slice(0, 80) || null;
    const linksJson = JSON.stringify(data.links || []);

    await sql`
      insert into study_plans (
        id, user_id, topic, area, year_label, work_type, deadline, plan_text, links_json
      ) values (
        ${id}, ${context.userId}, ${topic}, ${area}, ${year_label}, ${work_type},
        ${deadline}, ${planText}, ${linksJson}::jsonb
      )
    `;

    return { ok: true as const, id };
  });

/** Apaga um plano próprio */
export const deleteStudyPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = String(data.id || "").trim();
    if (!id) throw new Error("Plano inválido.");
    await sql`
      delete from study_plans where id = ${id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });
