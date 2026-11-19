import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "brand" | "cyan" | "teal" | "danger" | "muted" | "outline";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-surface-elevated text-fg-muted border border-surface-border",
      brand:   "bg-brand-accent/15 text-green-400 border border-brand-accent/30",
      cyan:    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
      teal:    "bg-teal-500/10 text-teal-400 border border-teal-500/25",
      danger:  "bg-danger-subtle text-danger border border-danger-muted/40",
      muted:   "bg-surface-elevated/50 text-fg-subtle border border-surface-border/50",
      outline: "bg-transparent text-fg-muted border border-surface-border",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
