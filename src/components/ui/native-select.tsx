import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-sm)] border border-line bg-cream px-3 text-sm text-ink outline-none transition-colors focus:border-brass focus:ring-2 focus:ring-brass/20",
        className,
      )}
      {...props}
    />
  );
}
