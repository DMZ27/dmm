-- Planos de estudo / pesquisa guardados pelo estudante (DMM Estudo Fase 2)
create table if not exists study_plans (
  id text primary key,
  user_id text not null,
  topic text not null,
  area text,
  year_label text,
  work_type text,
  deadline text,
  plan_text text not null,
  links_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists study_plans_user_created_idx
  on study_plans (user_id, created_at desc);
