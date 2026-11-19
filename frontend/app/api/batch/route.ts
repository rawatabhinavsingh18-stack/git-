import { NextRequest, NextResponse } from "next/server";
import { BatchItem } from "@/lib/types";

export const runtime = "nodejs";

const FASTAPI_URL = process.env.DEEPDTA_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: BatchItem[] = body.items;
    if (!Array.isArray(items) || items.length === 0 || items.length > 256) {
      return NextResponse.json({ error: "Submit between 1 and 256 compounds." }, { status: 400 });
    }

    const backendRes = await fetch(`${FASTAPI_URL}/predict_batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          smiles: item.smiles,
          compound_name: item.compound_name,
          protein_sequence: item.target_sequence,
        })),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json({ error: data.detail || "Batch prediction failed." }, { status: backendRes.status });
    }

    const updatedItems: BatchItem[] = items.map((item, idx) => {
      const result = data[idx];
      return {
        ...item,
        smiles: result.smiles || item.smiles,
        compound_name: result.compound_name || item.compound_name,
        pkd: result.pkd,
        kd_nM: result.kd_nM,
        uncertainty: result.uncertainty ?? undefined,
        binding_level: result.binding_level,
        status: "completed",
      };
    });
    return NextResponse.json({ items: updatedItems });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Batch prediction service is unavailable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
