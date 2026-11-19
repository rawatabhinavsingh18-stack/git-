"""Evaluation metrics for drug-target affinity prediction."""

from __future__ import annotations

import numpy as np
from scipy import stats
from sklearn.metrics import average_precision_score


class FenwickTree:
    """Binary Indexed Tree for O(N log N) rank calculations."""

    def __init__(self, size: int):
        self.size = size
        self.tree = [0] * (size + 1)

    def add(self, idx: int, val: int) -> None:
        while idx <= self.size:
            self.tree[idx] += val
            idx += idx & (-idx)

    def query(self, idx: int) -> int:
        s = 0
        while idx > 0:
            s += self.tree[idx]
            idx -= idx & (-idx)
        return s


def concordance_index(
    y_true: np.ndarray | list,
    y_pred: np.ndarray | list,
) -> float:
    """
    Computes Concordance Index (CI) over all pairs with different true values.
    Ties in prediction count as 0.5. Runs in O(N log N) using a Fenwick tree.
    """
    y = np.asarray(y_true, dtype=float)
    p = np.asarray(y_pred, dtype=float)
    n = len(y)
    if n <= 1:
        return 0.5

    unique_p, p_ranks = np.unique(p, return_inverse=True)
    p_ranks += 1  # 1-indexed for Fenwick
    num_p = len(unique_p)

    sort_idx = np.argsort(y)
    y_sorted = y[sort_idx]
    p_ranks_sorted = p_ranks[sort_idx]

    ft = FenwickTree(num_p)
    count_at_rank = np.zeros(num_p + 1, dtype=np.int64)

    total_num = 0.0
    total_den = 0.0

    i = 0
    while i < n:
        j = i
        while j < n and y_sorted[j] == y_sorted[i]:
            j += 1
        # For all elements in current y-tie block, compare against strictly smaller y elements
        for k in range(i, j):
            rk = p_ranks_sorted[k]
            strictly_less = ft.query(rk - 1)
            equal = count_at_rank[rk]
            total_num += strictly_less + 0.5 * equal
            total_den += i

        # Insert current block
        for k in range(i, j):
            rk = p_ranks_sorted[k]
            ft.add(rk, 1)
            count_at_rank[rk] += 1

        i = j

    if total_den == 0:
        return 0.5
    return float(total_num / total_den)


def mean_squared_error(
    y_true: np.ndarray | list,
    y_pred: np.ndarray | list,
) -> float:
    """Mean squared error."""
    y = np.asarray(y_true, dtype=float)
    p = np.asarray(y_pred, dtype=float)
    return float(np.mean((y - p) ** 2))


def spearman_correlation(
    y_true: np.ndarray | list,
    y_pred: np.ndarray | list,
) -> float:
    """Spearman rank correlation."""
    y = np.asarray(y_true, dtype=float)
    p = np.asarray(y_pred, dtype=float)
    corr, _ = stats.spearmanr(y, p)
    if np.isnan(corr):
        return 0.0
    return float(corr)


def r_squared_error(
    y_obs: np.ndarray | list,
    y_pred: np.ndarray | list,
) -> float:
    """Standard R^2 correlation coefficient."""
    y = np.asarray(y_obs, dtype=float)
    p = np.asarray(y_pred, dtype=float)
    y_mean = np.mean(y)
    p_mean = np.mean(p)
    mult = np.sum((p - p_mean) * (y - y_mean)) ** 2
    denom = np.sum((y - y_mean) ** 2) * np.sum((p - p_mean) ** 2)
    if denom == 0:
        return 0.0
    return float(mult / denom)


def squared_error_zero(
    y_obs: np.ndarray | list,
    y_pred: np.ndarray | list,
) -> float:
    """Through-origin regression R0^2 as in DeepDTA/emetrics.py."""
    y = np.asarray(y_obs, dtype=float)
    p = np.asarray(y_pred, dtype=float)
    p_sq_sum = np.sum(p * p)
    if p_sq_sum == 0:
        return 0.0
    k = np.sum(y * p) / p_sq_sum
    y_mean = np.mean(y)
    down = np.sum((y - y_mean) ** 2)
    if down == 0:
        return 0.0
    upp = np.sum((y - (k * p)) ** 2)
    return float(1.0 - (upp / down))


def rm2_score(
    y_obs: np.ndarray | list,
    y_pred: np.ndarray | list,
) -> float:
    """
    Modified R^2 (r_m^2) metric from DeepDTA / emetrics.py:
    r2 * (1 - sqrt(|r2^2 - r02^2|))
    """
    r2 = r_squared_error(y_obs, y_pred)
    r02 = squared_error_zero(y_obs, y_pred)
    diff = np.abs((r2 * r2) - (r02 * r02))
    return float(r2 * (1.0 - np.sqrt(diff)))


def aupr_score(
    y_true: np.ndarray | list,
    y_pred: np.ndarray | list,
    threshold: float = 7.0,
) -> float:
    """
    Area Under Precision-Recall Curve (AUPR) at specified pKd threshold (default 7.0 for Davis).
    Uses sklearn.metrics.average_precision_score.
    """
    y = np.asarray(y_true, dtype=float)
    p = np.asarray(y_pred, dtype=float)
    y_bin = (y >= threshold).astype(int)
    if np.all(y_bin == 0) or np.all(y_bin == 1):
        return 0.0
    return float(average_precision_score(y_bin, p))


def compute_all_metrics(
    y_true: np.ndarray | list,
    y_pred: np.ndarray | list,
    threshold: float = 7.0,
) -> dict[str, float]:
    """Computes all standard DTA metrics: CI, MSE, r2m, AUPR, and Spearman."""
    return {
        "ci": concordance_index(y_true, y_pred),
        "mse": mean_squared_error(y_true, y_pred),
        "r2m": rm2_score(y_true, y_pred),
        "aupr": aupr_score(y_true, y_pred, threshold=threshold),
        "spearman": spearman_correlation(y_true, y_pred),
    }
