import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  adminDeleteArticle,
  adminDeleteHighlight,
  adminListArticles,
  adminListHighlights,
  adminSaveArticle,
  adminSaveHighlight,
  type Article,
  type Highlight,
} from "@/lib/dmm/cms";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/conteudo")({ component: AdminConteudo });

function AdminConteudo() {
  const { user, isPending } = useCurrentUserState();
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // highlight form
  const [hTitle, setHTitle] = useState("");
  const [hSub, setHSub] = useState("");
  const [hImg, setHImg] = useState("");
  const [hLink, setHLink] = useState("");
  const [hLabel, setHLabel] = useState("Ver vídeo");
  const [hBusy, setHBusy] = useState(false);

  // article form
  const [aTitle, setATitle] = useState("");
  const [aExcerpt, setAExcerpt] = useState("");
  const [aBody, setABody] = useState("");
  const [aCover, setACover] = useState("");
  const [aPub, setAPub] = useState(true);
  const [aBusy, setABusy] = useState(false);

  function load() {
    Promise.all([adminListHighlights(), adminListArticles()])
      .then(([h, a]) => {
        setHighlights(h);
        setArticles(a);
        setErr("");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }

  useEffect(() => {
    if (!isPending && user) load();
  }, [isPending, user]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-[960px] px-4 py-10">
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (err === "FORBIDDEN") {
    return (
      <div className="mx-auto max-w-[520px] px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Acesso reservado</h1>
        <Button asChild className="mt-6 h-11 rounded-full">
          <Link to="/dashboard">Voltar</Link>
        </Button>
      </div>
    );
  }

  async function saveHighlight(e: FormEvent) {
    e.preventDefault();
    setHBusy(true);
    setMsg("");
    try {
      await adminSaveHighlight({
        data: {
          title: hTitle,
          subtitle: hSub,
          image_url: hImg,
          link_url: hLink,
          link_label: hLabel || "Ver mais",
          active: true,
        },
      });
      setHTitle("");
      setHSub("");
      setHImg("");
      setHLink("");
      setMsg("Destaque publicado.");
      load();
    } catch (ex) {
      setMsg(ex instanceof Error ? ex.message : "Erro ao guardar");
    } finally {
      setHBusy(false);
    }
  }

  async function saveArticle(e: FormEvent) {
    e.preventDefault();
    setABusy(true);
    setMsg("");
    try {
      await adminSaveArticle({
        data: {
          title: aTitle,
          excerpt: aExcerpt,
          body: aBody,
          cover_url: aCover,
          published: aPub,
        },
      });
      setATitle("");
      setAExcerpt("");
      setABody("");
      setACover("");
      setMsg("Artigo guardado.");
      load();
    } catch (ex) {
      setMsg(ex instanceof Error ? ex.message : "Erro ao guardar");
    } finally {
      setABusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-[#f6f7fb]">
      <div className="mx-auto w-full max-w-[960px] px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brass">Conteúdo</p>
            <h1 className="mt-1 font-display text-3xl font-bold">Publicidade e blog</h1>
            <p className="mt-1 text-sm text-fog">
              Destaques na homepage (imagem + título + link de vídeo) e artigos do mini-blog.
            </p>
          </div>
          <Button asChild variant="cream" className="h-11 rounded-full">
            <Link to="/admin">Voltar ao painel</Link>
          </Button>
        </div>

        {msg && <p className="mt-4 rounded-xl bg-brass/15 px-4 py-3 text-sm text-ink">{msg}</p>}
        {err && err !== "FORBIDDEN" && (
          <p className="mt-4 rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{err}</p>
        )}

        {/* Destaques */}
        <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-bold">Novo destaque / publicidade</h2>
          <p className="mt-1 text-sm text-fog">
            Aparece na página inicial. No campo link coloque o URL do vídeo (YouTube, TikTok, etc.).
            A imagem deve ser um link directo (https://…).
          </p>
          <form onSubmit={saveHighlight} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-fog">Título grande</label>
              <Input className="mt-1" required value={hTitle} onChange={(e) => setHTitle(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-fog">Subtítulo (opcional)</label>
              <Input className="mt-1" value={hSub} onChange={(e) => setHSub(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">URL da imagem</label>
              <Input className="mt-1" placeholder="https://..." value={hImg} onChange={(e) => setHImg(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">URL do vídeo / link</label>
              <Input className="mt-1" placeholder="https://youtube.com/..." value={hLink} onChange={(e) => setHLink(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">Texto do botão</label>
              <Input className="mt-1" value={hLabel} onChange={(e) => setHLabel(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={hBusy} className="h-11 w-full rounded-full">
                {hBusy ? "A guardar…" : "Publicar destaque"}
              </Button>
            </div>
          </form>

          <h3 className="mt-8 text-sm font-bold text-ink">Destaques activos</h3>
          <ul className="mt-3 space-y-2">
            {(highlights ?? []).map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{h.title}</p>
                  <p className="truncate text-xs text-fog">{h.link_url || "Sem link"}</p>
                </div>
                <Button
                  type="button"
                  variant="cream"
                  className="h-9 rounded-full text-xs"
                  onClick={() =>
                    void adminDeleteHighlight({ data: { id: h.id } }).then(load).catch((e) => setMsg(String(e)))
                  }
                >
                  Remover
                </Button>
              </li>
            ))}
            {highlights?.length === 0 && <p className="text-sm text-fog">Ainda não há destaques.</p>}
          </ul>
        </section>

        {/* Artigos */}
        <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-bold">Novo artigo (mini-blog)</h2>
          <form onSubmit={saveArticle} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-fog">Título</label>
              <Input className="mt-1" required value={aTitle} onChange={(e) => setATitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">Resumo curto</label>
              <Input className="mt-1" value={aExcerpt} onChange={(e) => setAExcerpt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">URL da imagem de capa (opcional)</label>
              <Input className="mt-1" placeholder="https://..." value={aCover} onChange={(e) => setACover(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">Texto do artigo</label>
              <Textarea
                className="mt-1 min-h-[140px]"
                required
                value={aBody}
                onChange={(e) => setABody(e.target.value)}
                placeholder="Escreva o conteúdo..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={aPub} onChange={(e) => setAPub(e.target.checked)} />
              Publicar na homepage
            </label>
            <Button type="submit" disabled={aBusy} className="h-11 rounded-full">
              {aBusy ? "A guardar…" : "Guardar artigo"}
            </Button>
          </form>

          <h3 className="mt-8 text-sm font-bold text-ink">Artigos</h3>
          <ul className="mt-3 space-y-2">
            {(articles ?? []).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {a.title}{" "}
                    {!a.published && <span className="text-xs font-normal text-fog">(rascunho)</span>}
                  </p>
                  <Link to="/artigos/$slug" params={{ slug: a.slug }} className="text-xs text-brass hover:underline">
                    /artigos/{a.slug}
                  </Link>
                </div>
                <Button
                  type="button"
                  variant="cream"
                  className="h-9 rounded-full text-xs"
                  onClick={() =>
                    void adminDeleteArticle({ data: { id: a.id } }).then(load).catch((e) => setMsg(String(e)))
                  }
                >
                  Remover
                </Button>
              </li>
            ))}
            {articles?.length === 0 && <p className="text-sm text-fog">Ainda não há artigos.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}
