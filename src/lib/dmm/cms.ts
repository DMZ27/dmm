import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

type Sql = Awaited<ReturnType<typeof getSql>>;

export type Highlight = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string;
  sort_order: number;
  active: boolean;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

async function requireAdminUser(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    select role from profiles where user_id = ${userId}
  `;
  if (!rows[0] || rows[0].role !== "ADMIN") throw new Error("FORBIDDEN");
  return sql;
}

function slugify(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `artigo-${Date.now()}`;
}

/** Público: destaques activos para a homepage */
export const listHighlightsPublic = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  try {
    return await sql<Highlight>`
      select id, title, subtitle, image_url, link_url, link_label, sort_order, active
      from highlights
      where active = true
      order by sort_order asc, created_at desc
      limit 12
    `;
  } catch {
    return [] as Highlight[];
  }
});

/** Público: artigos publicados */
export const listArticlesPublic = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  try {
    return await sql<Article>`
      select id, slug, title, excerpt, body, cover_url, published,
             created_at::text as created_at, updated_at::text as updated_at
      from articles
      where published = true
      order by created_at desc
      limit 12
    `;
  } catch {
    return [] as Article[];
  }
});

export const getArticleBySlug = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const slug = String(data.slug || "").trim();
    const rows = await sql<Article>`
      select id, slug, title, excerpt, body, cover_url, published,
             created_at::text as created_at, updated_at::text as updated_at
      from articles
      where slug = ${slug} and published = true
      limit 1
    `;
    if (!rows[0]) throw new Error("Artigo não encontrado.");
    return rows[0];
  });

/** Admin: listar todos os destaques */
export const adminListHighlights = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdminUser(context.userId);
    return sql<Highlight>`
      select id, title, subtitle, image_url, link_url, link_label, sort_order, active
      from highlights
      order by sort_order asc, created_at desc
    `;
  });

export const adminSaveHighlight = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id?: string;
      title: string;
      subtitle?: string;
      image_url?: string;
      link_url?: string;
      link_label?: string;
      sort_order?: number;
      active?: boolean;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdminUser(context.userId);
    const title = String(data.title || "").trim().slice(0, 120);
    if (title.length < 2) throw new Error("Indique um título.");
    const subtitle = (data.subtitle ?? "").trim().slice(0, 200) || null;
    const image_url = (data.image_url ?? "").trim().slice(0, 800) || null;
    const link_url = (data.link_url ?? "").trim().slice(0, 800) || null;
    const link_label = (data.link_label ?? "Ver mais").trim().slice(0, 40) || "Ver mais";
    const sort_order = Number.isFinite(data.sort_order) ? Number(data.sort_order) : 0;
    const active = data.active !== false;
    const id = data.id?.trim() || crypto.randomUUID();

    await sql`
      insert into highlights (id, title, subtitle, image_url, link_url, link_label, sort_order, active)
      values (${id}, ${title}, ${subtitle}, ${image_url}, ${link_url}, ${link_label}, ${sort_order}, ${active})
      on conflict (id) do update set
        title = excluded.title,
        subtitle = excluded.subtitle,
        image_url = excluded.image_url,
        link_url = excluded.link_url,
        link_label = excluded.link_label,
        sort_order = excluded.sort_order,
        active = excluded.active
    `;
    return { ok: true as const, id };
  });

export const adminDeleteHighlight = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await requireAdminUser(context.userId);
    await sql`delete from highlights where id = ${data.id}`;
    return { ok: true as const };
  });

export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdminUser(context.userId);
    return sql<Article>`
      select id, slug, title, excerpt, body, cover_url, published,
             created_at::text as created_at, updated_at::text as updated_at
      from articles
      order by created_at desc
    `;
  });

export const adminSaveArticle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id?: string;
      title: string;
      slug?: string;
      excerpt?: string;
      body: string;
      cover_url?: string;
      published?: boolean;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await requireAdminUser(context.userId);
    const title = String(data.title || "").trim().slice(0, 160);
    const body = String(data.body || "").trim().slice(0, 50000);
    if (title.length < 2) throw new Error("Indique um título.");
    if (body.length < 10) throw new Error("Escreva o conteúdo do artigo.");
    const excerpt = (data.excerpt ?? "").trim().slice(0, 300) || null;
    const cover_url = (data.cover_url ?? "").trim().slice(0, 800) || null;
    const published = Boolean(data.published);
    const id = data.id?.trim() || crypto.randomUUID();
    let slug = (data.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || slugify(title);

    // unique slug
    const existing = await sql<{ id: string }>`
      select id from articles where slug = ${slug} and id <> ${id} limit 1
    `;
    if (existing[0]) slug = `${slug}-${id.slice(0, 6)}`;

    await sql`
      insert into articles (id, slug, title, excerpt, body, cover_url, published, created_at, updated_at)
      values (${id}, ${slug}, ${title}, ${excerpt}, ${body}, ${cover_url}, ${published}, now(), now())
      on conflict (id) do update set
        slug = excluded.slug,
        title = excluded.title,
        excerpt = excluded.excerpt,
        body = excluded.body,
        cover_url = excluded.cover_url,
        published = excluded.published,
        updated_at = now()
    `;
    return { ok: true as const, id, slug };
  });

export const adminDeleteArticle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await requireAdminUser(context.userId);
    await sql`delete from articles where id = ${data.id}`;
    return { ok: true as const };
  });
