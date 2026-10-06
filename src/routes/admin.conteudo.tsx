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
import { resolveHighlightCover } from "@/lib/dmm/video-thumb";

export const Route = createFileRoute("/admin/conteudo")({ component: AdminConteudo });

/** Redimensiona e comprime imagem no browser (JPEG) para caber na BD */
function fileToCompressedDataUrl(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Escolhe um ficheiro de imagem (JPG, PNG ou WebP)."));
      return;
    }
    // limite ~4 MB original
    if (file.size > 6_000_000) {
      reject(new Error("Imagem demasiado grande (máx. ~6 MB)."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}



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
  const [hUploading, setHUploading] = useState(false);

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
              Imagens do slideshow “Alguns dos Nossos Trabalhos”, destaques e artigos do mini-blog. Carrega fotos reais dos teus trabalhos — aparecem no site sem precisar de código.
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
          <h2 className="font-display text-xl font-bold">Novo trabalho / slide da homepage</h2>
          <p className="mt-1 text-sm text-fog">
            Aparece no slideshow grande da homepage e nos destaques. No campo link coloque o URL do vídeo (YouTube, TikTok, etc.).
            Podes pôr uma imagem tua (https://…) ou deixar vazio: com link YouTube a capa gera-se sozinha.
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
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-fog">Imagem do trabalho (recomendado)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 block w-full text-sm text-fog file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-paper hover:file:bg-navy/90"
                disabled={hUploading || hBusy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setHUploading(true);
                  setMsg("");
                  try {
                    const dataUrl = await fileToCompressedDataUrl(file);
                    setHImg(dataUrl);
                    setMsg("Imagem pronta. Preenche o título e publica.");
                  } catch (err) {
                    setMsg(err instanceof Error ? err.message : "Erro ao processar imagem");
                  } finally {
                    setHUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              <p className="mt-1 text-[11px] text-fog">
                Escolhe uma foto do teu PC (trabalho real). É comprimida automaticamente — sem código nem git.
              </p>
              <label className="mt-3 block text-xs font-semibold text-fog">Ou cola um URL de imagem (opcional)</label>
              <Input
                className="mt-1"
                placeholder="https://… ou deixa vazio se já carregaste ficheiro"
                value={hImg.startsWith("data:") ? "" : hImg}
                onChange={(e) => setHImg(e.target.value)}
              />
              {hUploading && <p className="mt-1 text-xs text-brass">A processar imagem…</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-fog">URL do vídeo / link</label>
              <Input className="mt-1" placeholder="https://youtube.com/watch?v=… ou youtu.be/…" value={hLink} onChange={(e) => setHLink(e.target.value)} />
            </div>
            {resolveHighlightCover(hImg, hLink) && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-fog">Pré-visualização da capa</p>
                <img
                  src={resolveHighlightCover(hImg, hLink) || ""}
                  alt=""
                  className="mt-2 aspect-[16/10] max-w-xs rounded-xl object-cover ring-1 ring-line"
                />
              </div>
            )}
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
            {(highlights ?? []).map((h) => {
              const thumb = resolveHighlightCover(h.image_url, h.link_url);
              return (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-cream text-[10px] text-fog">sem capa</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold">{h.title}</p>
                    <p className="truncate text-xs text-fog">{h.link_url || "Sem link"}</p>
                    {!h.image_url && thumb && (
                      <p className="text-[10px] text-brass">Capa automática (YouTube)</p>
                    )}
                  </div>
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
            );})}
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
