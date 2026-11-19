import { NextRequest, NextResponse } from "next/server";
import { PredictionRequest, PredictionResult } from "@/lib/types";

export const runtime = "nodejs";

const FASTAPI_URL = process.env.DEEPDTA_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body: PredictionRequest = await req.json();
    if (!body.protein_sequence?.trim()) {
      return NextResponse.json({ error: "Protein sequence is required." }, { status: 400 });
    }
    if (!body.smiles?.trim() && !body.compound_name?.trim()) {
      return NextResponse.json({ error: "Enter a compound name or SMILES string." }, { status: 400 });
    }

    const backendRes = await fetch(`${FASTAPI_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smiles: body.smiles,
        compound_name: body.compound_name,
        protein_sequence: body.protein_sequence,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.detail || "The prediction backend rejected the request." },
        { status: backendRes.status }
      );
    }

    const result: PredictionResult = {
      id: `run-${Date.now()}`,
      compound_name: data.compound_name || body.compound_name,
      smiles: data.smiles || body.smiles || "",
      target_name: body.target_name || "Target Protein",
      protein_sequence: body.protein_sequence,
      pkd: data.pkd,
      kd_nM: data.kd_nM,
      uncertainty: data.uncertainty ?? null,
      confidence_index: null,
      binds: data.binds,
      binding_level: data.binding_level,
      binding_explanation: "Predicted by the trained DeepDTACNN checkpoint. This sequence model does not calculate a binding pose or identify contact residues.",
      created_at: new Date().toISOString(),
      is_mock: false,
      baselines: [
        { model: "DeepDTA+ CNN (reported benchmark)", ci: 0.8866, mse: 0.258, r2m: 0.638, aupr: 0.716 },
        { model: "DeepDTA CNN (original paper)", ci: 0.878, mse: 0.261, r2m: 0.63, aupr: 0.714 },
        { model: "SimBoost (reported baseline)", ci: 0.872, mse: 0.282, r2m: 0.644, aupr: 0.703 },
      ],
      residues: [],
    };
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction service is unavailable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
