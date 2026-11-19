"""Data loader entrypoint for DeepDTA+.

Allows direct importing or running from repository root:
    from data_loader import DavisData, create_dataloader, load_davis_raw
"""

from __future__ import annotations

import os
import sys

# Ensure src/ is in python path
_SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from dtaplus.data_loader import (
    CHARISOSMILEN,
    CHARISOSMISET,
    CHARPROTLEN,
    CHARPROTSET,
    DEFAULT_DAVIS_SEQ_LEN,
    DEFAULT_DAVIS_SMI_LEN,
    DatasetSplits,
    DavisData,
    build_folds,
    create_dataloader,
    encode_protein,
    encode_smiles,
    load_davis_raw,
    tokenize_protein,
    tokenize_smiles,
)

__all__ = [
    "CHARISOSMILEN",
    "CHARISOSMISET",
    "CHARPROTLEN",
    "CHARPROTSET",
    "DEFAULT_DAVIS_SEQ_LEN",
    "DEFAULT_DAVIS_SMI_LEN",
    "DatasetSplits",
    "DavisData",
    "build_folds",
    "create_dataloader",
    "encode_protein",
    "encode_smiles",
    "load_davis_raw",
    "tokenize_protein",
    "tokenize_smiles",
]

if __name__ == "__main__":
    print("Loading Davis dataset...")
    d = DavisData("data/davis")
    print(f"Loaded {d.num_drugs} drugs, {d.num_proteins} proteins, {d.num_pairs} pairs.")
    splits = d.get_random_split()
    print(f"Train pairs: {len(splits.train_idx)}, Val pairs: {len(splits.val_idx)}, Test pairs: {len(splits.test_idx)}")
