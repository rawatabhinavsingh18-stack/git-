"use client";

import React, { useState } from "react";
import {
  Search,
  FlaskConical,
  Info,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Atom,
  Weight,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PubChemCompound {
  cid: number;
  iupacName: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSMILES: string;
  isomericSMILES: string;
  inchiKey: string;
  xlogp?: number;
  hbondDonorCount?: number;
  hbondAcceptorCount?: number;
  rotatableBondCount?: number;
  heavyAtomCount?: number;
  complexity?: number;
  synonyms: string[];
  description?: string;
}

const QUICK_SEARCHES = [
  "Paracetamol",
  "Aspirin",
  "Ibuprofen",
  "Caffeine",
  "Dasatinib",
  "Imatinib",
  "Erlotinib",
  "Gefitinib",
];

async function fetchPubChemData(name: string): Promise<PubChemCompound> {
  // Search for CID
  const cidRes = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`
  );
  if (!cidRes.ok) throw new Error(`Compound "${name}" not found in PubChem`);
  const cidData = await cidRes.json();
  const cid = cidData.IdentifierList?.CID?.[0];
  if (!cid) throw new Error(`No CID found for "${name}"`);

  // Fetch properties
  const propRes = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChIKey,XLogP,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount,Complexity/JSON`
  );
  const propData = await propRes.json();
  const props = propData.PropertyTable?.Properties?.[0] ?? {};

  // Fetch synonyms
  let synonyms: string[] = [];
  try {
    const synRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`
    );
    const synData = await synRes.json();
    synonyms = synData.InformationList?.Information?.[0]?.Synonym?.slice(0, 8) ?? [];
  } catch {}

  return {
    cid,
    iupacName: props.IUPACName ?? "N/A",
    molecularFormula: props.MolecularFormula ?? "N/A",
    molecularWeight: props.MolecularWeight ?? 0,
    canonicalSMILES: props.CanonicalSMILES ?? "",
    isomericSMILES: props.IsomericSMILES ?? "",
    inchiKey: props.InChIKey ?? "N/A",
    xlogp: props.XLogP,
    hbondDonorCount: props.HBondDonorCount,
    hbondAcceptorCount: props.HBondAcceptorCount,
    rotatableBondCount: props.RotatableBondCount,
    heavyAtomCount: props.HeavyAtomCount,
    complexity: props.Complexity,
    synonyms,
  };
}

export default function CompoundSearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [compound, setCompound] = useState<PubChemCompound | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSmiles, setCopiedSmiles] = useState(false);

  const handleSearch = async (name?: string) => {
    const q = (name ?? query).trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    setCompound(null);
    try {
      const data = await fetchPubChemData(q);
      setCompound(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch compound data.");
    } finally {
      setIsLoading(false);
    }
  };

  const copySmiles = (smiles: string) => {
    navigator.clipboard.writeText(smiles);
    setCopiedSmiles(true);
    setTimeout(() => setCopiedSmiles(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Search className="h-6 w-6 text-brand-400" />
            PubChem Compound Search
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Look up any chemical compound and retrieve its structure, properties, and SMILES from PubChem.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-surface-border">
        <CardContent className="pt-5 space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by compound name (e.g. Paracetamol, Aspirin, Dasatinib)"
              className="flex-1 text-sm"
            />
            <Button
              variant="glow"
              onClick={() => handleSearch()}
              isLoading={isLoading}
              className="gap-1.5 px-5"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          {/* Quick Searches */}
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-400">Quick search:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleSearch(s); }}
                  className="px-2.5 py-1 rounded-lg text-xs border bg-surface-elevated text-zinc-300 border-surface-border hover:border-brand-500/40 hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}. Note: PubChem lookup requires internet access — make sure you&apos;re connected.</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-zinc-400 gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Querying PubChem database…</span>
        </div>
      )}

      {/* Result */}
      {compound && !isLoading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Main Info */}
          <Card className="border-surface-border bg-gradient-to-br from-surface-card to-[#0A111E]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl text-white">{compound.synonyms[0] ?? "Compound"}</CardTitle>
                    <Badge variant="brand">CID: {compound.cid}</Badge>
                  </div>
                  <CardDescription className="mt-1 text-xs font-mono leading-relaxed">
                    {compound.iupacName}
                  </CardDescription>
                </div>
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in PubChem
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Key Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: "Molecular Formula", value: compound.molecularFormula, icon: <Atom className="h-3.5 w-3.5 text-teal-400" /> },
                  { label: "Molecular Weight", value: `${compound.molecularWeight} g/mol`, icon: <Weight className="h-3.5 w-3.5 text-cyan-400" /> },
                  { label: "XLogP", value: compound.xlogp !== undefined ? String(compound.xlogp) : "N/A", icon: <Info className="h-3.5 w-3.5 text-brand-400" /> },
                  { label: "Heavy Atoms", value: compound.heavyAtomCount !== undefined ? String(compound.heavyAtomCount) : "N/A", icon: <Hash className="h-3.5 w-3.5 text-purple-400" /> },
                  { label: "H-Bond Donors", value: compound.hbondDonorCount !== undefined ? String(compound.hbondDonorCount) : "N/A", icon: <FlaskConical className="h-3.5 w-3.5 text-emerald-400" /> },
                  { label: "H-Bond Acceptors", value: compound.hbondAcceptorCount !== undefined ? String(compound.hbondAcceptorCount) : "N/A", icon: <FlaskConical className="h-3.5 w-3.5 text-emerald-400" /> },
                  { label: "Rotatable Bonds", value: compound.rotatableBondCount !== undefined ? String(compound.rotatableBondCount) : "N/A", icon: <Info className="h-3.5 w-3.5 text-zinc-400" /> },
                  { label: "Complexity", value: compound.complexity !== undefined ? String(compound.complexity) : "N/A", icon: <Info className="h-3.5 w-3.5 text-zinc-400" /> },
                ].map((p) => (
                  <div key={p.label} className="rounded-lg border border-surface-border bg-surface-elevated/60 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-wide mb-1">
                      {p.icon}
                      {p.label}
                    </div>
                    <div className="text-sm font-bold font-mono text-zinc-100">{p.value}</div>
                  </div>
                ))}
              </div>

              {/* Canonical SMILES */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Canonical SMILES</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copySmiles(compound.canonicalSMILES)}
                      className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {copiedSmiles ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="rounded-lg bg-surface-elevated border border-surface-border p-3 font-mono text-xs text-zinc-200 break-all leading-relaxed">
                  {compound.canonicalSMILES}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Copy this SMILES and paste it directly in the{" "}
                  <a href="/predict" className="text-brand-400 hover:underline">Predictor Studio</a> to run a binding affinity prediction.
                </p>
              </div>

              {/* InChI Key */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-300">InChI Key</span>
                <div className="rounded-lg bg-surface-elevated border border-surface-border p-2.5 font-mono text-xs text-zinc-400">
                  {compound.inchiKey}
                </div>
              </div>

              {/* Synonyms */}
              {compound.synonyms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-zinc-300">Common Names / Synonyms</span>
                  <div className="flex flex-wrap gap-1.5">
                    {compound.synonyms.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border text-[11px] text-zinc-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Use in Predictor CTA */}
              <div className="rounded-lg bg-brand-500/10 border border-brand-500/20 p-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="text-xs text-zinc-300">
                  <strong className="text-brand-300">Ready to predict?</strong> Use this compound&apos;s SMILES in the Predictor Studio to estimate binding affinity against a protein target.
                </div>
                <a href={`/predict?smiles=${encodeURIComponent(compound.canonicalSMILES)}&name=${encodeURIComponent(compound.synonyms[0] ?? "Compound")}`}>
                  <Button variant="glow" size="sm" className="gap-1.5 text-xs whitespace-nowrap">
                    <FlaskConical className="h-3.5 w-3.5" />
                    Open in Predictor
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {!compound && !isLoading && !error && (
        <Card className="border-dashed border-surface-border flex flex-col items-center justify-center p-14 text-center min-h-[300px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated/80 border border-surface-border text-brand-400 mb-4">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-white">Search PubChem</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
            Enter a compound name (e.g. Paracetamol, Dasatinib) to retrieve its molecular formula, weight, SMILES string, and other chemical properties live from PubChem.
          </p>
        </Card>
      )}
    </div>
  );
}
