import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-surface-border bg-canvas-subtle px-3 py-2 text-sm text-fg placeholder:text-fg-subtle",
        "transition-colors duration-150 resize-y",
        "focus:outline-none focus:border-brand-accent/60 focus:ring-1 focus:ring-brand-accent/30",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
