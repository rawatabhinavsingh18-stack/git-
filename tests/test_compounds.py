"""Unit tests for compound name resolution and chemical lookup in DeepDTA+."""

from dtaplus.compounds import (
    COMMON_COMPOUNDS,
    get_popular_compound_names,
    query_pubchem,
    resolve_compound,
)


def test_common_compounds_lookup():
    name, smiles, err = resolve_compound("Dasatinib")
    assert err is None
    assert "Dasatinib" in name
    assert smiles == COMMON_COMPOUNDS["dasatinib"]


def test_case_insensitivity():
    _, smiles1, _ = resolve_compound("aspirin")
    _, smiles2, _ = resolve_compound("ASPIRIN")
    _, smiles3, _ = resolve_compound("Aspirin")
    assert smiles1 == smiles2 == smiles3
    assert smiles1 == COMMON_COMPOUNDS["aspirin"]


def test_direct_smiles_passthrough():
    known_smi = "CC(=O)OC1=CC=CC=C1C(=O)O"
    _name, smiles, err = resolve_compound(known_smi)
    assert err is None
    assert smiles == known_smi


def test_invalid_compound_returns_error():
    _, smiles, err = resolve_compound("xyznotarealdrug1234567")
    assert err is not None
    assert smiles == ""


def test_popular_compounds_list():
    popular = get_popular_compound_names()
    assert isinstance(popular, list)
    assert len(popular) >= 15
    assert "Dasatinib" in popular
    assert "Aspirin" in popular


def test_pubchem_cache():
    # Calling query_pubchem twice should hit the lru_cache
    title1, s1 = query_pubchem("caffeine")
    title2, s2 = query_pubchem("caffeine")
    assert title1 == title2
    assert s1 == s2
