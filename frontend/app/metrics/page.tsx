"use client";

import React from "react";
import {
  Database,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DATASETS = [
  {
    name: "Davis",
    drugs: 68,
    proteins: 442,
    pairs: 30056,
    metric: "pKd",
    metricDesc: "Higher = stronger binding",
    color: "brand",
    description:
      "A kinase inhibitor dataset with measured equilibrium dissociation constants (Kd) for 68 drugs across 442 kinase protein targets. All pairs are measured; binding is expressed as pKd = -log₁₀(Kd / 10⁹).",
    source: "Davis et al., 2011 · Nature Biotechnology",
  },
  {
    name: "KIBA",
    drugs: 2111,
    proteins: 229,
    pairs: 118254,
    metric: "KIBA Score",
    metricDesc: "Composite kinase inhibitor bioactivity",
    color: "teal",
    description:
      "A larger dataset combining Ki, Kd, and IC₅₀ bioactivity measurements into a unified KIBA score. Covers 2,111 compounds against 229 kinase targets — useful for scaling generalization studies.",
    source: "Tang et al., 2014 · Journal of Chemical Information and Modeling",
  },
];

const BASELINE_DATA = [
  { model: "DeepDTA+ CNN\n(100 Epochs)", ci: 0.8866, mse: 0.258, r2m: 0.638, aupr: 0.716 },
  { model: "DeepDTA+\nEnsemble", ci: 0.8852, mse: 0.274, r2m: 0.601, aupr: 0.709 },
  { model: "DeepDTA CNN\n(Original)", ci: 0.878, mse: 0.261, r2m: 0.630, aupr: 0.714 },
  { model: "SimBoost", ci: 0.872, mse: 0.282, r2m: 0.644, aupr: 0.703 },
  { model: "KronRLS", ci: 0.871, mse: 0.379, r2m: 0.411, aupr: 0.661 },
  { model: "Predict-\nMean", ci: 0.5, mse: 0.802, r2m: 0.0, aupr: 0.083 },
];

const RADAR_DATA = [
  { metric: "CI", "DeepDTA+ Ensemble": 0.885, "DeepDTA CNN": 0.878, "KronRLS": 0.871 },
  { metric: "1-MSE (norm)", "DeepDTA+ Ensemble": 0.73, "DeepDTA CNN": 0.74, "KronRLS": 0.62 },
  { metric: "R²m", "DeepDTA+ Ensemble": 0.60, "DeepDTA CNN": 0.63, "KronRLS": 0.61 },
  { metric: "AUPR", "DeepDTA+ Ensemble": 0.71, "DeepDTA CNN": 0.71, "KronRLS": 0.66 },
];

const SPLIT_RESULTS = [
  { split: "Random Split", our_ci: 0.8852, baseline_ci: 0.878, label: "Standard evaluation — both drugs and proteins may appear in train and test" },
  { split: "Cold-Drug Split", our_ci: 0.731, baseline_ci: 0.722, label: "Drugs in test are completely unseen — tests generalisation to new scaffolds" },
  { split: "Cold-Target Split", our_ci: 0.748, baseline_ci: 0.741, label: "Proteins in test are completely unseen — tests generalisation to new targets" },
];

const MODEL_COLORS: Record<string, string> = {
  "DeepDTA+ Ensemble": "#10B981",
  "DeepDTA CNN": "#3B82F6",
  "KronRLS": "#6366F1",
};

export default function DataMetricsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-brand-400" />
            Data &amp; Model Metrics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Explore the Davis and KIBA benchmark datasets and compare research results.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="brand">Davis Dataset</Badge>
          <Badge variant="cyan">KIBA Dataset</Badge>
        </div>
      </div>

      {/* Key Notice */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
        <span>
          <strong>Benchmark context:</strong> These are project-reported and literature scores, not measurements recalculated by the running API. The API serves the saved PyTorch CNN checkpoint; its validation summary is included in the project files.
        </span>
      </div>

      {/* Dataset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DATASETS.map((ds) => (
          <Card key={ds.name} className="border-surface-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Database className={`h-4 w-4 text-${ds.color === "brand" ? "brand" : "teal"}-400`} />
                  {ds.name} Dataset
                </CardTitle>
                <Badge variant={ds.color as "brand" | "cyan"}>{ds.metric}</Badge>
              </div>
              <CardDescription>{ds.source}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">{ds.description}</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Drugs", value: ds.drugs.toLocaleString() },
                  { label: "Proteins", value: ds.proteins.toLocaleString() },
                  { label: "Pairs", value: ds.pairs.toLocaleString() },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-surface-elevated border border-surface-border p-3 text-center">
                    <div className="text-lg font-bold font-mono text-zinc-100">{stat.value}</div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wide mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-surface-elevated/40 border border-surface-border/40 p-2.5 text-[11px] text-zinc-400">
                Binding metric: <strong className="text-zinc-200">{ds.metric}</strong> — {ds.metricDesc}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Concordance Index Comparison */}
      <Card className="border-surface-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Concordance Index (CI) — Davis Dataset Comparison
          </CardTitle>
          <CardDescription>
            CI measures ranking quality: how often the model ranks a stronger binder above a weaker one. Higher is better. Values shown are reported benchmark comparisons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BASELINE_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
                <XAxis
                  dataKey="model"
                  tick={{ fill: "#94A3B8", fontSize: 9.5 }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis domain={[0.4, 0.95]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111622", borderColor: "#1F293D", borderRadius: "8px", fontSize: "11px", color: "#fff" }}
                  formatter={(val: any) => [`CI: ${Number(val).toFixed(4)}`, "Concordance Index"]}
                />
                <Bar dataKey="ci" radius={[4, 4, 0, 0]}>
                  {BASELINE_DATA.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.model.includes("Ensemble") ? "#10B981" :
                        entry.model.includes("Similarity") ? "#14B8A6" :
                        entry.model.includes("CNN") ? "#3B82F6" :
                        entry.model.includes("SimBoost") ? "#8B5CF6" :
                        entry.model.includes("KronRLS") ? "#6366F1" : "#334155"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Full Metrics Table */}
      <Card className="border-surface-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-400" />
            Full Benchmark Results — Davis Dataset
          </CardTitle>
          <CardDescription>
            CI (higher = better) · MSE (lower = better) · R²m (higher = better) · AUPR (higher = better)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border">
                  {["Model", "CI ↑", "MSE ↓", "R²m ↑", "AUPR ↑"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-zinc-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/40">
                {BASELINE_DATA.map((row, i) => (
                  <tr key={i} className={`group ${i === 0 ? "bg-brand-500/5" : ""}`}>
                    <td className="py-2.5 px-3 font-medium text-zinc-200 whitespace-nowrap">
                      {row.model.replace("\n", " ")}
                      {i === 0 && <span className="ml-1.5 text-[10px] text-brand-400">(Ours)</span>}
                    </td>
                    <td className={`py-2.5 px-3 font-mono font-bold ${i === 0 ? "text-emerald-400" : "text-zinc-300"}`}>{row.ci.toFixed(4)}</td>
                    <td className={`py-2.5 px-3 font-mono ${i === 0 ? "text-zinc-200" : "text-zinc-400"}`}>{row.mse.toFixed(3)}</td>
                    <td className={`py-2.5 px-3 font-mono ${i === 0 ? "text-zinc-200" : "text-zinc-400"}`}>{row.r2m.toFixed(3)}</td>
                    <td className={`py-2.5 px-3 font-mono ${i === 0 ? "text-zinc-200" : "text-zinc-400"}`}>{row.aupr.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Generalisation Splits */}
      <Card className="border-surface-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            Generalisation Evaluation — Honest Splits
          </CardTitle>
          <CardDescription>
            Random splits overestimate real-world performance. Cold-Drug and Cold-Target splits show honest generalisation to unseen scaffolds and new protein targets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SPLIT_RESULTS.map((s) => (
            <div key={s.split} className="rounded-lg border border-surface-border bg-surface-elevated/40 p-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-bold text-zinc-200">{s.split}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed max-w-lg">{s.label}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-400">Ours CI</div>
                    <div className="text-sm font-bold font-mono text-emerald-400">{s.our_ci.toFixed(3)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-400">Baseline CI</div>
                    <div className="text-sm font-bold font-mono text-zinc-400">{s.baseline_ci.toFixed(3)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-400">Improvement</div>
                    <div className={`text-sm font-bold font-mono ${(s.our_ci - s.baseline_ci) > 0 ? "text-brand-400" : "text-zinc-400"}`}>
                      +{((s.our_ci - s.baseline_ci) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-2 rounded-lg bg-surface-elevated/30 border border-surface-border/40 p-2.5 text-[11px] text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
            The reported results show a CI drop from ~0.885 on random splits to ~0.73 on cold-drug splits. Cold splits measure generalisation to compounds unseen during training.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
