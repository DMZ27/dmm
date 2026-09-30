import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { MAX_FILE_CHARS, MAX_FILES_PER_ORDER } from "./catalog";
import { isOrderStatus, type OrderStatus } from "./status";

type Sql = Awaited<ReturnType<typeof getSql>>;

export type Profile = {
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  role: "CLIENT" | "ADMIN";
};

export type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  details: string;
  sort_order: number;
  active: boolean;
};

export type OrderListRow = {
  id: string;
  code: number;
  user_id: string;
  service_id: string;
  title: string;
  description: string | null;
  status: string;
  quoted_price: string | null;
  deadline: string | null;
  created_at: string;
  service_name: string;
  service_category: string;
  client_name?: string;
};

export type OrderDetail = {
  id: string;
  code: number;
  user_id: string;
  service_id: string;
  title: string;
  description: string | null;
  status: string;
  quoted_price: string | null;
  deadline: string | null;
  created_at: string;
  form_data: Record<string, string | string[] | number | boolean | null> | null;
  service_name: string;
  service_category: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
};

export type FileRow = {
  id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: string;
  created_at: string;
  has_data: boolean;
};

export type MessageRow = {
  id: string;
  author: string;
  body: string;
  created_at: string;
};

export type QuoteRow = {
  id: string;
  price: string;
  deadline: string;
  revisions: number;
  note: string | null;
};

export type OrderPayload = {
  order: OrderDetail;
  files: FileRow[];
  messages: MessageRow[];
  quote: QuoteRow | null;
  me: Profile;
};

async function sessionHints() {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return {
    name: "Cliente DMM",
    email: u?.email ?? null,
  };
}

async function ensureProfile(sql: Sql, userId: string): Promise<Profile> {
  const hints = await sessionHints();
  await sql`
    insert into profiles (user_id, name, email, role)
    values (${userId}, ${hints.name}, ${hints.email}, 'CLIENT')
    on conflict (user_id) do update set
      email = coalesce(excluded.email, profiles.email),
      updated_at = now()
  `;
  await sql`
    update profiles
    set role = 'ADMIN'
    where user_id = ${userId}
      and not exists (select 1 from profiles p2 where p2.role = 'ADMIN')
  `;
  const rows = await sql<Profile>`
    select user_id, name, email, phone, city, role from profiles where user_id = ${userId}
  `;
  const profile = rows[0];
  if (!profile) throw new Error("Perfil indisponível.");
  return profile;
}

function requireAdmin(profile: Profile) {
  if (profile.role !== "ADMIN") throw new Error("FORBIDDEN");
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/zip",
]);

type IncomingFile = {
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
  kind?: "INPUT" | "FINAL" | "PAYMENT_PROOF";
};

function validateIncoming(file: IncomingFile) {
  if (!file.name || file.name.length > 180) throw new Error("Nome de ficheiro inválido.");
  if (!ALLOWED_MIME.has(file.mimeType)) throw new Error("Tipo de ficheiro não permitido.");
  if (!file.dataBase64 || file.dataBase64.length > MAX_FILE_CHARS) {
    throw new Error("Cada ficheiro deve ter menos de 900 KB neste canal.");
  }
}

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<ServiceRow>`
    select id, name, slug, category, description, details, sort_order, active
    from services where active = true order by sort_order asc
  `;
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return ensureProfile(sql, context.userId);
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { name?: string; phone?: string; city?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    const name = (data.name ?? "").trim().slice(0, 120);
    const phone = (data.phone ?? "").trim().slice(0, 30);
    const city = (data.city ?? "Benguela").trim().slice(0, 80) || "Benguela";
    if (name.length < 2) throw new Error("Indique o nome completo.");
    await sql`
      update profiles
      set name = ${name}, phone = ${phone || null}, city = ${city}, updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const createOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    serviceId: string;
    title: string;
    description?: string;
    formData?: Record<string, string | string[] | number | boolean | null>;
    files?: IncomingFile[];
  }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    const serviceId = String(data.serviceId || "");
    const title = String(data.title || "").trim().slice(0, 180);
    const description = String(data.description || "").trim().slice(0, 5000);
    if (title.length < 3) throw new Error("Dê um título ao pedido.");
    const service = await sql<{ id: string }>`
      select id from services where id = ${serviceId} and active = true
    `;
    if (!service[0]) throw new Error("Serviço inválido.");
    const files = (data.files ?? []).slice(0, MAX_FILES_PER_ORDER);
    files.forEach(validateIncoming);
    const id = crypto.randomUUID();
    const formJson = JSON.stringify(data.formData ?? {});
    await sql`
      insert into orders (id, user_id, service_id, title, description, form_data, status)
      values (${id}, ${context.userId}, ${serviceId}, ${title}, ${description || null}, ${formJson}::jsonb, 'RECEIVED')
    `;
    for (const file of files) {
      const fid = crypto.randomUUID();
      await sql`
        insert into order_files (id, order_id, user_id, name, mime_type, size_bytes, kind, data_base64)
        values (${fid}, ${id}, ${context.userId}, ${file.name}, ${file.mimeType}, ${file.size}, 'INPUT', ${file.dataBase64})
      `;
    }
    const created = await sql<{ id: string; code: number }>`select id, code from orders where id = ${id}`;
    return created[0];
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    return sql<OrderListRow>`
      select o.id, o.code, o.user_id, o.service_id, o.title, o.description, o.status,
             o.quoted_price::text as quoted_price, o.deadline::text as deadline,
             o.created_at::text as created_at, s.name as service_name, s.category as service_category
      from orders o
      join services s on s.id = o.service_id
      where o.user_id = ${context.userId}
      order by o.created_at desc
    `;
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<OrderPayload> => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    const rows = await sql<OrderDetail>`
      select o.id, o.code, o.user_id, o.service_id, o.title, o.description, o.status,
             o.quoted_price::text as quoted_price, o.deadline::text as deadline,
             o.created_at::text as created_at, o.form_data,
             s.name as service_name, s.category as service_category,
             p.name as client_name, p.phone as client_phone, p.email as client_email
      from orders o
      join services s on s.id = o.service_id
      join profiles p on p.user_id = o.user_id
      where o.id = ${id}
    `;
    const found = rows[0];
    if (!found) throw new Error("Pedido não encontrado.");
    if (profile.role !== "ADMIN" && found.user_id !== context.userId) throw new Error("FORBIDDEN");
    const order: OrderDetail = {
      ...found,
      form_data:
        found.form_data && typeof found.form_data === "object" ? found.form_data : null,
    };
    const files = await sql<FileRow>`
      select id, name, mime_type, size_bytes, kind, created_at::text as created_at,
             (data_base64 is not null) as has_data
      from order_files where order_id = ${id} order by created_at asc
    `;
    const messages = await sql<MessageRow>`
      select id, author, body, created_at::text as created_at
      from messages where order_id = ${id} order by created_at asc
    `;
    const quotes = await sql<QuoteRow>`
      select id, price::text as price, deadline::text as deadline, revisions, note
      from quotes where order_id = ${id}
    `;
    return { order, files, messages, quote: quotes[0] ?? null, me: profile };
  });

export const postMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string; body: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    const body = data.body.trim().slice(0, 4000);
    if (!body) throw new Error("Escreva uma mensagem.");
    const order = await sql<{ id: string; user_id: string }>`
      select id, user_id from orders where id = ${data.orderId}
    `;
    if (!order[0]) throw new Error("Pedido não encontrado.");
    if (profile.role !== "ADMIN" && order[0].user_id !== context.userId) throw new Error("FORBIDDEN");
    const id = crypto.randomUUID();
    const author = profile.role === "ADMIN" ? "ADMIN" : "CLIENT";
    await sql`
      insert into messages (id, order_id, user_id, author, body)
      values (${id}, ${data.orderId}, ${context.userId}, ${author}, ${body})
    `;
    return { ok: true as const };
  });

export const attachFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string; file: IncomingFile; kind: "INPUT" | "FINAL" | "PAYMENT_PROOF" }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    validateIncoming(data.file);
    const order = await sql<{ id: string; user_id: string }>`
      select id, user_id from orders where id = ${data.orderId}
    `;
    if (!order[0]) throw new Error("Pedido não encontrado.");
    if (profile.role !== "ADMIN" && order[0].user_id !== context.userId) throw new Error("FORBIDDEN");
    if (data.kind === "FINAL" && profile.role !== "ADMIN") throw new Error("FORBIDDEN");
    const id = crypto.randomUUID();
    await sql`
      insert into order_files (id, order_id, user_id, name, mime_type, size_bytes, kind, data_base64)
      values (${id}, ${data.orderId}, ${context.userId}, ${data.file.name}, ${data.file.mimeType}, ${data.file.size}, ${data.kind}, ${data.file.dataBase64})
    `;
    if (data.kind === "PAYMENT_PROOF") {
      await sql`update orders set status = 'PAYMENT_PENDING', updated_at = now() where id = ${data.orderId} and status in ('QUOTED','PAYMENT_PENDING')`;
    }
    if (data.kind === "FINAL") {
      await sql`update orders set status = 'DELIVERED', updated_at = now() where id = ${data.orderId}`;
    }
    return { ok: true as const, id };
  });

export const getFileData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    const rows = await sql<{
      id: string;
      name: string;
      mime_type: string | null;
      data_base64: string | null;
      owner_id: string;
    }>`
      select f.id, f.name, f.mime_type, f.data_base64, o.user_id as owner_id
      from order_files f join orders o on o.id = f.order_id
      where f.id = ${id}
    `;
    const file = rows[0];
    if (!file || !file.data_base64) throw new Error("Ficheiro indisponível.");
    if (profile.role !== "ADMIN" && file.owner_id !== context.userId) throw new Error("FORBIDDEN");
    return { name: file.name, mimeType: file.mime_type, dataBase64: file.data_base64 };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    requireAdmin(profile);
    const counts = await sql<{
      orders: number;
      clients: number;
      production: number;
      completed: number;
    }>`
      select
        (select count(*)::int from orders) as orders,
        (select count(*)::int from profiles where role = 'CLIENT') as clients,
        (select count(*)::int from orders where status in ('IN_PRODUCTION','ANALYSIS','QUOTED','PAYMENT_PENDING','WAITING_INFO')) as production,
        (select count(*)::int from orders where status in ('COMPLETED','DELIVERED')) as completed
    `;
    const orders = await sql<OrderListRow>`
      select o.id, o.code, o.user_id, o.service_id, o.title, o.description, o.status,
             o.quoted_price::text as quoted_price, o.deadline::text as deadline,
             o.created_at::text as created_at, s.name as service_name, s.category as service_category,
             p.name as client_name
      from orders o
      join services s on s.id = o.service_id
      join profiles p on p.user_id = o.user_id
      order by o.created_at desc
      limit 40
    `;
    return { profile, counts: counts[0], orders };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string; status: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    requireAdmin(profile);
    if (!isOrderStatus(data.status)) throw new Error("Estado inválido.");
    const status: OrderStatus = data.status;
    await sql`update orders set status = ${status}, updated_at = now() where id = ${data.orderId}`;
    return { ok: true as const };
  });

export const sendQuote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string; price: number; deadline: string; revisions?: number; note?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    requireAdmin(profile);
    if (!Number.isFinite(data.price) || data.price <= 0) throw new Error("Indique um valor válido.");
    if (!data.deadline) throw new Error("Indique o prazo.");
    const revisions = Math.min(20, Math.max(0, data.revisions ?? 1));
    const note = (data.note ?? "").trim().slice(0, 3000) || null;
    const id = crypto.randomUUID();
    await sql`
      insert into quotes (id, order_id, price, deadline, revisions, note)
      values (${id}, ${data.orderId}, ${data.price}, ${data.deadline}::date, ${revisions}, ${note})
      on conflict (order_id) do update set
        price = excluded.price,
        deadline = excluded.deadline,
        revisions = excluded.revisions,
        note = excluded.note
    `;
    await sql`
      update orders
      set quoted_price = ${data.price}, deadline = ${data.deadline}::date, revisions = ${revisions},
          status = 'QUOTED', updated_at = now()
      where id = ${data.orderId}
    `;
    return { ok: true as const };
  });
/** Admin define uma senha nova para um cliente (recuperação manual via WhatsApp). */
export const adminResetClientPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string; newPassword: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(sql, context.userId);
    requireAdmin(profile);

    const email = String(data.email || "").trim().toLowerCase();
    const newPassword = String(data.newPassword || "");
    if (!email || !email.includes("@")) throw new Error("Indique um email válido.");
    if (newPassword.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");

    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${email} limit 1
    `;
    if (!users[0]) throw new Error("Não existe conta com esse email.");

    const userId = users[0].id;
    const { hashPassword } = await import("better-auth/crypto");
    const hashed = await hashPassword(newPassword);

    const accounts = await sql<{ id: string }>`
      select id from account
      where "userId" = ${userId} and "providerId" = 'credential'
      limit 1
    `;
    if (accounts[0]) {
      await sql`
        update account
        set password = ${hashed}, "updatedAt" = now()
        where id = ${accounts[0].id}
      `;
    } else {
      const id = crypto.randomUUID();
      await sql`
        insert into account (
          id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
        ) values (
          ${id}, ${userId}, 'credential', ${userId}, ${hashed}, now(), now()
        )
      `;
    }
    return { ok: true as const, email };
  });