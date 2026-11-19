"use client";

import React, { useMemo } from "react";
import { validateSmiles } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface StructurePreviewProps {
  smiles: string;
  compoundName?: string;
  className?: string;
}

interface AtomNode {
  id: number;
  symbol: string;
  x: number;
  y: number;
  color: string;
  charge?: string;
}

interface BondLine {
  id: string;
  source: AtomNode;
  target: AtomNode;
  isDouble?: boolean;
  isTriple?: boolean;
}

const ATOM_COLORS: Record<string, string> = {
  C: "#E2E8F0", // Slate 200
  N: "#60A5FA", // Blue 400
  O: "#F87171", // Red 400
  S: "#FBBF24", // Amber 400
  Cl: "#34D399", // Emerald 400
  F: "#38BDF8", // Sky 400
  Br: "#F97316", // Orange 500
  P: "#FB923C", // Orange 400
};

export const MolecularStructurePreview: React.FC<StructurePreviewProps> = ({
  smiles,
  compoundName,
  className = "",
}) => {
  const { valid, invalidChars } = useMemo(() => validateSmiles(smiles), [smiles]);

  const { nodes, bonds, ringsCount, heteroCount } = useMemo(() => {
    if (!valid || !smiles.trim()) {
      return { nodes: [], bonds: [], ringsCount: 0, heteroCount: 0 };
    }

    const clean = smiles.trim();
    const atomList: AtomNode[] = [];
    const bondList: BondLine[] = [];
    const ringClosures: Record<number, number> = {};

    let currentX = 140;
    let currentY = 100;
    let currentAngle = 0;
    const bondLength = 26;

    let atomIdCounter = 0;
    let prevAtom: AtomNode | null = null;
    let doubleNext = false;
    let tripleNext = false;
    let rCount = 0;
    let hCount = 0;

    const stack: { x: number; y: number; angle: number; atom: AtomNode | null }[] = [];

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];

      if (char === "(") {
        stack.push({
          x: currentX,
          y: currentY,
          angle: currentAngle,
          atom: prevAtom,
        });
        currentAngle += 60; // Branch off
        continue;
      }

      if (char === ")") {
        const popped = stack.pop();
        if (popped) {
          currentX = popped.x;
          currentY = popped.y;
          currentAngle = popped.angle - 60;
          prevAtom = popped.atom;
        }
        continue;
      }

      if (char === "=") {
        doubleNext = true;
        continue;
      }
      if (char === "#") {
        tripleNext = true;
        continue;
      }

      // Ring number handling (e.g. 1, 2)
      if (/[0-9]/.test(char)) {
        const ringDigit = parseInt(char, 10);
        if (ringClosures[ringDigit] !== undefined) {
          const originAtomId = ringClosures[ringDigit];
          const originAtom = atomList.find((a) => a.id === originAtomId);
          if (originAtom && prevAtom && originAtom.id !== prevAtom.id) {
            bondList.push({
              id: `ring-${originAtom.id}-${prevAtom.id}`,
              source: prevAtom,
              target: originAtom,
            });
            rCount++;
          }
          delete ringClosures[ringDigit];
        } else if (prevAtom) {
          ringClosures[ringDigit] = prevAtom.id;
        }
        continue;
      }

      // Check atom symbols
      let sym = "";
      if (char === "C" && clean[i + 1] === "l") {
        sym = "Cl";
        i++;
      } else if (char === "B" && clean[i + 1] === "r") {
        sym = "Br";
        i++;
      } else if (/[A-Z]/.test(char)) {
        sym = char;
      } else if (/[a-z]/.test(char)) {
        sym = char.toUpperCase();
      }

      if (sym) {
        if (sym !== "C") hCount++;

        // Zigzag rotation
        currentAngle += atomIdCounter % 2 === 0 ? 30 : -30;
        const rad = (currentAngle * Math.PI) / 180;
        currentX += Math.cos(rad) * bondLength;
        currentY += Math.sin(rad) * bondLength;

        const node: AtomNode = {
          id: atomIdCounter++,
          symbol: sym,
          x: currentX,
          y: currentY,
          color: ATOM_COLORS[sym] || "#CBD5E1",
        };

        atomList.push(node);

        if (prevAtom) {
          bondList.push({
            id: `b-${prevAtom.id}-${node.id}`,
            source: prevAtom,
            target: node,
            isDouble: doubleNext,
            isTriple: tripleNext,
          });
        }

        prevAtom = node;
        doubleNext = false;
        tripleNext = false;
      }
    }

    // Auto-fit & center nodes within SVG bounding box (320 x 200)
    if (atomList.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      atomList.forEach((n) => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      });

      const width = maxX - minX || 1;
      const height = maxY - minY || 1;
      const padding = 28;
      const scale = Math.min((280 - padding * 2) / width, (170 - padding * 2) / height, 1.4);

      const targetCenterX = 150;
      const targetCenterY = 95;
      const currentCenterX = (minX + maxX) / 2;
      const currentCenterY = (minY + maxY) / 2;

      atomList.forEach((n) => {
        n.x = targetCenterX + (n.x - currentCenterX) * scale;
        n.y = targetCenterY + (n.y - currentCenterY) * scale;
      });
    }

    return {
      nodes: atomList,
      bonds: bondList,
      ringsCount: rCount,
      heteroCount: hCount,
    };
  }, [smiles, valid]);

  return (
    <div
      className={`relative rounded-xl border border-surface-border bg-surface-card/80 p-4 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-500/10 text-brand-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            {compoundName ? `${compoundName} 2D Structure` : "2D Molecular Wireframe"}
          </span>
        </div>

        {valid ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Valid SMILES ({nodes.length} atoms)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
            <AlertCircle className="h-3 w-3" />
            Invalid syntax
          </span>
        )}
      </div>

      <div className="relative flex h-[190px] w-full items-center justify-center overflow-hidden rounded-lg bg-[#070A0F] border border-surface-border/40">
        {valid && nodes.length > 0 ? (
          <svg className="h-full w-full select-none" viewBox="0 0 300 190">
            <defs>
              <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ambient center background glow */}
            <circle cx="150" cy="95" r="90" fill="url(#glowGrad)" />

            {/* Bonds */}
            {bonds.map((bond) => {
              const dx = bond.target.x - bond.source.x;
              const dy = bond.target.y - bond.source.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const offsetX = (-dy / len) * 2.2;
              const offsetY = (dx / len) * 2.2;

              if (bond.isDouble) {
                return (
                  <g key={bond.id}>
                    <line
                      x1={bond.source.x + offsetX}
                      y1={bond.source.y + offsetY}
                      x2={bond.target.x + offsetX}
                      y2={bond.target.y + offsetY}
                      stroke="#4B5563"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <line
                      x1={bond.source.x - offsetX}
                      y1={bond.source.y - offsetY}
                      x2={bond.target.x - offsetX}
                      y2={bond.target.y - offsetY}
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                );
              }

              return (
                <line
                  key={bond.id}
                  x1={bond.source.x}
                  y1={bond.source.y}
                  x2={bond.target.x}
                  y2={bond.target.y}
                  stroke="#475569"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Atoms */}
            {nodes.map((node) => {
              const isCarbon = node.symbol === "C";
              return (
                <g key={`atom-${node.id}`} className="transition-transform duration-200 hover:scale-125">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCarbon ? 3.5 : 9}
                    fill={isCarbon ? "#64748B" : "#0B0F17"}
                    stroke={node.color}
                    strokeWidth={isCarbon ? 1.5 : 2}
                  />
                  {!isCarbon && (
                    <text
                      x={node.x}
                      y={node.y + 3.5}
                      textAnchor="middle"
                      fill={node.color}
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.symbol}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="h-7 w-7 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400">
              {invalidChars.length > 0
                ? `Unrecognized character(s): ${invalidChars.join(", ")}`
                : "Enter or select a valid SMILES string to render molecular wireframe."}
            </p>
          </div>
        )}

        {/* Floating Chem Informatics pills */}
        {valid && nodes.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1.5 text-[9px] font-mono text-zinc-400">
            <span className="rounded bg-surface-100/90 px-1.5 py-0.5 border border-surface-border">
              Nodes: {nodes.length}
            </span>
            <span className="rounded bg-surface-100/90 px-1.5 py-0.5 border border-surface-border">
              Hetero: {heteroCount}
            </span>
            <span className="rounded bg-surface-100/90 px-1.5 py-0.5 border border-surface-border">
              Rings: {ringsCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
