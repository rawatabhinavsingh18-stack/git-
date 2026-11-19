"use client";

import React from "react";
import {
  Cpu,
  Layers,
  GitMerge,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Code2,
  Dna,
  FlaskConical,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ARCHITECTURE_STEPS = [
  {
    id: "drug",
    icon: <FlaskConical className="h-5 w-5 text-brand-400" />,
    title: "Drug Branch (SMILES Input)",
    color: "brand",
    steps: [
      { label: "SMILES Text", desc: "Raw canonical SMILES string (max 85 chars, zero-padded)", code: "CC(=O)Nc1ccc(O)cc1" },
      { label: "RDKit Validation", desc: "RDKit checks the molecule and enriches with chemistry-aware features (MW, XLogP, HBD/HBA)" },
      { label: "Character Encoding", desc: "SMILES characters mapped to integer tokens using a fixed 64-char vocabulary" },
      { label: "Embedding Layer (128-d)", desc: "Each token becomes a 128-dimensional learnable vector" },
      { label: "Conv1D ×3", desc: "3 convolutional layers with 32, 64, 96 filters and kernel size 8 each" },
      { label: "Global Max Pool", desc: "One summary vector per drug representation" },
    ],
  },
  {
    id: "protein",
    icon: <Dna className="h-5 w-5 text-teal-400" />,
    title: "Protein Branch (Sequence Input)",
    color: "teal",
    steps: [
      { label: "Amino Acid Sequence", desc: "FASTA sequence (max 1200 residues, zero-padded)", code: "MKTAYIAKQRQISFVK…" },
      { label: "Residue Encoding", desc: "25 amino acid symbols + gap character mapped to integers" },
      { label: "Embedding Layer (128-d)", desc: "Each residue token becomes a 128-dimensional learnable vector" },
      { label: "Conv1D ×3", desc: "3 convolutional layers with 32, 64, 96 filters and kernel size 12 each" },
      { label: "Global Max Pool", desc: "One summary vector per protein representation" },
    ],
  },
];

const DENSE_LAYERS = [
  { label: "Concatenate", desc: "Drug + Protein vectors merged into one joint representation", size: "192-d" },
  { label: "Dense 1024", desc: "Fully connected layer with ReLU activation + 10% dropout", size: "1024-d" },
  { label: "Dense 1024", desc: "Second dense layer with ReLU activation + 10% dropout", size: "1024-d" },
  { label: "Dense 512", desc: "Dimensionality reduction before final prediction", size: "512-d" },
  { label: "Output (pKd)", desc: "Single neuron predicts the equilibrium dissociation constant in pKd units", size: "1-d" },
];

const HYPERPARAMS = [
  { key: "SMILES max length", value: "85" },
  { key: "Protein max length", value: "1200" },
  { key: "Embedding dimension", value: "128" },
  { key: "Conv filters", value: "32 → 64 → 96" },
  { key: "Dense layers", value: "1024 → 1024 → 512 → 1" },
  { key: "Dropout rate", value: "0.1" },
  { key: "Loss function", value: "Mean Squared Error (MSE)" },
  { key: "Optimizer", value: "Adam (lr=0.001)" },
  { key: "Batch size", value: "256" },
  { key: "Epochs", value: "100 (early stopping)" },
  { key: "Framework", value: "PyTorch" },
  { key: "Chemistry toolkit", value: "RDKit" },
];

export default function ModelViewPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-brand-400" />
            Model Architecture
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Understand how the PyTorch CNN processes SMILES and protein sequences.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="brand">PyTorch CNN</Badge>
          <Badge variant="cyan">RDKit Validation</Badge>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="border-surface-border bg-gradient-to-br from-surface-card to-[#0A111E] relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 bg-brand-500/10 blur-3xl pointer-events-none" />
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">DeepDTA: Dual-Branch CNN Architecture</CardTitle>
          <CardDescription>
            Original paper: Öztürk et al., 2018 · Bioinformatics 34(17) · PyTorch implementation with RDKit input validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
            DeepDTA uses <strong className="text-white">two independent CNN branches</strong> — one for the drug molecule (SMILES) and one for the target protein (amino acid sequence). Each branch learns sequence features through convolutional layers, then both are <strong className="text-white">concatenated and passed to shared fully-connected layers</strong> that predict pKd. <strong className="text-brand-300">RDKit</strong> parses and canonicalizes SMILES before the CNN tokenizes the string; the model does not consume molecular graphs or calculate a binding pose.
          </p>
        </CardContent>
      </Card>

      {/* Two Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ARCHITECTURE_STEPS.map((branch) => (
          <Card key={branch.id} className="border-surface-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {branch.icon}
                {branch.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {branch.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    branch.id === "drug"
                      ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                      : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-zinc-200">{step.label}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{step.desc}</div>
                    {"code" in step && step.code && (
                      <div className="mt-1 rounded bg-surface-elevated border border-surface-border px-2 py-1 font-mono text-[10px] text-zinc-300">
                        {step.code}
                      </div>
                    )}
                  </div>
                  {i < branch.steps.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-zinc-600 mt-1 shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Join + Dense Layers */}
      <Card className="border-surface-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-cyan-400" />
            Fusion & Prediction Head
          </CardTitle>
          <CardDescription>Both branches are concatenated, then fed through dense layers to produce the final pKd score.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {DENSE_LAYERS.map((layer, i) => (
              <React.Fragment key={i}>
                <div className="rounded-lg border border-surface-border bg-surface-elevated/60 p-3 text-center min-w-[110px]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">{layer.size}</div>
                  <div className="text-xs font-bold text-zinc-200 mt-0.5">{layer.label}</div>
                  <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed max-w-[150px]">{layer.desc}</div>
                </div>
                {i < DENSE_LAYERS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hyperparameters */}
      <Card className="border-surface-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-400" />
            Model Hyperparameters
          </CardTitle>
          <CardDescription>Settings used in the original paper and replicated in our PyTorch implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {HYPERPARAMS.map((hp) => (
              <div key={hp.key} className="rounded-lg border border-surface-border bg-surface-elevated/40 p-2.5">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wide">{hp.key}</div>
                <div className="text-xs font-bold font-mono text-zinc-100 mt-0.5">{hp.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhancements vs Paper */}
      <Card className="border-surface-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            Our Enhancements vs. Original Paper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-2 pr-4 text-zinc-400 font-semibold">Aspect</th>
                  <th className="text-left py-2 pr-4 text-zinc-400 font-semibold">Original Paper</th>
                  <th className="text-left py-2 text-zinc-400 font-semibold">Our Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {[
                  ["Drug input", "SMILES characters only", "SMILES checked and enriched with RDKit chemical features"],
                  ["Framework", "Research code (Keras / TensorFlow)", "PyTorch CNN — easier to extend and deploy"],
                  ["Interface", "Research scripts, no user interface", "Full web app: Next.js frontend + FastAPI backend"],
                  ["Extra tools", "None", "PubChem search, molecule view, virtual screening"],
                  ["Evaluation", "Davis and KIBA benchmarks", "Same datasets + comparison with original on a held-out test set"],
                ].map(([aspect, original, ours]) => (
                  <tr key={aspect} className="group">
                    <td className="py-2 pr-4 font-semibold text-zinc-300">{aspect}</td>
                    <td className="py-2 pr-4 text-zinc-400">{original}</td>
                    <td className="py-2 text-brand-300 flex items-start gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                      {ours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Code Snippet */}
      <Card className="border-surface-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Code2 className="h-4 w-4 text-zinc-400" />
            PyTorch Model Skeleton
          </CardTitle>
          <CardDescription>Simplified architecture as implemented with PyTorch.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-[#0A0F1A] border border-surface-border p-4 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`import torch
import torch.nn as nn

class DeepDTA(nn.Module):
    def __init__(self, num_drug_tokens=64, num_protein_tokens=25,
                 embed_dim=128, drug_len=85, protein_len=1200):
        super().__init__()

        # Drug Branch
        self.drug_embed = nn.Embedding(num_drug_tokens, embed_dim, padding_idx=0)
        self.drug_conv = nn.Sequential(
            nn.Conv1d(embed_dim, 32, kernel_size=8, padding=4), nn.ReLU(),
            nn.Conv1d(32, 64, kernel_size=8, padding=4),         nn.ReLU(),
            nn.Conv1d(64, 96, kernel_size=8, padding=4),         nn.ReLU(),
        )

        # Protein Branch
        self.prot_embed = nn.Embedding(num_protein_tokens, embed_dim, padding_idx=0)
        self.prot_conv = nn.Sequential(
            nn.Conv1d(embed_dim, 32, kernel_size=12, padding=6), nn.ReLU(),
            nn.Conv1d(32, 64, kernel_size=12, padding=6),        nn.ReLU(),
            nn.Conv1d(64, 96, kernel_size=12, padding=6),        nn.ReLU(),
        )

        # Fusion Head
        self.fc = nn.Sequential(
            nn.Linear(192, 1024), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(1024, 1024), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(1024, 512),  nn.ReLU(),
            nn.Linear(512, 1),
        )

    def forward(self, drug_tok, prot_tok):
        d = self.drug_conv(self.drug_embed(drug_tok).permute(0, 2, 1))
        p = self.prot_conv(self.prot_embed(prot_tok).permute(0, 2, 1))
        d = d.max(dim=2).values   # Global Max Pool
        p = p.max(dim=2).values
        return self.fc(torch.cat([d, p], dim=1)).squeeze(-1)`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
