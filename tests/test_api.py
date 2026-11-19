"""Integration tests for DeepDTA+ FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient

from service.app import app


@pytest.fixture(scope="module")
def client():
    # Use lifespan context manager so startup event runs and model initializes
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["dataset"] == "davis"
    assert "model_version" in data


def test_valid_single_prediction(client):
    payload = {
        "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
        "protein_sequence": "MKWVTFISLLFLFSSAYSRGVFRRDTHKSEIAHRFKDLGEEHFKGLVLIAFSQYLQQCPFDEHVKLVNELTEFAKTCVADESHAGCEKSLHTLFGDELCKVASLRETYGDMADCCEKQEPERNECFLSHKDDSPDLPKLKPDPNTLCDEFKADEKKFWGKYLYEIARRHPYFYAPELLYYANKYNGVFQECCQAEDKGACLLPKIETMREKVLASSARQRLRCASIQKFGERALKAWSVARLSQKFPKAEFVEVTKLVTDLTKVHKECCHGDLLECADDRADLAKYICDNQDTISSKLKECCDKPLLEKSHCIAEVEKDAIPENLPPLTADFAEDKDVCKNYQEAKDAFLGSFLYEYSRRHPEYAVSVLLRLAKEYEATLEECCAKDDPHACYSTVFDKLKHLVDEPQNLIKQNCDQFEKLGEYGFQNALIVRYTRKVPQVSTPTLVEVSRSLGKVGTRCCTKPESERMPCTEDYLSLILNRLCVLHEKTPVSEKVTKCCTESLVNRRPCFSALTVDETYVPKEFKAETFTFHADICTLSEKERQIKKQTALVELVKHKPKATKEQLKAVMDDFAAFVEKCCKADDKETCFAEEGKKLVAASQAALGL",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "pkd" in res
    assert "kd_nM" in res
    assert "uncertainty" in res
    assert "binds" in res
    assert isinstance(res["pkd"], float)
    assert isinstance(res["kd_nM"], float)
    assert isinstance(res["uncertainty"], float)
    assert isinstance(res["binds"], bool)


def test_invalid_smiles_characters_422(client):
    payload = {
        "smiles": "CC(?)INVALID!!!",
        "protein_sequence": "MKWVTFISLLFLFSSAYSRG",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_invalid_protein_characters_422(client):
    payload = {
        "smiles": "CC(=O)O",
        "protein_sequence": "MK123INVALID#$%",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_empty_input_422(client):
    payload = {
        "smiles": "",
        "protein_sequence": "",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_batch_order_preserved(client):
    pairs = [
        {"smiles": "C", "protein_sequence": "AAAAA"},
        {"smiles": "CC", "protein_sequence": "CCCCC"},
        {"smiles": "CCC", "protein_sequence": "DDDDD"},
    ]
    response = client.post("/predict_batch", json={"items": pairs})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 3

    # Check each individually matches batch result
    for i, p in enumerate(pairs):
        single_res = client.post("/predict", json=p).json()
        assert results[i]["pkd"] == pytest.approx(single_res["pkd"], abs=1e-3)
        assert results[i]["uncertainty"] == pytest.approx(single_res["uncertainty"], abs=1e-3)


def test_batch_over_limit_422(client):
    # Maximum allowed is 256 items. 257 should return 422
    pairs = [{"smiles": "C", "protein_sequence": "AAAAA"} for _ in range(257)]
    response = client.post("/predict_batch", json={"items": pairs})
    assert response.status_code == 422


def test_predict_with_compound_name(client):
    payload = {
        "compound_name": "Dasatinib",
        "protein_sequence": "MKWVTFISLLFLFSSAYSRG",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "pkd" in res
    assert "binding_level" in res
    assert res["compound_name"] == "Dasatinib"
    assert res["smiles"] is not None

