"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FlaskConical,
  Sparkles,
  Zap,
  AlertCircle,
  Copy,
  Download,
  Bookmark,
  Share2,
  RefreshCw,
  Sliders,
  Dna,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MolecularStructurePreview } from "@/components/chemistry/structure-preview";
import { SAMPLE_COMPOUNDS, SAMPLE_PROTEINS } from "@/lib/mock-data";
import { predictAffinity } from "@/lib/api";
import { PredictionResult, BindingCategory } from "@/lib/types";
import {
  formatKd,
  getBindingBadgeStyles,
  validateSmiles,
  validateProteinSequence,
  exportToJson,
} from "@/lib/utils";

function PredictorStudioContent() {
  const searchParams = useSearchParams();
  const urlSmiles = searchParams.get("smiles") ?? "";
  const urlName = searchParams.get("name") ?? "";

  const [selectedCompoundPreset, setSelectedCompoundPreset] = useState<string>(urlSmiles ? "" : "Dasatinib");
  const [compoundName, setCompoundName] = useState<string>(urlName || "Dasatinib");
  const [smiles, setSmiles] = useState<string>(urlSmiles || SAMPLE_COMPOUNDS[0].smiles);

  // Sync when URL params change (navigating from PubChem search)
  useEffect(() => {
    if (urlSmiles) {
      setSmiles(urlSmiles);
      setSelectedCompoundPreset("");
    }
    if (urlName) setCompoundName(urlName);
  }, [urlSmiles, urlName]);

  const [selectedProteinPreset, setSelectedProteinPreset] = useState<string>("ABL1");
  const [targetName, setTargetName] = useState<string>("ABL1 Kinase");
  const [proteinSeq, setProteinSeq] = useState<string>(SAMPLE_PROTEINS[0].sequence);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Validation
  const smilesValidation = validateSmiles(smiles);
  const proteinValidation = validateProteinSequence(proteinSeq);

  const handleCompoundPresetChange = (name: string) => {
    setSelectedCompoundPreset(name);
    const found = SAMPLE_COMPOUNDS.find((c) => c.name === name);
    if (found) {
      setCompoundName(found.name);
      setSmiles(found.smiles);
    }
  };

  const handleProteinPresetChange = (id: string) => {
    setSelectedProteinPreset(id);
    const found = SAMPLE_PROTEINS.find((p) => p.id === id);
    if (found) {
      setTargetName(found.name);
      setProteinSeq(found.sequence);
    }
  };

  const handleRunPrediction = async () => {
    if (!smilesValidation.valid) {
      setErrorMsg("Please enter a valid SMILES string.");
      return;
    }
    if (!proteinValidation.valid) {
      setErrorMsg("Please enter a valid amino acid sequence.");
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const pred = await predictAffinity({
        smiles: smiles.trim(),
        compound_name: compoundName.trim(),
        protein_sequence: proteinSeq.trim(),
        target_name: targetName.trim(),
      });
      setResult(pred);
    } catch (err: any) {
      setErrorMsg(err?.message || "Prediction request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSaveToWorkspace = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportSummary = () => {
    if (!result) return;
    exportToJson(`deepdta_inference_${result.compound_name || "ligand"}_${Date.now()}.json`, result);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-brand-400" />
            Predictor Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Predict affinity ($pK_d$) and estimated dissociation ($K_d$) with the trained DeepDTACNN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleCompoundPresetChange("Dasatinib");
              handleProteinPresetChange("ABL1");
            }}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset Defaults
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Workbench (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ligand Input Card */}
          <Card className="border-surface-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-400" />
                  Ligand Molecule Input
                </CardTitle>
                <span className="text-[10px] font-mono text-zinc-400">Chemical SMILES</span>
              </div>
              <CardDescription>
                Select a validated kinase inhibitor or enter a custom compound name & SMILES.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Presets Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Quick-Select Preset Compound:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SAMPLE_COMPOUNDS.slice(0, 8).map((comp) => (
                    <button
                      key={comp.name}
                      onClick={() => handleCompoundPresetChange(comp.name)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all truncate ${
                        selectedCompoundPreset === comp.name
                          ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                          : "bg-surface-elevated text-zinc-400 border-surface-border hover:text-white"
                      }`}
                      title={comp.name}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compound Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Compound / Drug Name:</label>
                <Input
                  value={compoundName}
                  onChange={(e) => setCompoundName(e.target.value)}
                  placeholder="e.g. Dasatinib, Lapatinib, Aspirin"
                  className="font-sans text-xs"
                />
              </div>

              {/* SMILES String Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Canonical SMILES:</label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {smiles.length} chars
                  </span>
                </div>
                <Textarea
                  value={smiles}
                  onChange={(e) => {
                    setSmiles(e.target.value);
                    setSelectedCompoundPreset("");
                  }}
                  placeholder="e.g. CC1=C(C(=CC=C1)Cl)NC(=O)..."
                  className="h-20 text-xs"
                />
              </div>

              {/* Live 2D Molecular Structure Preview */}
              <MolecularStructurePreview
                smiles={smiles}
                compoundName={compoundName}
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* Target Protein Input Card */}
          <Card className="border-surface-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Dna className="h-4 w-4 text-teal-400" />
                  Target Protein Input
                </CardTitle>
                <span className="text-[10px] font-mono text-zinc-400">FASTA Sequence</span>
              </div>
              <CardDescription>
                Choose a benchmark kinase domain or paste an amino acid sequence.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Presets Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Benchmark Target Kinase:</label>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_PROTEINS.map((prot) => (
                    <button
                      key={prot.id}
                      onClick={() => handleProteinPresetChange(prot.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        selectedProteinPreset === prot.id
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                          : "bg-surface-elevated text-zinc-400 border-surface-border hover:text-white"
                      }`}
                    >
                      <div className="font-bold">{prot.id}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{prot.uniprot}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Target Identifier:</label>
                <Input
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="e.g. Tyrosine-protein kinase ABL1"
                  className="text-xs"
                />
              </div>

              {/* Protein Sequence */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Amino Acid Sequence:</label>
                  <span className="text-[10px] text-teal-400 font-mono">
                    {proteinValidation.length} residues
                  </span>
                </div>
                <Textarea
                  value={proteinSeq}
                  onChange={(e) => {
                    setProteinSeq(e.target.value);
                    setSelectedProteinPreset("");
                  }}
                  placeholder="MKWVTFISLLFLFSSAY..."
                  className="h-28 text-xs font-mono uppercase"
                />
              </div>
            </CardContent>
          </Card>

          {/* Primary CTA Button */}
          <Button
            variant="glow"
            size="lg"
            className="w-full h-12 text-sm font-bold tracking-wide gap-2"
            onClick={handleRunPrediction}
            isLoading={isLoading}
          >
            <Zap className="h-4 w-4" />
            {isLoading ? "Featurizing & Computing Ensemble..." : "Run Binding Affinity Inference"}
          </Button>
        </div>

        {/* Right Column: Results Panel (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Primary Affinity Verdict Card */}
              <Card className="border-surface-border relative overflow-hidden bg-gradient-to-br from-surface-card to-[#0A111E]">
                <div className="absolute right-0 top-0 h-32 w-32 bg-brand-500/10 blur-2xl pointer-events-none" />

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        Inference Output
                      </span>
                      <h2 className="text-xl font-bold text-white mt-0.5">
                        {result.compound_name || "Compound"} + {result.target_name || "Target"}
                      </h2>
                    </div>

                    {/* Badge */}
                    {(() => {
                      const styles = getBindingBadgeStyles(result.binding_level);
                      return (
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles.badgeClass} ${styles.glowClass}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${styles.dotColor}`} />
                          {result.binding_level}
                        </div>
                      );
                    })()}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-3">
                  {/* Metric Trio */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-surface-border bg-surface-elevated/80 p-4">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase">
                        Predicted Affinity
                      </span>
                      <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                        {result.pkd.toFixed(3)}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        pK<sub>d</sub> = -log<sub>10</sub>(K<sub>d</sub> / 10<sup>9</sup>)
                      </span>
                    </div>

                    <div className="rounded-xl border border-surface-border bg-surface-elevated/80 p-4">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase">
                        Equilibrium Dissociation
                      </span>
                      <div className="text-3xl font-extrabold font-mono text-teal-300 mt-1">
                        {formatKd(result.kd_nM)}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Dissociation constant (K<sub>d</sub>)
                      </span>
                    </div>

                    <div className="rounded-xl border border-surface-border bg-surface-elevated/80 p-4">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase">
                        Uncertainty Spread
                      </span>
                      <div className="text-3xl font-extrabold font-mono text-cyan-300 mt-1">
                        {result.uncertainty == null ? "Not estimated" : `±${result.uncertainty.toFixed(3)}`}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {result.uncertainty == null ? "Single CNN; no ensemble spread" : "Model disagreement (σ)"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 text-xs text-zinc-400">
                    This single CNN returns a point estimate. It does not provide a calibrated confidence score, binding pose, or residue-level contacts.
                  </div>

                  {/* Biological Interpretation summary */}
                  <div className="rounded-lg bg-brand-500/10 border border-brand-500/20 p-3 text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-brand-300">Model output:</strong>{" "}
                    {result.binding_explanation}
                  </div>

                  {/* Quick Action Drawer / Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-surface-border/50">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveToWorkspace}
                      className="gap-1.5 text-xs"
                    >
                      <Bookmark className="h-3.5 w-3.5 text-brand-400" />
                      {savedSuccess ? "Saved to Workspace!" : "Save to Workspace"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyJson}
                      className="gap-1.5 text-xs"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copySuccess ? "JSON Copied!" : "Copy Raw JSON"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportSummary}
                      className="gap-1.5 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export Summary (.json)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recharts: Benchmark Baselines Comparison */}
              <Card className="border-surface-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Davis Benchmark Concordance Index (CI)
                    </CardTitle>
                    <span className="text-[10px] font-mono text-zinc-400">Random Test Split</span>
                  </div>
                  <CardDescription>
                    Reported benchmark scores for the CNN and published baselines; these are not recomputed for this prediction.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[210px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={result.baselines}
                        margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                      >
                        <XAxis
                          dataKey="model"
                          tick={{ fill: "#94A3B8", fontSize: 9.5 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis
                          domain={[0.45, 1.0]}
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111622",
                            borderColor: "#1F293D",
                            borderRadius: "8px",
                            fontSize: "11px",
                            color: "#fff",
                          }}
                          formatter={(value: any) => [`CI: ${Number(value).toFixed(4)}`, "Concordance"]}
                        />
                        <ReferenceLine y={0.878} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "Paper 0.878", fill: "#EF4444", fontSize: 9 }} />
                        <Bar dataKey="ci" radius={[4, 4, 0, 0]}>
                          {result.baselines.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.model.includes("Ensemble")
                                  ? "#10B981"
                                  : entry.model.includes("GBM")
                                  ? "#14B8A6"
                                  : entry.model.includes("CNN")
                                  ? "#3B82F6"
                                  : "#475569"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* The CNN returns affinity only; no residue attribution is trained. */}
              <Card className="border-surface-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Dna className="h-4 w-4 text-teal-400" />
                      Residue-Level Interpretation
                    </CardTitle>
                    <span className="text-[10px] font-mono text-zinc-400">Not calculated</span>
                  </div>
                  <CardDescription>
                    The trained CNN predicts affinity from sequences and does not identify binding residues or contacts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-surface-border bg-surface-elevated/40 p-4 text-xs text-zinc-400">
                    Residue attribution would require a model trained to explain or localize interactions. This checkpoint only outputs a binding-affinity estimate.
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Empty State Waiting for Prediction */
            <Card className="border-dashed border-surface-border flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated/80 border border-surface-border text-brand-400 mb-4 shadow-glow">
                <FlaskConical className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white">Inference Engine Ready</h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6 leading-relaxed">
                Configure your ligand molecule and target protein on the left workbench and click{" "}
                <strong className="text-zinc-200">"Run Binding Affinity Inference"</strong> to compute
                predictions.
              </p>
              <Button
                variant="secondary"
                size="md"
                onClick={handleRunPrediction}
                isLoading={isLoading}
                className="gap-2 text-xs"
              >
                <Zap className="h-3.5 w-3.5 text-brand-400" />
                Run Benchmark Pair (Dasatinib + ABL1)
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PredictorStudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading Predictor Studio...</div>}>
      <PredictorStudioContent />
    </Suspense>
  );
}
