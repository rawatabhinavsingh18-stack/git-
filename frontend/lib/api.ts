import { EngineStatus, PredictionRequest, PredictionResult, BatchItem, HistoryItem } from "./types";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const HISTORY_STORAGE_KEY = "deepdta_plus_history_v1";

export async function checkEngineStatus(): Promise<EngineStatus> {
  const startTime = performance.now();
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // 2-second timeout to quickly fall back
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        model_version: data.model || data.model_version || "DeepDTACNN",
        dataset: data.dataset || "Davis",
        device: data.device === "cuda" ? "cuda" : "cpu",
        latency_ms: Math.round(performance.now() - startTime),
        mode: "pytorch-remote",
      };
    }
  } catch {
    // Expected fallback when local ML service is inactive
  }

  return {
    online: false,
    model_version: "DeepDTACNN unavailable",
    dataset: "Davis",
    device: "cpu",
    latency_ms: Math.round(performance.now() - startTime),
    mode: "offline",
  };
}

export async function predictAffinity(request: PredictionRequest): Promise<PredictionResult> {
  const res = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Prediction failed. Check that the model API is running.");
  const result: PredictionResult = data;
  saveRunToHistory(result);
  return result;
}

export async function predictBatch(items: BatchItem[]): Promise<BatchItem[]> {
  const res = await fetch("/api/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Batch prediction failed. Check that the model API is running.");
  return data.items;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRunToHistory(result: PredictionResult): void {
  if (typeof window === "undefined") return;
  try {
    const current = getHistory();
    const newItem: HistoryItem = {
      id: result.id,
      compound_name: result.compound_name || "Unknown Compound",
      smiles: result.smiles,
      target_id: result.target_name || "Target",
      target_name: result.target_name || "Kinase Domain",
      protein_sequence: result.protein_sequence,
      pkd: result.pkd,
      kd_nM: result.kd_nM,
      uncertainty: result.uncertainty,
      binding_level: result.binding_level,
      status: "completed",
      created_at: result.created_at,
    };
    const updated = [newItem, ...current.filter((x) => x.id !== newItem.id)].slice(0, 50);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors in private browsing
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}
