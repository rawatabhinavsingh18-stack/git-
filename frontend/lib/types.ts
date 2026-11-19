export type BindingCategory =
  | "Very High Binding"
  | "High Binding"
  | "Moderate Binding"
  | "No Significant Binding";

export interface PredictionRequest {
  smiles?: string;
  compound_name?: string;
  protein_sequence: string;
  target_name?: string;
}

export interface BaselineComparison {
  model: string;
  ci: number;
  mse: number;
  r2m: number;
  aupr: number;
}

export interface ResidueInteraction {
  pos: number;
  residue: string;
  score: number; // 0 to 1 normalized interaction attention
  isPocket?: boolean;
}

export interface PredictionResult {
  id: string;
  compound_name?: string;
  smiles: string;
  target_name?: string;
  protein_sequence: string;
  pkd: number;
  kd_nM: number;
  uncertainty: number | null;
  confidence_index: number | null;
  binds: boolean;
  binding_level: BindingCategory;
  binding_explanation: string;
  created_at: string;
  is_mock?: boolean;
  baselines: BaselineComparison[];
  residues: ResidueInteraction[];
}

export interface BatchItem {
  id: string;
  compound_name: string;
  smiles: string;
  target_id: string;
  target_sequence: string;
  pkd?: number;
  kd_nM?: number;
  uncertainty?: number | null;
  binding_level?: BindingCategory;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

export interface HistoryItem {
  id: string;
  compound_name: string;
  smiles: string;
  target_id: string;
  target_name: string;
  protein_sequence: string;
  pkd: number;
  kd_nM: number;
  uncertainty: number | null;
  binding_level: BindingCategory;
  status: "completed" | "failed";
  created_at: string;
  notes?: string;
}

export interface ChemicalPreset {
  name: string;
  category: string;
  smiles: string;
  formula: string;
  weight: number;
  description: string;
}

export interface ProteinPreset {
  id: string;
  name: string;
  uniprot: string;
  organism: string;
  length: number;
  sequence: string;
  description: string;
}

export interface EngineStatus {
  online: boolean;
  model_version: string;
  dataset: string;
  device: "cuda" | "cpu";
  latency_ms: number;
  mode: "pytorch-remote" | "offline";
}
