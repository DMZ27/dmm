import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKz(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Kz`;
}

export function orderCode(code: number | string) {
  return `#${String(code).padStart(6, "0")}`;
}

export function whatsappHref(text?: string) {
  const base = "https://wa.me/244923078760";
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
