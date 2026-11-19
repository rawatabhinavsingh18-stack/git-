"""Data loading, preprocessing, tokenization, and split utilities for DeepDTA+.

This module re-exports all core data loading functions and classes from
dtaplus.data_loader to ensure full backward compatibility.
"""

from __future__ import annotations

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
