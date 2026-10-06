export type StudyTemplate = {
  id: string;
  title: string;
  audience: string;
  summary: string;
  /** true = precisa de login para ver o texto completo */
  requiresLogin: boolean;
  body: string;
};

/**
 * Modelos e checklists DMM Estudo (Fase 3).
 * Conteúdo orientador — não substitui o trabalho do estudante.
 */
export const STUDY_TEMPLATES: StudyTemplate[] = [
  {
    id: "checklist-relatorio",
    title: "Checklist — Relatório de cadeira",
    audience: "1.º e 2.º ano",
    summary: "Passos desde o enunciado até à entrega formatada.",
    requiresLogin: false,
    body: `Checklist — Relatório de cadeira (DMM Estudo)

1. Ler o enunciado e marcar: objectivo, páginas mínimas, norma (APA/ABNT), prazo.
2. Definir o tema em uma frase clara.
3. Pesquisar 5–10 fontes (Google Académico, SciELO, manuais da disciplina).
4. Esboçar estrutura: introdução, desenvolvimento (2–4 secções), conclusão, referências.
5. Escrever rascunho sem formatar em excesso.
6. Rever argumentação e citações (cada ideia que não é tua leva fonte).
7. Aplicar norma: margens, fonte, espaçamento, capa se pedida.
8. Lista de referências só com obras realmente usadas.
9. Releitura em voz alta; corrigir erros ortográficos.
10. Exportar PDF e guardar versão com data no nome do ficheiro.

Nota DMM: se precisares de formatação final ou revisão de estrutura, usa os serviços académicos no site.`,
  },
  {
    id: "estrutura-monografia",
    title: "Estrutura-tipo — Monografia / PFC",
    audience: "Finalistas",
    summary: "Capítulos habituais e o que cada um deve conter (orientação).",
    requiresLogin: true,
    body: `Estrutura-tipo — Monografia / Projecto de fim de curso (orientação DMM)

Capa e preliminares (conforme a instituição)
- Capa, folha de rosto, dedicatória (opcional), agradecimentos (opcional)
- Resumo / abstract
- Lista de abreviaturas (se necessário)
- Índice

1. Introdução
- Contexto e relevância do tema
- Problema ou pergunta de investigação
- Objectivos geral e específicos
- Justificativa breve
- Estrutura do trabalho (mapa dos capítulos)

2. Revisão da literatura / enquadramento teórico
- Conceitos-chave
- Trabalhos e autores relevantes
- Lacuna que o teu trabalho aborda

3. Metodologia
- Tipo de estudo (quantitativo, qualitativo, misto, projecto técnico, etc.)
- Dados, ferramentas, procedimentos
- Critérios éticos se aplicável

4. Desenvolvimento / resultados
- Em projectos de computação/engenharia: análise, desenho, implementação, testes
- Em trabalhos teóricos: discussão organizada por temas

5. Conclusão
- Resposta aos objectivos
- Limitações
- Trabalho futuro

Referências (norma da faculdade)
Anexos (código, questionários, capturas — se pedido)

A DMM pode ajudar na organização dos capítulos e na formatação APA/ABNT. O conteúdo e a originalidade são do estudante.`,
  },
  {
    id: "plano-semana",
    title: "Plano de estudo — 7 dias",
    audience: "Todos os anos",
    summary: "Grelha semanal para combinar aulas, estudo e entregas.",
    requiresLogin: false,
    body: `Plano de estudo — 7 dias (modelo DMM)

Como usar: copia a grelha e preenche com as tuas disciplinas e prazos.

Segunda — Foco: _____________
- Bloco 1 (50 min):
- Bloco 2 (50 min):
- Entrega / tarefa:

Terça — Foco: _____________
- Bloco 1:
- Bloco 2:
- Revisão rápida do dia anterior:

Quarta — Foco: _____________
- Bloco 1:
- Bloco 2:
- Pesquisa / fontes:

Quinta — Foco: _____________
- Bloco 1:
- Bloco 2:
- Escrita / exercícios:

Sexta — Foco: _____________
- Bloco 1:
- Bloco 2:
- Preparar o que falta ao fim-de-semana:

Sábado — Bloco longo (2–3 h) ou descanso activo
Domingo — Revisão leve (1 h) + planear a semana seguinte

Regra: no máximo 3 prioridades académicas por dia.
Se um prazo urgente aparecer, corta o menos importante — não aumentes o caos.`,
  },
  {
    id: "citacoes-etica",
    title: "Citar sem plagiar — guia rápido",
    audience: "Todos os anos",
    summary: "Quando citar, parafrasear e o que não fazer.",
    requiresLogin: false,
    body: `Citar sem plagiar — guia rápido (DMM Estudo)

Deves citar quando:
- Usas dados, teorias ou conclusões de outra pessoa
- Parasfraseias ideias que não são do senso comum da disciplina
- Incluis citação directa (frase entre aspas)

Parafrasear bem:
- Lê a fonte, fecha o texto, escreve com as tuas palavras
- Mesmo assim, indica a fonte (autor, ano)
- Não troques só 2–3 palavras ao texto original

Citação directa:
- Usa com moderação
- Aspas + referência completa conforme APA ou ABNT da tua faculdade

Nunca:
- Copiar trabalhos de colegas ou da internet sem citação
- Inventar referências
- Entregar texto gerado por IA como se fosse só teu, se a instituição proibir

Em dúvida: cita. É preferível citar a mais do que a menos.`,
  },
  {
    id: "defesa-checklist",
    title: "Checklist — Preparar a defesa",
    audience: "Finalistas",
    summary: "O que rever nas duas semanas antes da apresentação.",
    requiresLogin: true,
    body: `Checklist — Preparar a defesa (orientação DMM)

14–10 dias antes
- Releer monografia completa de uma vez
- Listar 10 perguntas difíceis que o júri pode fazer
- Confirmar tempo máximo da apresentação

7–5 dias antes
- Esboçar slides: problema → objectivos → método → resultados → conclusão
- Ensaiar em voz alta com relógio
- Preparar demonstração (software/hardware) se aplicável

3–2 dias antes
- Corrigir slides (pouco texto, figuras legíveis)
- Ensaiar com um colega ou gravar o telemóvel
- Imprimir ou PDF de segurança da monografia

Dia anterior
- Dormir; não reescrever capítulos inteiros
- Separar pen / link / notebook carregado

Dia da defesa
- Chegar cedo; testar projector
- Ouvir as perguntas até ao fim antes de responder

A DMM pode apoiar formatação final e revisão de estrutura; a defesa oral é tua.`,
  },
  {
    id: "trabalho-grupo",
    title: "Trabalho de grupo — organização",
    audience: "1.º ao 4.º ano",
    summary: "Divisão de tarefas e minimização de conflitos.",
    requiresLogin: true,
    body: `Trabalho de grupo — organização (DMM Estudo)

1. Nomear responsável de prazo (uma pessoa).
2. Escrever num sítio único (doc partilhado) o enunciado e a data de entrega.
3. Dividir secções por nome e data intermédia.
4. Reunião curta (20–30 min) 2 vezes por semana no máximo.
5. Um estilo de formatação comum desde o início (fonte, margens, norma).
6. Dois dias antes: juntar tudo e rever só inconsistências.
7. Um dia antes: exportar PDF final e todos confirmam que leram.

Evitar:
- “Eu faço na véspera”
- Cinco versões do mesmo ficheiro no WhatsApp sem nome claro

Modelo de nome de ficheiro:
GrupoX_Disciplina_Tema_v3_2026-03-10.docx`,
  },
];

export function getTemplate(id: string): StudyTemplate | undefined {
  return STUDY_TEMPLATES.find((t) => t.id === id);
}
