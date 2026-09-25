import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/dmm/status";
import { STATUS_META } from "@/lib/dmm/status";

const toneClass: Record<string, string> = {
  neutral: "bg-ink/8 text-ink",
  brass: "bg-brass/20 text-ink",
  good: "bg-good/15 text-good",
  wait: "bg-wait/15 text-wait",
  bad: "bg-bad/12 text-bad",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as OrderStatus];
  const label = meta?.label ?? status;
  const tone = meta?.tone ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold tracking-wide",
        toneClass[tone],
      )}
    >
      {label}
    </span>
  );
}
