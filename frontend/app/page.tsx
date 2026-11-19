"use client";

import React from "react";
import Link from "next/link";
import {
  FlaskConical, Search, Layers, Cpu, BarChart2, Clock,
  ArrowRight, Dna, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { value: "68",    label: "Drugs",          sub: "Davis kinase inhibitors" },
  { value: "442",   label: "Proteins",       sub: "Kinase target sequences" },
  { value: "30,056",label: "Training pairs", sub: "Measured Kd values" },
  { value: "0.885", label: "CI score",       sub: "vs. 0.878 original paper" },
];

const FEATURES = [
  {
    icon: FlaskConical,
    num: "01",
    title: "Predict",
    desc: "Input a SMILES string and protein sequence. Get a predicted pKd score and Kd in nM with a confidence estimate.",
    href: "/predict",
    cta: "Open predictor",
    accent: "green",
  },
  {
    icon: Search,
    num: "02",
    title: "Compound Search",
    desc: "Look up any molecule by name via PubChem. Retrieve its formula, weight, and SMILES to use in predictions.",
    href: "/search",
    cta: "Search PubChem",
    accent: "teal",
  },
  {
    icon: Layers,
    num: "03",
    title: "Virtual Screening",
    desc: "Upload a CSV of drug-protein pairs. Screen them in batch and rank by predicted binding affinity.",
    href: "/batch",
    cta: "Start screening",
    accent: "blue",
  },
  {
    icon: Cpu,
    num: "04",
    title: "Model Architecture",
    desc: "Explore the dual-branch CNN built with PyTorch. View hyperparameters, the code skeleton, and enhancements over the original paper.",
    href: "/model",
    cta: "View architecture",
    accent: "purple",
  },
  {
    icon: BarChart2,
    num: "05",
    title: "Data & Results",
    desc: "Compare our model against published baselines on the Davis and KIBA datasets. Includes honest cold-split generalisation scores.",
    href: "/metrics",
    cta: "See results",
    accent: "orange",
  },
  {
    icon: Clock,
    num: "06",
    title: "History",
    desc: "Review past prediction sessions, revisit scores, and manage your saved inference runs.",
    href: "/history",
    cta: "Open history",
    accent: "gray",
  },
];

const accentMap: Record<string, { dot: string; badge: string; link: string }> = {
  green:  { dot: "bg-green-500",   badge: "bg-green-500/10 text-green-400 border-green-500/20",   link: "text-green-400 hover:text-green-300" },
  teal:   { dot: "bg-teal-500",    badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",     link: "text-teal-400 hover:text-teal-300" },
  blue:   { dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",     link: "text-blue-400 hover:text-blue-300" },
  purple: { dot: "bg-purple-500",  badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",link: "text-purple-400 hover:text-purple-300" },
  orange: { dot: "bg-orange-500",  badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",link: "text-orange-400 hover:text-orange-300" },
  gray:   { dot: "bg-neutral-500", badge: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",link: "text-neutral-400 hover:text-neutral-300" },
};

const TEAM = [
  { name: "Havisha",   roll: "245525733012" },
  { name: "SaiCharan", roll: "245525733021" },
  { name: "Abhinov",   roll: "245525733001" },
  { name: "Rishitha",  roll: "245525733020" },
  { name: "Hariharan", roll: "245525733002" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10 animate-fade-in">

      {/* ── Hero ── */}
      <section className="hero-grid rounded-xl border border-surface-border bg-canvas-subtle p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-2xl space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand">Research Project · Team G1542</Badge>
            <Badge variant="muted">PyTorch · RDKit · Next.js</Badge>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-fg tracking-tight leading-snug">
              DeepDTA — Drug-Target Binding Affinity
            </h1>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed max-w-xl">
              Predict how strongly a drug binds to a protein using a dual-branch convolutional neural network
              trained on measured Kd values from the Davis kinase dataset. Built on the{" "}
              <span className="text-fg">Öztürk et al. 2018</span> paper, extended with{" "}
              <span className="text-fg">PyTorch</span> and <span className="text-fg">RDKit</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/predict">
              <Button variant="glow" size="md" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Start predicting
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="secondary" size="md" className="gap-2">
                <Search className="h-4 w-4" />
                Search a compound
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-surface-border bg-canvas-subtle p-4"
            >
              <div className="text-xl font-semibold font-mono text-fg">{s.value}</div>
              <div className="text-xs font-medium text-fg mt-0.5">{s.label}</div>
              <div className="text-[11px] text-fg-muted mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-fg">Application features</h2>
          <p className="text-xs text-fg-muted mt-0.5">Six tools to explore drug-protein interactions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => {
            const c = accentMap[f.accent];
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className="group rounded-lg border border-surface-border bg-canvas-subtle p-5 hover:border-surface-hover hover:bg-surface-elevated transition-all duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${c.badge}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-lg font-black font-mono text-surface-border group-hover:text-surface-hover transition-colors">
                    {f.num}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-fg">{f.title}</h3>
                <p className="mt-1 text-xs text-fg-muted leading-relaxed line-clamp-3">{f.desc}</p>
                <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${c.link} transition-colors`}>
                  {f.cta}
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="rounded-lg border border-surface-border bg-canvas-subtle">
        <div className="border-b border-surface-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">How it works</h2>
          <p className="text-xs text-fg-muted mt-0.5">One request round-trip from input to prediction.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
          {[
            { n: "1", title: "Enter inputs",       desc: "SMILES string for the drug + amino acid sequence for the protein." },
            { n: "2", title: "RDKit validation",   desc: "The molecule is validated and enriched with chemistry-aware features." },
            { n: "3", title: "CNN inference",       desc: "Two Conv1D branches process drug and protein; dense layers predict pKd." },
            { n: "4", title: "View result",         desc: "Score, Kd in nM, confidence index, and baseline comparison chart." },
          ].map((step) => (
            <div key={step.n} className="p-5">
              <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full border border-surface-border text-[11px] font-bold text-fg-muted">
                {step.n}
              </div>
              <div className="text-xs font-semibold text-fg">{step.title}</div>
              <p className="mt-1 text-xs text-fg-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reference + Team ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paper reference */}
        <div className="rounded-lg border border-surface-border bg-canvas-subtle p-5 space-y-2">
          <div className="text-xs font-semibold text-fg flex items-center gap-2">
            <Dna className="h-3.5 w-3.5 text-green-400" />
            Original Paper
          </div>
          <p className="text-xs text-fg-muted leading-relaxed">
            Öztürk, H., Özgür, A., &amp; Ozkirimli, E. (2018).{" "}
            <em className="text-fg">DeepDTA: deep drug-target binding affinity prediction.</em>{" "}
            <span className="text-fg-subtle">Bioinformatics, 34(17), i821–i829.</span>
          </p>
          <a
            href="https://doi.org/10.1093/bioinformatics/bty593"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            doi:10.1093/bioinformatics/bty593 →
          </a>
        </div>

        {/* Team */}
        <div className="rounded-lg border border-surface-border bg-canvas-subtle p-5">
          <div className="text-xs font-semibold text-fg mb-3">Team G1542</div>
          <div className="space-y-1.5">
            {TEAM.map((m) => (
              <div key={m.roll} className="flex items-center justify-between">
                <span className="text-xs text-fg">{m.name}</span>
                <span className="font-mono text-[11px] text-fg-subtle">{m.roll}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
