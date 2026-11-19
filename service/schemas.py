"""Pydantic schemas and validators for the DeepDTA+ FastAPI service."""

from __future__ import annotations

import logging
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

from dtaplus.compounds import canonicalize_smiles, resolve_compound
from dtaplus.data import CHARISOSMISET, CHARPROTSET

logger = logging.getLogger("dtaplus.service")


class HealthResponse(BaseModel):
    status: str = "ok"
    model_version: str = "0.1.0"
    dataset: str = "davis"
    model: str = "DeepDTACNN"
    device: str = "cpu"
    checkpoint_epoch: int | None = None


class PredictionRequest(BaseModel):
    smiles: str | None = Field(
        default=None,
        description="Canonical or isomeric SMILES string.",
    )
    compound_name: str | None = Field(
        default=None,
        description="Common chemical compound or drug name (e.g. 'Dasatinib', 'Aspirin', 'Imatinib').",
    )
    protein_sequence: str = Field(
        ...,
        description="Target amino acid sequence.",
        min_length=1,
    )

    @model_validator(mode="before")
    @classmethod
    def resolve_drug_input(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        smi = data.get("smiles")
        name = data.get("compound_name")

        if (not smi or not str(smi).strip()) and (not name or not str(name).strip()):
            raise ValueError("Either 'smiles' or 'compound_name' must be provided.")

        if (not smi or not str(smi).strip()) and name:
            display_title, resolved_smiles, err = resolve_compound(str(name).strip())
            if err or not resolved_smiles:
                raise ValueError(err or f"Could not resolve compound name: {name}")
            data["smiles"] = resolved_smiles
            if not data.get("compound_name"):
                data["compound_name"] = display_title

        return data

    @field_validator("smiles")
    @classmethod
    def validate_smiles(cls, v: str | None) -> str:
        if not v or not v.strip():
            raise ValueError("SMILES string cannot be empty.")
        s = v.strip()
        invalid = [ch for ch in s if ch not in CHARISOSMISET]
        if invalid:
            raise ValueError(f"SMILES contains invalid characters: {set(invalid)}")
        return canonicalize_smiles(s)

    @field_validator("protein_sequence")
    @classmethod
    def validate_protein(cls, v: str) -> str:
        s = v.strip().upper()
        if not s:
            raise ValueError("Protein sequence cannot be empty.")
        invalid = [ch for ch in s if ch not in CHARPROTSET]
        if invalid:
            raise ValueError(f"Protein sequence contains invalid amino acids: {set(invalid)}")
        return s


def categorize_binding_affinity(pkd: float) -> str:
    """Categorizes pKd into human-friendly, simplified terms."""
    if pkd >= 8.0:
        return "Very High Binding"
    elif pkd >= 7.0:
        return "High Binding"
    elif pkd >= 6.0:
        return "Moderate Binding"
    return "No Significant Binding"


class PredictionResponse(BaseModel):
    pkd: float = Field(..., description="Predicted binding affinity (-log10 Kd/1e9).")
    kd_nM: float = Field(..., description="Predicted equilibrium dissociation constant in nM.")
    uncertainty: float | None = Field(
        default=None,
        description="Ensemble spread when available; null for a single deterministic CNN.",
    )
    binds: bool = Field(..., description="Binary classification (True if pKd >= 7.0 / Kd <= 100 nM).")
    binding_level: str = Field(..., description="Intuitive binding category (e.g. 'Very High Binding', 'High Binding', 'Moderate Binding', 'No Significant Binding').")
    compound_name: str | None = Field(default=None, description="Resolved compound name if available.")
    smiles: str | None = Field(default=None, description="Resolved SMILES string.")


class BatchPredictionRequest(BaseModel):
    items: list[PredictionRequest] = Field(..., min_length=1, max_length=256)

    @field_validator("items")
    @classmethod
    def validate_batch_size(cls, v: list[PredictionRequest]) -> list[PredictionRequest]:
        if len(v) == 0:
            raise ValueError("Batch cannot be empty.")
        if len(v) > 256:
            raise ValueError("Batch exceeds maximum size of 256 items.")
        return v
