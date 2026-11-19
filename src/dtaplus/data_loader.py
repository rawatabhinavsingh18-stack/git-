"""Data loading, PyTorch dataset creation, and split utilities for DeepDTA+."""

from __future__ import annotations

import json
import os
import pickle
from collections import OrderedDict
from dataclasses import dataclass

import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset

# Character dictionaries from DeepDTA (Öztürk et al., 2018)
CHARPROTSET: dict[str, int] = {
    "A": 1, "C": 2, "B": 3, "E": 4, "D": 5, "G": 6,
    "F": 7, "I": 8, "H": 9, "K": 10, "M": 11, "L": 12,
    "O": 13, "N": 14, "Q": 15, "P": 16, "S": 17, "R": 18,
    "U": 19, "T": 20, "W": 21, "V": 22, "Y": 23, "X": 24,
    "Z": 25,
}
CHARPROTLEN = 25

CHARISOSMISET: dict[str, int] = {
    "#": 29, "%": 30, ")": 31, "(": 1, "+": 32, "-": 33, "/": 34, ".": 2,
    "1": 35, "0": 3, "3": 36, "2": 4, "5": 37, "4": 5, "7": 38, "6": 6,
    "9": 39, "8": 7, "=": 40, "A": 41, "@": 8, "C": 42, "B": 9, "E": 43,
    "D": 10, "G": 44, "F": 11, "I": 45, "H": 12, "K": 46, "M": 47, "L": 13,
    "O": 48, "N": 14, "P": 15, "S": 49, "R": 16, "U": 50, "T": 17, "W": 51,
    "V": 18, "Y": 52, "[": 53, "Z": 19, "]": 54, "\\": 20, "a": 55, "c": 56,
    "b": 21, "e": 57, "d": 22, "g": 58, "f": 23, "i": 59, "h": 24, "m": 60,
    "l": 25, "o": 61, "n": 26, "s": 62, "r": 27, "u": 63, "t": 28, "y": 64,
}
CHARISOSMILEN = 64

DEFAULT_DAVIS_SMI_LEN = 85
DEFAULT_DAVIS_SEQ_LEN = 1200


def encode_smiles(
    smiles: str,
    max_len: int = DEFAULT_DAVIS_SMI_LEN,
    charset: dict[str, int] | None = None,
) -> np.ndarray:
    """Label-encode SMILES string into a 1D integer array, 0-padded and truncated."""
    if charset is None:
        charset = CHARISOSMISET
    arr = np.zeros(max_len, dtype=np.int64)
    for i, ch in enumerate(smiles[:max_len]):
        if ch in charset:
            arr[i] = charset[ch]
        else:
            raise ValueError(f"Unrecognized SMILES character: {ch!r}")
    return arr


def encode_protein(
    sequence: str,
    max_len: int = DEFAULT_DAVIS_SEQ_LEN,
    charset: dict[str, int] | None = None,
) -> np.ndarray:
    """Label-encode amino acid sequence into a 1D integer array, 0-padded and truncated."""
    if charset is None:
        charset = CHARPROTSET
    arr = np.zeros(max_len, dtype=np.int64)
    for i, ch in enumerate(sequence[:max_len]):
        if ch in charset:
            arr[i] = charset[ch]
        else:
            raise ValueError(f"Unrecognized amino acid character: {ch!r}")
    return arr


# Aliases for tokenization
tokenize_smiles = encode_smiles
tokenize_protein = encode_protein


def load_davis_raw(data_dir: str = "data/davis") -> dict:
    """Loads raw Davis affinity matrix, ligands, and proteins."""
    y_path = os.path.join(data_dir, "Y")
    with open(y_path, "rb") as f:
        raw_Y = pickle.load(f, encoding="latin1")

    lig_path = os.path.join(data_dir, "ligands_can.txt")
    with open(lig_path, "r") as f:
        ligands = json.load(f, object_pairs_hook=OrderedDict)

    prot_path = os.path.join(data_dir, "proteins.txt")
    with open(prot_path, "r") as f:
        proteins = json.load(f, object_pairs_hook=OrderedDict)

    return {
        "Y": raw_Y,
        "ligands": ligands,
        "proteins": proteins,
    }


def build_folds(
    num_samples: int,
    k_folds: int = 5,
    seed: int = 42,
) -> list[np.ndarray]:
    """Generates k random disjoint fold index partitions."""
    rng = np.random.RandomState(seed)
    indices = rng.permutation(num_samples)
    return list(np.array_split(indices, k_folds))



def create_dataloader(
    drugs: np.ndarray,
    prots: np.ndarray,
    affinities: np.ndarray,
    batch_size: int = 256,
    shuffle: bool = True,
) -> DataLoader:
    """Creates a PyTorch DataLoader from pre-encoded drug, protein, and affinity arrays."""
    t_drugs = torch.from_numpy(drugs).long()
    t_prots = torch.from_numpy(prots).long()
    t_y = torch.from_numpy(affinities).float()
    dataset = TensorDataset(t_drugs, t_prots, t_y)
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)


@dataclass
class DatasetSplits:
    """Container for train, validation, and test indices."""
    train_idx: np.ndarray
    val_idx: np.ndarray
    test_idx: np.ndarray
    split_type: str
    seed: int


class DavisData:
    """Davis dataset manager for DeepDTA+."""

    def __init__(
        self,
        data_dir: str = "data/davis",
        smi_len: int = DEFAULT_DAVIS_SMI_LEN,
        seq_len: int = DEFAULT_DAVIS_SEQ_LEN,
    ):
        self.data_dir = data_dir
        self.smi_len = smi_len
        self.seq_len = seq_len

        # Load affinity matrix Y
        y_path = os.path.join(data_dir, "Y")
        with open(y_path, "rb") as f:
            self.raw_Y = pickle.load(f, encoding="latin1")
        self.Y_shape = self.raw_Y.shape

        # Transform Kd to pKd = -log10(Kd / 1e9)
        self.pKd_matrix = -np.log10(self.raw_Y / 1e9)

        # Non-NaN pair coordinates (drug_idx, protein_idx)
        self.ri, self.ci = np.where(~np.isnan(self.raw_Y))
        self.num_pairs = len(self.ri)
        self.y = self.pKd_matrix[self.ri, self.ci]

        # Load SMILES ligands and proteins
        lig_path = os.path.join(data_dir, "ligands_can.txt")
        with open(lig_path, "r") as f:
            self.ligands_dict = json.load(f, object_pairs_hook=OrderedDict)
        self.drug_keys = list(self.ligands_dict.keys())
        self.drug_smiles = list(self.ligands_dict.values())
        self.num_drugs = len(self.drug_smiles)

        prot_path = os.path.join(data_dir, "proteins.txt")
        with open(prot_path, "r") as f:
            self.proteins_dict = json.load(f, object_pairs_hook=OrderedDict)
        self.protein_keys = list(self.proteins_dict.keys())
        self.protein_sequences = list(self.proteins_dict.values())
        self.num_proteins = len(self.protein_sequences)

        # Similarities
        dsim_path = os.path.join(data_dir, "drug-drug_similarities_2D.txt")
        if os.path.exists(dsim_path):
            self.dsim = np.loadtxt(dsim_path)
        else:
            self.dsim = np.eye(self.num_drugs)

        tsim_path = os.path.join(data_dir, "target-target_similarities_WS.txt")
        if os.path.exists(tsim_path):
            self.tsim = np.loadtxt(tsim_path)
        else:
            self.tsim = np.eye(self.num_proteins)

        # Pre-encoded unique drugs and proteins
        self.unique_encoded_drugs = np.stack(
            [encode_smiles(s, max_len=self.smi_len) for s in self.drug_smiles]
        )
        self.unique_encoded_proteins = np.stack(
            [encode_protein(p, max_len=self.seq_len) for p in self.protein_sequences]
        )

        # Pairwise encoded tensors
        self.encoded_drugs = self.unique_encoded_drugs[self.ri]
        self.encoded_proteins = self.unique_encoded_proteins[self.ci]

        # Load official folds
        folds_dir = os.path.join(data_dir, "folds")
        test_path = os.path.join(folds_dir, "test_fold_setting1.txt")
        train_path = os.path.join(folds_dir, "train_fold_setting1.txt")
        with open(test_path, "r") as f:
            self.official_test_fold = np.array(json.load(f), dtype=np.int64)
        with open(train_path, "r") as f:
            raw_train = json.load(f)
            self.official_train_folds = [np.array(fold, dtype=np.int64) for fold in raw_train]

        self.official_train_union = np.array(
            sorted(set().union(*[set(fold.tolist()) for fold in self.official_train_folds])),
            dtype=np.int64,
        )

    def get_random_split(self, val_fold_idx: int = 0) -> DatasetSplits:
        """Returns official setting 1 split with one train fold held out as validation."""
        val_fold = self.official_train_folds[val_fold_idx]
        train_folds = [
            f for i, f in enumerate(self.official_train_folds) if i != val_fold_idx
        ]
        train_idx = np.array(
            sorted(set().union(*[set(f.tolist()) for f in train_folds])),
            dtype=np.int64,
        )
        return DatasetSplits(
            train_idx=train_idx,
            val_idx=val_fold,
            test_idx=self.official_test_fold,
            split_type="random",
            seed=val_fold_idx,
        )

    def get_cold_drug_split(
        self,
        seed: int = 0,
        test_ratio: float = 0.2,
        val_ratio: float = 0.1,
    ) -> DatasetSplits:
        """Cold-drug split where test and validation drugs never appear in training."""
        rng = np.random.RandomState(seed)
        shuffled_drugs = rng.permutation(self.num_drugs)
        n_test = round(test_ratio * self.num_drugs)
        n_val = round(val_ratio * self.num_drugs)

        test_drugs = set(shuffled_drugs[:n_test].tolist())
        val_drugs = set(shuffled_drugs[n_test : n_test + n_val].tolist())
        train_drugs = set(shuffled_drugs[n_test + n_val :].tolist())

        all_idx = np.arange(self.num_pairs)
        test_mask = np.isin(self.ri, list(test_drugs))
        val_mask = np.isin(self.ri, list(val_drugs))
        train_mask = np.isin(self.ri, list(train_drugs))

        return DatasetSplits(
            train_idx=all_idx[train_mask],
            val_idx=all_idx[val_mask],
            test_idx=all_idx[test_mask],
            split_type="cold_drug",
            seed=seed,
        )

    def get_cold_target_split(
        self,
        seed: int = 0,
        test_ratio: float = 0.2,
        val_ratio: float = 0.1,
    ) -> DatasetSplits:
        """Cold-target split where test and validation proteins never appear in training."""
        rng = np.random.RandomState(seed)
        shuffled_prots = rng.permutation(self.num_proteins)
        n_test = round(test_ratio * self.num_proteins)
        n_val = round(val_ratio * self.num_proteins)

        test_prots = set(shuffled_prots[:n_test].tolist())
        val_prots = set(shuffled_prots[n_test : n_test + n_val].tolist())
        train_prots = set(shuffled_prots[n_test + n_val :].tolist())

        all_idx = np.arange(self.num_pairs)
        test_mask = np.isin(self.ci, list(test_prots))
        val_mask = np.isin(self.ci, list(val_prots))
        train_mask = np.isin(self.ci, list(train_prots))

        return DatasetSplits(
            train_idx=all_idx[train_mask],
            val_idx=all_idx[val_mask],
            test_idx=all_idx[test_mask],
            split_type="cold_target",
            seed=seed,
        )
