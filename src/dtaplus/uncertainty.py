"""Uncertainty estimation and correlation analysis for DeepDTA+."""

from __future__ import annotations

import numpy as np
from scipy import stats


def compute_ensemble_uncertainty(
    member_predictions: np.ndarray | list[np.ndarray],
    weights: np.ndarray | list[float] | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Computes point estimate and ensemble uncertainty spread (standard deviation).
    member_predictions: array of shape (num_members, num_samples) or list of 1D arrays.
    Returns:
        mean_preds: 1D array of shape (num_samples,)
        uncertainty_spread: 1D array of shape (num_samples,) standard deviation across members
    """
    preds_arr = np.asarray(member_predictions, dtype=float)
    if preds_arr.ndim == 1:
        return preds_arr, np.zeros_like(preds_arr)

    if weights is not None:
        w = np.asarray(weights, dtype=float)
        w = w / np.sum(w)
        mean_preds = np.average(preds_arr, axis=0, weights=w)
        variance = np.average((preds_arr - mean_preds) ** 2, axis=0, weights=w)
        spread = np.sqrt(variance)
    else:
        mean_preds = np.mean(preds_arr, axis=0)
        spread = np.std(preds_arr, axis=0)

    return mean_preds, spread


def evaluate_uncertainty_correlation(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    uncertainty: np.ndarray,
) -> dict[str, float]:
    """
    Evaluates how well the uncertainty score correlates with absolute prediction error.
    Returns Spearman correlation and p-value.
    """
    abs_errors = np.abs(y_true - y_pred)
    corr, p_value = stats.spearmanr(uncertainty, abs_errors)
    if np.isnan(corr):
        corr = 0.0
    return {
        "spearman_error_uncertainty": float(corr),
        "p_value": float(p_value) if not np.isnan(p_value) else 1.0,
        "mean_abs_error": float(np.mean(abs_errors)),
        "mean_uncertainty": float(np.mean(uncertainty)),
    }
