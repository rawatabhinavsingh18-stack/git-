"""Gradient Boosting and Baseline Models for DeepDTA+."""

from __future__ import annotations

import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.feature_extraction.text import CountVectorizer

from dtaplus.data import DavisData


class MeanPredictor:
    """Predict-the-mean baseline model."""

    def __init__(self):
        self.mean_val: float = 5.0

    def fit(self, y: np.ndarray) -> MeanPredictor:
        self.mean_val = float(np.mean(y))
        return self

    def predict(self, n: int) -> np.ndarray:
        return np.full(n, self.mean_val, dtype=float)


class SimilarityGBM:
    """
    Gradient Boosting Model combining:
    - Drug 2D similarity matrix (TruncatedSVD 32 dims)
    - SMILES 1-3-gram counts (TruncatedSVD 32 dims)
    - Protein Smith-Waterman similarity matrix (TruncatedSVD 32 dims)
    - Protein 3-mer counts (TruncatedSVD 32 dims)
    Total feature dimension = 128.
    """

    def __init__(
        self,
        n_svd: int = 32,
        max_iter: int = 400,
        learning_rate: float = 0.06,
        max_leaf_nodes: int = 31,
        l2_regularization: float = 1.0,
        random_state: int = 0,
    ):
        self.n_svd = n_svd
        self.max_iter = max_iter
        self.learning_rate = learning_rate
        self.max_leaf_nodes = max_leaf_nodes
        self.l2_regularization = l2_regularization
        self.random_state = random_state

        self.drug_vect = CountVectorizer(analyzer="char", ngram_range=(1, 3), lowercase=False)
        self.prot_vect = CountVectorizer(analyzer="char", ngram_range=(3, 3), lowercase=False)

        self.svd_d_smi = TruncatedSVD(n_svd, random_state=random_state)
        self.svd_p_seq = TruncatedSVD(n_svd, random_state=random_state)
        self.svd_d_sim = TruncatedSVD(n_svd, random_state=random_state)
        self.svd_p_sim = TruncatedSVD(n_svd, random_state=random_state)

        self.model = HistGradientBoostingRegressor(
            max_iter=max_iter,
            learning_rate=learning_rate,
            max_leaf_nodes=max_leaf_nodes,
            l2_regularization=l2_regularization,
            random_state=random_state,
        )

        self.train_drug_smiles: list[str] = []
        self.train_prot_seqs: list[str] = []
        self.d_feat: np.ndarray | None = None
        self.p_feat: np.ndarray | None = None
        self.is_fitted: bool = False

    def fit_dataset(
        self,
        data: DavisData,
        train_idx: np.ndarray,
        split_type: str = "random",
    ) -> SimilarityGBM:
        """Fits the featurizers and GBM model on training data."""
        self.train_drug_smiles = data.drug_smiles
        self.train_prot_seqs = data.protein_sequences

        if split_type == "random":
            # All drugs and proteins are observed in training pairs
            smi_counts = self.drug_vect.fit_transform(data.drug_smiles).astype(float)
            seq_counts = self.prot_vect.fit_transform(data.protein_sequences).astype(float)

            xd = self.svd_d_smi.fit_transform(smi_counts)
            xp = self.svd_p_seq.fit_transform(seq_counts)
            sd = self.svd_d_sim.fit_transform(data.dsim)
            st = self.svd_p_sim.fit_transform(data.tsim)

            self.d_feat = np.hstack([sd, xd])
            self.p_feat = np.hstack([st, xp])

            x_train = np.hstack([self.d_feat[data.ri[train_idx]], self.p_feat[data.ci[train_idx]]])
            y_train = data.y[train_idx]
            self.model.fit(x_train, y_train)

        elif split_type == "cold_drug":
            # Fit drug transformers strictly on training drugs to avoid leakage
            train_drug_ids = sorted(set(data.ri[train_idx].tolist()))
            train_smiles = [data.drug_smiles[i] for i in train_drug_ids]

            smi_counts_tr = self.drug_vect.fit_transform(train_smiles).astype(float)
            self.svd_d_smi.fit(smi_counts_tr)
            all_smi_counts = self.drug_vect.transform(data.drug_smiles).astype(float)
            xd = self.svd_d_smi.transform(all_smi_counts)

            dsim_tr = data.dsim[train_drug_ids][:, train_drug_ids]
            self.svd_d_sim.fit(dsim_tr)
            all_dsim_sub = data.dsim[:, train_drug_ids]
            sd = self.svd_d_sim.transform(all_dsim_sub)

            seq_counts = self.prot_vect.fit_transform(data.protein_sequences).astype(float)
            xp = self.svd_p_seq.fit_transform(seq_counts)
            st = self.svd_p_sim.fit_transform(data.tsim)

            self.d_feat = np.hstack([sd, xd])
            self.p_feat = np.hstack([st, xp])

            x_train = np.hstack([self.d_feat[data.ri[train_idx]], self.p_feat[data.ci[train_idx]]])
            y_train = data.y[train_idx]
            self.model.fit(x_train, y_train)

        elif split_type == "cold_target":
            # Fit protein transformers strictly on training proteins to avoid leakage
            train_prot_ids = sorted(set(data.ci[train_idx].tolist()))
            train_seqs = [data.protein_sequences[i] for i in train_prot_ids]

            seq_counts_tr = self.prot_vect.fit_transform(train_seqs).astype(float)
            self.svd_p_seq.fit(seq_counts_tr)
            all_seq_counts = self.prot_vect.transform(data.protein_sequences).astype(float)
            xp = self.svd_p_seq.transform(all_seq_counts)

            tsim_tr = data.tsim[train_prot_ids][:, train_prot_ids]
            self.svd_p_sim.fit(tsim_tr)
            all_tsim_sub = data.tsim[:, train_prot_ids]
            st = self.svd_p_sim.transform(all_tsim_sub)

            smi_counts = self.drug_vect.fit_transform(data.drug_smiles).astype(float)
            xd = self.svd_d_smi.fit_transform(smi_counts)
            sd = self.svd_d_sim.fit_transform(data.dsim)

            self.d_feat = np.hstack([sd, xd])
            self.p_feat = np.hstack([st, xp])

            x_train = np.hstack([self.d_feat[data.ri[train_idx]], self.p_feat[data.ci[train_idx]]])
            y_train = data.y[train_idx]
            self.model.fit(x_train, y_train)

        self.is_fitted = True
        return self

    def predict_indices(self, data: DavisData, indices: np.ndarray) -> np.ndarray:
        """Predicts for given pair indices from DavisData."""
        if not self.is_fitted or self.d_feat is None or self.p_feat is None:
            raise RuntimeError("Model must be fitted before predict_indices.")
        x = np.hstack([self.d_feat[data.ri[indices]], self.p_feat[data.ci[indices]]])
        return self.model.predict(x)

    def featurize_single(self, smiles: str, sequence: str) -> np.ndarray:
        """Featurizes a single (smiles, protein_sequence) pair for inference."""
        smi_vec = self.drug_vect.transform([smiles]).astype(float)
        xd = self.svd_d_smi.transform(smi_vec)

        # For drug similarity: if smiles is in known training set, use its row; else zero
        if smiles in self.train_drug_smiles:
            idx = self.train_drug_smiles.index(smiles)
            sd = self.d_feat[idx, : self.n_svd].reshape(1, -1)
        else:
            sd = np.zeros((1, self.n_svd))

        seq_vec = self.prot_vect.transform([sequence]).astype(float)
        xp = self.svd_p_seq.transform(seq_vec)

        if sequence in self.train_prot_seqs:
            idx = self.train_prot_seqs.index(sequence)
            st = self.p_feat[idx, : self.n_svd].reshape(1, -1)
        else:
            st = np.zeros((1, self.n_svd))

        d_part = np.hstack([sd, xd])
        p_part = np.hstack([st, xp])
        return np.hstack([d_part, p_part])

    def predict_pair(self, smiles: str, sequence: str) -> float:
        """Predicts pKd for a single (smiles, protein_sequence) pair."""
        x = self.featurize_single(smiles, sequence)
        return float(self.model.predict(x)[0])

    def predict_batch_pairs(self, pairs: list[tuple[str, str]]) -> np.ndarray:
        """Predicts pKd for a list of (smiles, protein_sequence) pairs."""
        x_list = [self.featurize_single(smi, seq) for smi, seq in pairs]
        x = np.vstack(x_list)
        return self.model.predict(x)
