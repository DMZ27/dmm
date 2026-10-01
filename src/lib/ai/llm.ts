import { env } from "@/lib/env.server";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Chama uma API compatível com OpenAI (Groq, OpenRouter, etc.).
 * Variáveis no Vercel:
 *   AI_API_KEY   (obrigatória) — ex. chave Groq
 *   AI_BASE_URL  (opcional)    — default Groq
 *   AI_MODEL     (opcional)    — default llama-3.3-70b-versatile
 */
export async function chatLLM(messages: ChatMessage[]): Promise<string> {
  const apiKey = env("AI_API_KEY") || env("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error(
      "IA não configurada. No Vercel, defina AI_API_KEY (ex. chave gratuita em console.groq.com).",
    );
  }
  const base = (env("AI_BASE_URL") || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const model = env("AI_MODEL") || "llama-3.3-70b-versatile";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erro da IA (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("A IA não devolveu texto.");
  return text;
}
