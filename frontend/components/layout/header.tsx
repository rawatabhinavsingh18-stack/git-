"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, ExternalLink } from "lucide-react";

const CRUMBS: Record<string, string> = {
  "/":        "Dashboard",
  "/predict": "Predict",
  "/search":  "Compound Search",
  "/batch":   "Virtual Screening",
  "/model":   "Model Architecture",
  "/metrics": "Data & Results",
  "/history": "History",
  "/auth":    "Sign In",
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const page = CRUMBS[pathname] ?? "Page";

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-surface-border bg-canvas-subtle/90 backdrop-blur-md px-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Link href="/" className="hover:text-fg transition-colors font-medium">
          DeepDTA
        </Link>
        <span className="text-fg-subtle">/</span>
        <span className="text-fg font-medium">{page}</span>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Live badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-elevated px-2.5 py-1 text-[11px] text-fg-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
          </span>
          Vercel Ready
        </div>

        {/* GitHub */}
        <a
          href="https://github.com/SC-Charan/DeepDTA-Plus"
          target="_blank"
          rel="noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border text-fg-muted hover:text-fg hover:border-surface-hover transition-colors"
          title="View on GitHub"
        >
          <Github className="h-4 w-4" />
        </a>

        {/* Deploy to Vercel link */}
        <a
          href="https://vercel.com/import/git?s=https://github.com/SC-Charan/DeepDTA-Plus&env=NEXT_PUBLIC_API_URL&envDescription=Optional%20FastAPI%20backend%20URL&root=frontend"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs text-fg-muted hover:text-fg hover:border-surface-hover transition-colors"
          title="Deploy to Vercel"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Deploy
        </a>
      </div>
    </header>
  );
};
