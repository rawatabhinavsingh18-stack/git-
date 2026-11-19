import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative flex items-center w-full">
          <div className="absolute left-3 text-fg-subtle pointer-events-none flex items-center justify-center">
            {icon}
          </div>
          <input
            type={type}
            ref={ref}
            className={cn(
              "flex h-9 w-full rounded-md border border-surface-border bg-canvas-subtle pl-9 pr-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle",
              "transition-colors duration-150",
              "focus:outline-none focus:border-brand-accent/60 focus:ring-1 focus:ring-brand-accent/30",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-surface-border bg-canvas-subtle px-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle",
          "transition-colors duration-150",
          "focus:outline-none focus:border-brand-accent/60 focus:ring-1 focus:ring-brand-accent/30",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
