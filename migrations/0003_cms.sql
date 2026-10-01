-- Destaques / publicidade na homepage (imagem + título + link externo, ex. vídeo)
create table if not exists highlights (
  id text primary key,
  title text not null,
  subtitle text,
  image_url text,
  link_url text,
  link_label text not null default 'Ver mais',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists highlights_active_sort_idx on highlights (active, sort_order);

-- Mini-blog / artigos
create table if not exists articles (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_published_idx on articles (published, created_at desc);
