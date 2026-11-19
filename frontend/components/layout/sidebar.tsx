"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Search,
  Layers,
  Cpu,
  BarChart2,
  Clock,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Dna,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkEngineStatus } from "@/lib/api";
import { EngineStatus } from "@/lib/types";

const NAV = [
  {
    section: "Main",
    items: [
      { label: "Dashboard",        href: "/",        icon: LayoutDashboard },
      { label: "Predict",          href: "/predict", icon: FlaskConical,   badge: "Core" },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "Compound Search",  href: "/search",  icon: Search },
      { label: "Virtual Screening",href: "/batch",   icon: Layers },
    ],
  },
  {
    section: "Research",
    items: [
      { label: "Model Architecture",href: "/model",  icon: Cpu },
      { label: "Data & Results",   href: "/metrics", icon: BarChart2 },
      { label: "History",          href: "/history", icon: Clock },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Sign In",          href: "/auth",    icon: LogIn },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [engine, setEngine] = useState<EngineStatus>({
    online: false,
    model_version: "1.0.0",
    dataset: "Davis",
    device: "cpu",
    latency_ms: 0,
    mode: "offline",
  });

  useEffect(() => {
    checkEngineStatus().then(setEngine);
    const id = setInterval(() => checkEngineStatus().then(setEngine), 20000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-surface-border bg-canvas-subtle transition-[width] duration-200 ease-in-out z-30 shrink-0",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-14 items-center border-b border-surface-border px-3",
        collapsed ? "justify-center" : "justify-between gap-2"
      )}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
          <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-brand-accent/90 group-hover:bg-brand-emphasis transition-colors">
            <Dna className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col">
              <span className="text-sm font-semibold text-fg leading-none">DeepDTA</span>
              <span className="text-[10px] text-fg-muted leading-none mt-0.5">Drug-Target Affinity</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "shrink-0 flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:text-fg hover:bg-surface-elevated transition-colors",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded text-fg-subtle hover:text-fg hover:bg-surface-elevated transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-fg-subtle">
                {section.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors duration-100",
                        isActive
                          ? "bg-brand-accent/15 text-green-400 font-medium"
                          : "text-fg-muted hover:text-fg hover:bg-surface-elevated"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-green-400" : "text-fg-subtle")} />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!collapsed && "badge" in item && item.badge && (
                        <span className="rounded-sm bg-brand-accent/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-green-400">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Engine status */}
      <div className={cn("border-t border-surface-border p-3", collapsed && "flex justify-center")}>
        {collapsed ? (
          <div title={engine.online ? "PyTorch CNN online" : "Prediction API offline"}>
            <Circle
              className={cn(
                "h-3 w-3",
                engine.online ? "text-green-400 fill-green-400" : "text-yellow-500 fill-yellow-500"
              )}
            />
          </div>
        ) : (
          <div className="rounded-md border border-surface-border bg-canvas-inset px-3 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-fg-subtle uppercase tracking-wide">Inference Engine</span>
              <span className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping-slow absolute inline-flex h-full w-full rounded-full opacity-60",
                  engine.online ? "bg-green-400" : "bg-yellow-500"
                )} />
                <span className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  engine.online ? "bg-green-400" : "bg-yellow-500"
                )} />
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-fg-subtle">Status</span>
                <span className={cn("text-[10px] font-medium", engine.online ? "text-green-400" : "text-yellow-400")}>
                  {engine.online ? `DeepDTACNN · ${engine.device}` : "API Offline"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-fg-subtle">Dataset</span>
                <span className="text-[10px] text-fg-muted">Davis · 30k pairs</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
