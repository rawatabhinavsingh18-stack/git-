"""Load and serve the trained DeepDTACNN checkpoint."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import torch

from dtaplus.data import encode_protein, encode_smiles
from dtaplus.models.cnn import DeepDTACNN


class CNNPredictor:
    """Inference wrapper that uses the exact tokenization used during training."""

    def __init__(self, checkpoint_path: str | Path | None = None, device: str | None = None):
        project_root = Path(__file__).resolve().parents[1]
        self.checkpoint_path = Path(
            checkpoint_path
            or os.getenv("DEEPDTA_CHECKPOINT", project_root / "results/checkpoints/deepdta_cnn_best.pt")
        )
        requested_device = device or os.getenv("DEEPDTA_DEVICE", "auto")
        self.device = torch.device(
            "cuda" if requested_device == "auto" and torch.cuda.is_available()
            else "cpu" if requested_device == "auto"
            else requested_device
        )
        if not self.checkpoint_path.is_file():
            raise FileNotFoundError(f"CNN checkpoint not found: {self.checkpoint_path}")

        self.model = DeepDTACNN().to(self.device)
        checkpoint = torch.load(self.checkpoint_path, map_location=self.device, weights_only=False)
        state = checkpoint.get("model_state_dict", checkpoint)
        self.model.load_state_dict(state)
        self.model.eval()
        self.checkpoint_epoch = checkpoint.get("epoch")

    @torch.inference_mode()
    def predict(self, pairs: list[tuple[str, str]]) -> np.ndarray:
        if not pairs:
            return np.array([], dtype=np.float32)
        smiles = np.stack([encode_smiles(smi) for smi, _ in pairs])
        proteins = np.stack([encode_protein(seq) for _, seq in pairs])
        smi_tensor = torch.as_tensor(smiles, dtype=torch.long, device=self.device)
        protein_tensor = torch.as_tensor(proteins, dtype=torch.long, device=self.device)
        return self.model(smi_tensor, protein_tensor).detach().cpu().numpy()


def prediction_fields(pkd: float) -> dict[str, float | bool | None]:
    """Convert predicted pKd to the response fields shared by single and batch APIs."""
    kd_nm = float(10.0 ** (9.0 - pkd))
    return {
        "pkd": round(float(pkd), 4),
        "kd_nM": round(kd_nm, 4),
        # A single deterministic CNN does not produce an ensemble uncertainty estimate.
        "uncertainty": None,
        "binds": bool(pkd >= 7.0),
    }
