import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-sm)] border border-line bg-cream px-3 text-sm text-ink placeholder:text-mist outline-none transition-colors focus:border-brass focus:ring-2 focus:ring-brass/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-[var(--radius-md)] border border-line bg-cream px-3 py-3 text-sm text-ink placeholder:text-mist outline-none transition-colors focus:border-brass focus:ring-2 focus:ring-brass/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
