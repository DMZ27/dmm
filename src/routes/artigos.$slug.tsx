import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getArticleBySlug, type Article } from "@/lib/dmm/cms";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/artigos/$slug")({
  component: ArtigoPage,
});

function ArtigoPage() {
  const { slug } = Route.useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getArticleBySlug({ data: { slug } })
      .then(setArticle)
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, [slug]);

  if (err) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Artigo não encontrado</h1>
        <Button asChild className="mt-6 h-11 rounded-full">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-[720px] px-4 py-12">
      <p className="text-xs font-semibold tracking-[0.16em] text-brass">BLOG DMM</p>
      <h1 className="mt-2 font-display text-4xl font-bold leading-tight">{article.title}</h1>
      {article.excerpt && <p className="mt-3 text-lg text-fog">{article.excerpt}</p>}
      {article.cover_url && (
        <img
          src={article.cover_url}
          alt=""
          className="mt-8 max-h-[360px] w-full rounded-2xl object-cover"
        />
      )}
      <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-ink/90">{article.body}</div>
      <Button asChild variant="cream" className="mt-10 h-11 rounded-full">
        <Link to="/">← Voltar ao início</Link>
      </Button>
    </article>
  );
}
