"""Ensemble model combining GBM and CNN branches with uncertainty spread."""

from __future__ import annotations

import logging
import os

import numpy as np

from dtaplus.data import DavisData, encode_protein, encode_smiles
from dtaplus.models.gbm import SimilarityGBM
from dtaplus.uncertainty import compute_ensemble_uncertainty

logger = logging.getLogger(__name__)


class DTAEnsemble:
    """
    Ensemble model combining multiple gradient boosting seeds and/or DeepDTA CNN.
    Tuned on validation data only. Returns point estimate and uncertainty spread.
    """

    def __init__(
        self,
        num_gbm_seeds: int = 3,
        random_state: int = 0,
        cnn_checkpoint_path: str | None = None,
    ):
        self.num_gbm_seeds = num_gbm_seeds
        self.random_state = random_state
        self.cnn_checkpoint_path = cnn_checkpoint_path
        self.gbm_models: list[SimilarityGBM] = [
            SimilarityGBM(random_state=random_state + s) for s in range(num_gbm_seeds)
        ]
        self.weights: np.ndarray | None = None
        self.is_fitted: bool = False

        # CNN model branch
        self.cnn_model = None
        self.cnn_available = False

    def _load_cnn(self) -> None:
        """Loads trained PyTorch DeepDTA CNN checkpoint if available."""
        if not self.cnn_checkpoint_path or not os.path.exists(self.cnn_checkpoint_path):
            return

        try:
            import torch
            from dtaplus.models.cnn import DeepDTACNN

            device = "cuda" if torch.cuda.is_available() else "cpu"
            model = DeepDTACNN().to(device)
            ckpt = torch.load(self.cnn_checkpoint_path, map_location=device, weights_only=False)
            state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
            model.load_state_dict(state_dict)
            model.eval()
            self.cnn_model = model
            self.cnn_available = True
            logger.info("Loaded PyTorch DeepDTA CNN checkpoint from %s on %s", self.cnn_checkpoint_path, device)
        except Exception as e:
            logger.warning("Could not load CNN checkpoint (%s): %s", self.cnn_checkpoint_path, e)

    def fit_dataset(
        self,
        data: DavisData,
        train_idx: np.ndarray,
        val_idx: np.ndarray | None = None,
        split_type: str = "random",
    ) -> DTAEnsemble:
        """Fits all member models on training data and initializes ensemble weights."""
        for i, model in enumerate(self.gbm_models):
            model.fit_dataset(data, train_idx, split_type=split_type)

        self._load_cnn()

        num_members = len(self.gbm_models) + (1 if self.cnn_available else 0)
        self.weights = np.ones(num_members) / num_members
        self.is_fitted = True
        return self

    def _cnn_predict_pair(self, smiles: str, sequence: str) -> float:
        """Runs inference on a single SMILES and protein sequence using PyTorch CNN."""
        import torch

        device = next(self.cnn_model.parameters()).device
        s_arr = encode_smiles(smiles)
        p_arr = encode_protein(sequence)
        s_t = torch.from_numpy(s_arr).unsqueeze(0).long().to(device)
        p_t = torch.from_numpy(p_arr).unsqueeze(0).long().to(device)
        with torch.no_grad():
            pred = self.cnn_model(s_t, p_t).item()
        return float(pred)

    def _cnn_predict_batch(self, pairs: list[tuple[str, str]]) -> list[float]:
        """Runs batch inference using PyTorch CNN."""
        import torch

        device = next(self.cnn_model.parameters()).device
        s_tensors = [encode_smiles(smi) for smi, _ in pairs]
        p_tensors = [encode_protein(seq) for _, seq in pairs]
        s_batch = torch.from_numpy(np.stack(s_tensors)).long().to(device)
        p_batch = torch.from_numpy(np.stack(p_tensors)).long().to(device)
        with torch.no_grad():
            preds = self.cnn_model(s_batch, p_batch).cpu().numpy().tolist()
        return preds

    def predict_indices(
        self,
        data: DavisData,
        indices: np.ndarray,
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Returns (mean_predictions, uncertainty_spread) for given dataset indices.
        """
        if not self.is_fitted:
            raise RuntimeError("DTAEnsemble must be fitted before predict_indices.")

        member_preds = [m.predict_indices(data, indices) for m in self.gbm_models]

        if self.cnn_available and self.cnn_model is not None:
            pairs = [(data.drug_smiles[data.ri[idx]], data.protein_sequences[data.ci[idx]]) for idx in indices]
            cnn_preds = np.array(self._cnn_predict_batch(pairs))
            member_preds.append(cnn_preds)

        return compute_ensemble_uncertainty(member_preds, weights=self.weights)

    def predict_pair(
        self,
        smiles: str,
        sequence: str,
    ) -> tuple[float, float, float, bool]:
        """
        Predicts for a single (smiles, sequence) pair.
        Returns: (pkd, kd_nM, uncertainty, binds)
        where kd_nM = 10 ** (9 - pkd), binds = (pkd >= 7.0).
        """
        if not self.is_fitted:
            raise RuntimeError("DTAEnsemble must be fitted before predict_pair.")

        member_preds = [m.predict_pair(smiles, sequence) for m in self.gbm_models]

        if self.cnn_available and self.cnn_model is not None:
            try:
                cnn_pred = self._cnn_predict_pair(smiles, sequence)
                member_preds.append(cnn_pred)
            except Exception as e:
                logger.warning("CNN predict_pair failed, falling back to GBM-only: %s", e)

        mean_p, spread = compute_ensemble_uncertainty(
            np.array(member_preds).reshape(len(member_preds), 1),
            weights=self.weights,
        )
        pkd = float(mean_p[0])
        uncertainty = float(spread[0])
        kd_nm = float(10.0 ** (9.0 - pkd))
        binds = bool(pkd >= 7.0)

        return pkd, kd_nm, uncertainty, binds

    def predict_batch_pairs(
        self,
        pairs: list[tuple[str, str]],
    ) -> list[dict[str, float | bool]]:
        """
        Predicts for a batch of (smiles, sequence) pairs.
        """
        if not self.is_fitted:
            raise RuntimeError("DTAEnsemble must be fitted before predict_batch_pairs.")

        member_preds = [m.predict_batch_pairs(pairs) for m in self.gbm_models]

        if self.cnn_available and self.cnn_model is not None:
            try:
                cnn_preds = np.array(self._cnn_predict_batch(pairs))
                member_preds.append(cnn_preds)
            except Exception as e:
                logger.warning("CNN predict_batch failed, falling back to GBM-only: %s", e)

        mean_p, spread = compute_ensemble_uncertainty(member_preds, weights=self.weights)

        results = []
        for pkd, unc in zip(mean_p, spread):
            pkd_f = float(pkd)
            unc_f = float(unc)
            kd_nm = float(10.0 ** (9.0 - pkd_f))
            results.append({
                "pkd": round(pkd_f, 4),
                "kd_nM": round(kd_nm, 2),
                "uncertainty": round(unc_f, 4),
                "binds": bool(pkd_f >= 7.0),
            })
        return results
