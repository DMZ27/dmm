import { Link } from "@tanstack/react-router";
import { ExternalLink, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { listArticlesPublic, listHighlightsPublic, type Article, type Highlight } from "@/lib/dmm/cms";

/** Secções de destaques (publicidade) e mini-blog na homepage */
export function HomeCmsSections() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    void listHighlightsPublic().then(setHighlights).catch(() => setHighlights([]));
    void listArticlesPublic().then(setArticles).catch(() => setArticles([]));
  }, []);

  if (highlights.length === 0 && articles.length === 0) return null;

  return (
    <>
      {highlights.length > 0 && (
        <section className="bg-navy text-paper">
          <div className="mx-auto w-full max-w-[1180px] px-4 py-14">
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-brass" />
              <p className="text-xs font-semibold tracking-[0.18em] text-brass-2 uppercase">Em destaque</p>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold">Novidades e conteúdos</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((h) => {
                const card = (
                  <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-brass/40">
                    <div className="relative aspect-[16/10] bg-navy-2">
                      {h.image_url ? (
                        <img src={h.image_url} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                      ) : (
                        <div className="grid h-full place-items-center text-brass">
                          <Play size={40} />
                        </div>
                      )}
                      {h.link_url && (
                        <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-brass text-ink shadow-lg">
                          <Play size={18} fill="currentColor" />
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl font-bold leading-snug">{h.title}</h3>
                      {h.subtitle && <p className="mt-2 text-sm text-paper/70">{h.subtitle}</p>}
                      {h.link_url && (
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brass-2">
                          {h.link_label || "Ver mais"} <ExternalLink size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                );
                return h.link_url ? (
                  <a key={h.id} href={h.link_url} target="_blank" rel="noreferrer" className="block">
                    {card}
                  </a>
                ) : (
                  <div key={h.id}>{card}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="bg-paper">
          <div className="mx-auto w-full max-w-[1180px] px-4 py-14">
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-brass" />
              <p className="text-xs font-semibold tracking-[0.18em] text-brass uppercase">Blog</p>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold">Artigos e dicas</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to="/artigos/$slug"
                  params={{ slug: a.slug }}
                  className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:border-brass/40 hover:shadow-md"
                >
                  {a.cover_url && (
                    <img src={a.cover_url} alt="" className="aspect-[16/10] w-full object-cover" />
                  )}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold leading-snug text-ink">{a.title}</h3>
                    {a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-fog">{a.excerpt}</p>}
                    <span className="mt-3 inline-block text-sm font-semibold text-brass">Ler artigo →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
