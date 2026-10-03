/**
 * Resolve a imagem de capa de um destaque:
 * 1) Se o admin definiu image_url → usa essa (prioridade total)
 * 2) Senão, tenta obter thumbnail automático a partir do link (YouTube, etc.)
 */

export function extractYoutubeId(url: string): string | null {
  const u = (url || "").trim();
  if (!u) return null;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v && /^[\w-]{6,}$/.test(v)) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);
      // /embed/ID, /shorts/ID, /live/ID, /v/ID
      const markers = ["embed", "shorts", "live", "v"];
      for (let i = 0; i < parts.length - 1; i++) {
        if (markers.includes(parts[i]) && /^[\w-]{6,}$/.test(parts[i + 1])) {
          return parts[i + 1];
        }
      }
    }
  } catch {
    // fallback regex
  }

  const m =
    u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{6,})/i) ||
    u.match(/[?&]v=([\w-]{6,})/i);
  return m?.[1] ?? null;
}

/** Thumbnail YouTube (hqdefault é o mais fiável; maxres pode 404). */
export function youtubeThumbnailUrl(videoId: string, quality: "hq" | "mq" | "sd" | "max" = "hq"): string {
  const map = {
    max: "maxresdefault",
    hq: "hqdefault",
    mq: "mqdefault",
    sd: "sddefault",
  } as const;
  return `https://img.youtube.com/vi/${videoId}/${map[quality]}.jpg`;
}

/**
 * Tenta obter capa automática a partir de um link de vídeo.
 * Por agora: YouTube. Outros sites podem ser acrescentados depois.
 */
export function autoThumbnailFromLink(linkUrl: string | null | undefined): string | null {
  if (!linkUrl) return null;
  const yt = extractYoutubeId(linkUrl);
  if (yt) return youtubeThumbnailUrl(yt, "hq");
  return null;
}

/**
 * Imagem a mostrar num destaque:
 * - capa manual (image_url) tem sempre prioridade
 * - se vazia, usa thumbnail automático do link
 */
export function resolveHighlightCover(
  imageUrl: string | null | undefined,
  linkUrl: string | null | undefined,
): string | null {
  const manual = (imageUrl || "").trim();
  if (manual) return manual;
  return autoThumbnailFromLink(linkUrl);
}
