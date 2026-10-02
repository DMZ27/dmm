export const CATEGORIES = [
  {
    id: "academico",
    name: "Trabalhos académicos",
    blurb: "Estrutura, revisão e formatação com normas claras.",
    image: "/images/atelier-secret.jpg",
  },
  {
    id: "design",
    name: "Design e impressão",
    blurb: "Convites, cartazes, logótipos e tratamento de imagem.",
    image: "/images/print-studio.jpg",
  },
  {
    id: "tech",
    name: "Informática e tecnologia",
    blurb: "Sistemas, redes, websites e assistência local.",
    image: "/images/tech-desk.jpg",
  },
  {
    id: "outros",
    name: "Outros serviços",
    blurb: "Impressões, digitalizações e pedidos à medida.",
    image: "/images/mockup-home.webp",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type ServiceSeed = {
  id: string;
  name: string;
  slug: string;
  category: CategoryId;
  description: string;
  details: string;
  sortOrder: number;
};

export const SERVICE_SEEDS: ServiceSeed[] = [
  {
    id: "monografias",
    name: "Monografias e anteprojectos",
    slug: "monografias",
    category: "academico",
    description: "Organização, revisão de estrutura e formatação de trabalhos de fim de curso.",
    details: "Ajudamos a estruturar capítulos, referências e apresentação. O conteúdo académico permanece da sua responsabilidade.",
    sortOrder: 1,
  },
  {
    id: "formatacao-apa-abnt",
    name: "Formatação APA / ABNT",
    slug: "formatacao-apa-abnt",
    category: "academico",
    description: "Normas, margens, citações, capa e lista de referências.",
    details: "Envie o ficheiro e a norma pedida. Devolvemos o documento alinhado com as regras da instituição.",
    sortOrder: 2,
  },
  {
    id: "trabalhos-academicos",
    name: "Trabalhos individuais e em grupo",
    slug: "trabalhos-academicos",
    category: "academico",
    description: "Preparação, revisão e organização de trabalhos com vários membros.",
    details: "Indique tema, disciplina, prazo e os nomes do grupo. O formulário adapta-se ao pedido.",
    sortOrder: 3,
  },
  {
    id: "convites-cartoes",
    name: "Convites e cartões",
    slug: "convites-cartoes",
    category: "design",
    description: "Artes para casamentos, aniversários, eventos e divulgação.",
    details: "Diga o evento, medidas, cores e quantidade. Entrega em ficheiro de impressão ou tratamento digital.",
    sortOrder: 4,
  },
  {
    id: "edicao-fotos",
    name: "Edição de fotografias",
    slug: "edicao-fotos",
    category: "design",
    description: "Cor, recorte, fundo, nitidez e preparação para impressão ou redes.",
    details: "Envie as originais e o resultado pretendido. Trabalhamos JPEG, PNG e TIFF.",
    sortOrder: 5,
  },
  {
    id: "paineis-cartazes",
    name: "Painéis, cartazes e artes",
    slug: "paineis-cartazes",
    category: "design",
    description: "Materiais visuais para parede, rua ou publicação digital.",
    details: "Indique tamanho final, local de uso e textos a incluir.",
    sortOrder: 6,
  },
  {
    id: "configuracao-pc",
    name: "Configuração de computadores",
    slug: "configuracao-pc",
    category: "tech",
    description: "Instalação, limpeza, sistemas e preparação de postos de trabalho.",
    details: "Atendimento em Benguela. Descreva o equipamento e o problema.",
    sortOrder: 7,
  },
  {
    id: "websites-sistemas",
    name: "Websites e sistemas",
    slug: "websites-sistemas",
    category: "tech",
    description: "Sites e ferramentas digitais feitas à medida do seu negócio.",
    details: "Explique o objectivo, páginas necessárias e se já tem domínio ou conteúdos.",
    sortOrder: 8,
  },
  {
    id: "redes-software",
    name: "Redes e software",
    slug: "redes-software",
    category: "tech",
    description: "Redes locais, programas e ambientes de trabalho.",
    details: "Indique o número de equipamentos e o que precisa de ficar a funcionar.",
    sortOrder: 9,
  },
  {
    id: "impressoes-digitalizacoes",
    name: "Impressões e digitalizações",
    slug: "impressoes-digitalizacoes",
    category: "outros",
    description: "Apoio em materiais impressos e digitalização de documentos.",
    details: "Diga formato, cor ou p/b, e quantidade. Podemos orientar a arte antes de imprimir.",
    sortOrder: 10,
  },
];

export const CONTACT = {
  name: "Daniel Menezes Monteiro",
  brand: "DMM",
  slogan: "Ideias que se tornam resultados",
  email: "menezesdaniel451@gmail.com",
  phoneDisplay: "923 078 760",
  phoneDigits: "923078760",
  city: "Benguela, Angola",
  whatsapp: "244923078760",
};

export const MAX_FILE_CHARS = 1_200_000;
export const MAX_FILES_PER_ORDER = 6;
