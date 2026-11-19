"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  Search,
  Filter,
  Bookmark,
  ExternalLink,
  Trash2,
  Download,
  Copy,
  Calendar,
  Sparkles,
  FlaskConical,
  Eye,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { HistoryItem, BindingCategory } from "@/lib/types";
import { getHistory, clearHistory } from "@/lib/api";
import { formatKd, getBindingBadgeStyles, exportToJson } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [selectedRun, setSelectedRun] = useState<HistoryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Show only predictions actually returned by the model API.
  useEffect(() => {
    setRuns(getHistory());
  }, []);

  const handleClearAll = () => {
    clearHistory();
    setRuns([]);
  };

  const handleExportHistory = () => {
    exportToJson(`deepdta_inference_history_${Date.now()}.json`, runs);
  };

  const handleCopySmiles = (smi: string, id: string) => {
    navigator.clipboard.writeText(smi);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRuns = runs.filter((r) => {
    const matchSearch =
      r.compound_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.target_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.smiles.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      filterCategory === "ALL" || r.binding_level === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-6 w-6 text-brand-400" />
            Workspace & Inference History
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse, inspect, and export previously executed drug-target binding predictions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {runs.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHistory}
                className="text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Export History (.json)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search by compound, target, or SMILES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-lg border border-surface-border bg-surface-elevated px-3 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Binding Categories</option>
            <option value="Very High Binding">Very High Binding (&gt; 8.0)</option>
            <option value="High Binding">High Binding (7.0 - 8.0)</option>
            <option value="Moderate Binding">Moderate Binding (6.0 - 7.0)</option>
            <option value="No Significant Binding">No Significant Binding (&lt; 6.0)</option>
          </select>
        </div>
      </div>

      {/* Grid of Runs */}
      {filteredRuns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRuns.map((run) => {
            const styles = getBindingBadgeStyles(run.binding_level);
            return (
              <Card
                key={run.id}
                className="border-surface-border hover:border-brand-500/40 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {run.compound_name}
                      </h3>
                      <p className="text-xs text-teal-400 font-mono mt-0.5">
                        Target: {run.target_id}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${styles.dotColor}`} />
                      {run.binding_level}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-elevated/70 p-2.5 border border-surface-border/50 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block">Affinity (pKd)</span>
                      <span className="text-base font-bold text-emerald-400">
                        {run.pkd.toFixed(3)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block">Dissociation (Kd)</span>
                      <span className="text-base font-bold text-teal-300">
                        {formatKd(run.kd_nM)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>Spread: {run.uncertainty == null ? "Not estimated" : `±${run.uncertainty.toFixed(3)}`}</span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <Calendar className="h-3 w-3" />
                      {new Date(run.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>

                <div className="p-3 pt-0 flex items-center justify-between border-t border-surface-border/50 mt-1">
                  <button
                    onClick={() => handleCopySmiles(run.smiles, run.id)}
                    className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedId === run.id ? "Copied" : "Copy SMILES"}
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRun(run)}
                    className="h-7 text-xs text-brand-400 hover:text-brand-300 gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect Run
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-surface-border p-12 text-center">
          <History className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No Historical Runs Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Execute affinity predictions in the Predictor Studio to automatically populate this workspace.
          </p>
          <Link href="/predict">
            <Button variant="glow" size="sm">
              <FlaskConical className="h-3.5 w-3.5 mr-1" />
              Go to Predictor Studio
            </Button>
          </Link>
        </Card>
      )}

      {/* Inspection Modal Dialog */}
      {selectedRun && (
        <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-brand-400" />
              Inspection: {selectedRun.compound_name} + {selectedRun.target_id}
            </DialogTitle>
            <DialogDescription>
              Recorded on {new Date(selectedRun.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* Metric grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-surface-border bg-surface-elevated p-3">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">Predicted pKd</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {selectedRun.pkd.toFixed(3)}
                </div>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-elevated p-3">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">Equilibrium Kd</span>
                <div className="text-2xl font-bold font-mono text-teal-300">
                  {formatKd(selectedRun.kd_nM)}
                </div>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-elevated p-3">
                <span className="text-[10px] text-zinc-400 uppercase font-mono">Uncertainty (σ)</span>
                <div className="text-2xl font-bold font-mono text-cyan-300">
                  {selectedRun.uncertainty == null ? "Not estimated" : `±${selectedRun.uncertainty.toFixed(3)}`}
                </div>
              </div>
            </div>

            {/* SMILES */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">SMILES String:</label>
              <div className="rounded-lg bg-surface-elevated p-2 font-mono text-[11px] text-zinc-300 break-all border border-surface-border">
                {selectedRun.smiles}
              </div>
            </div>

            {/* Target Details */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">Target Protein:</label>
              <p className="text-zinc-400">{selectedRun.target_name} ({selectedRun.target_id})</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(selectedRun, null, 2));
              }}
              className="text-xs"
            >
              Copy JSON
            </Button>
            <Button
              variant="glow"
              size="sm"
              onClick={() => {
                router.push("/predict");
              }}
              className="text-xs"
            >
              Load into Predictor Studio
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
