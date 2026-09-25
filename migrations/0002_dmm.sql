create table if not exists profiles (
  user_id text primary key,
  name text not null,
  email text,
  phone text,
  city text default 'Benguela',
  role text not null default 'CLIENT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id text primary key,
  name text not null,
  slug text unique not null,
  category text not null,
  description text not null,
  details text not null,
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists orders (
  id text primary key,
  code serial unique,
  user_id text not null,
  service_id text not null references services(id),
  title text not null,
  description text,
  form_data jsonb,
  status text not null default 'RECEIVED',
  quoted_price numeric(12,2),
  deadline date,
  revisions int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_at_idx on orders (created_at desc);

create table if not exists order_files (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  user_id text not null,
  name text not null,
  mime_type text,
  size_bytes int,
  kind text not null default 'INPUT',
  data_base64 text,
  created_at timestamptz not null default now()
);
create index if not exists order_files_order_idx on order_files (order_id);

create table if not exists messages (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  user_id text not null,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_order_idx on messages (order_id, created_at);

create table if not exists quotes (
  id text primary key,
  order_id text unique not null references orders(id) on delete cascade,
  price numeric(12,2) not null,
  deadline date not null,
  revisions int not null default 1,
  note text,
  created_at timestamptz not null default now()
);

insert into services (id, name, slug, category, description, details, sort_order, active) values
  ('monografias', 'Monografias e anteprojectos', 'monografias', 'academico', 'Organização, revisão de estrutura e formatação de trabalhos de fim de curso.', 'Ajudamos a estruturar capítulos, referências e apresentação. O conteúdo académico permanece da sua responsabilidade.', 1, true),
  ('formatacao-apa-abnt', 'Formatação APA / ABNT', 'formatacao-apa-abnt', 'academico', 'Normas, margens, citações, capa e lista de referências.', 'Envie o ficheiro e a norma pedida. Devolvemos o documento alinhado com as regras da instituição.', 2, true),
  ('trabalhos-academicos', 'Trabalhos individuais e em grupo', 'trabalhos-academicos', 'academico', 'Preparação, revisão e organização de trabalhos com vários membros.', 'Indique tema, disciplina, prazo e os nomes do grupo. O formulário adapta-se ao pedido.', 3, true),
  ('convites-cartoes', 'Convites e cartões', 'convites-cartoes', 'design', 'Artes para casamentos, aniversários, eventos e divulgação.', 'Diga o evento, medidas, cores e quantidade. Entrega em ficheiro de impressão ou tratamento digital.', 4, true),
  ('edicao-fotos', 'Edição de fotografias', 'edicao-fotos', 'design', 'Cor, recorte, fundo, nitidez e preparação para impressão ou redes.', 'Envie as originais e o resultado pretendido. Trabalhamos JPEG, PNG e TIFF.', 5, true),
  ('paineis-cartazes', 'Painéis, cartazes e artes', 'paineis-cartazes', 'design', 'Materiais visuais para parede, rua ou publicação digital.', 'Indique tamanho final, local de uso e textos a incluir.', 6, true),
  ('configuracao-pc', 'Configuração de computadores', 'configuracao-pc', 'tech', 'Instalação, limpeza, sistemas e preparação de postos de trabalho.', 'Atendimento em Benguela. Descreva o equipamento e o problema.', 7, true),
  ('websites-sistemas', 'Websites e sistemas', 'websites-sistemas', 'tech', 'Sites e ferramentas digitais feitas à medida do seu negócio.', 'Explique o objectivo, páginas necessárias e se já tem domínio ou conteúdos.', 8, true),
  ('redes-software', 'Redes e software', 'redes-software', 'tech', 'Redes locais, programas e ambientes de trabalho.', 'Indique o número de equipamentos e o que precisa de ficar a funcionar.', 9, true),
  ('impressoes-digitalizacoes', 'Impressões e digitalizações', 'impressoes-digitalizacoes', 'outros', 'Apoio em materiais impressos e digitalização de documentos.', 'Diga formato, cor ou p/b, e quantidade. Podemos orientar a arte antes de imprimir.', 10, true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  category = excluded.category,
  description = excluded.description,
  details = excluded.details,
  sort_order = excluded.sort_order,
  active = excluded.active;
