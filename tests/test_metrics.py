"""Tests for evaluation metrics: CI, MSE, r2m, AUPR, and Spearman."""

import time

import numpy as np
import pytest

from dtaplus.metrics import (
    compute_all_metrics,
    concordance_index,
    mean_squared_error,
    rm2_score,
)


def test_ci_toy_cases():
    y = np.array([1.0, 2.0, 3.0, 4.0, 5.0])

    # Perfect predictions give CI = 1.0
    p_perfect = np.array([10.0, 20.0, 30.0, 40.0, 50.0])
    assert concordance_index(y, p_perfect) == pytest.approx(1.0)
    assert mean_squared_error(y, y) == pytest.approx(0.0)

    # Reversed predictions give CI = 0.0
    p_reversed = np.array([50.0, 40.0, 30.0, 20.0, 10.0])
    assert concordance_index(y, p_reversed) == pytest.approx(0.0)

    # Constant prediction gives CI = 0.5
    p_constant = np.array([5.0, 5.0, 5.0, 5.0, 5.0])
    assert concordance_index(y, p_constant) == pytest.approx(0.5)


def test_ci_speed_large_array():
    # 50,000 random points should finish quickly (< 3 seconds)
    rng = np.random.RandomState(42)
    y = rng.randn(50000)
    p = y + rng.randn(50000) * 0.2
    t0 = time.time()
    ci = concordance_index(y, p)
    elapsed = time.time() - t0
    assert elapsed < 3.0, f"CI on 50k points took {elapsed:.2f}s, expected < 3.0s"
    assert 0.8 < ci < 1.0


def test_rm2_reference_example():
    # Compare against reference calculations
    y = np.array([5.0, 6.0, 7.0, 8.0])
    p = np.array([5.1, 5.9, 7.2, 7.8])
    score = rm2_score(y, p)
    # Expected from emetrics.py: approx 0.924554
    assert score == pytest.approx(0.924554, rel=1e-4)


def test_aupr_and_spearman():
    y = np.array([5.0, 5.2, 6.0, 7.5, 8.0, 9.0])
    p = np.array([5.0, 5.1, 5.8, 7.2, 8.1, 8.9])
    metrics = compute_all_metrics(y, p, threshold=7.0)
    assert metrics["ci"] == pytest.approx(1.0)
    assert metrics["mse"] == pytest.approx(0.16 / 6.0, rel=1e-4)
    assert metrics["aupr"] == pytest.approx(1.0)
    assert metrics["spearman"] == pytest.approx(1.0)
    assert metrics["r2m"] > 0.9
