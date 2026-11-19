"""Comprehensive evaluation runner and benchmark generator for DeepDTA+."""

from __future__ import annotations

import argparse
import json
import os
import time
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from dtaplus.data import DavisData
from dtaplus.metrics import compute_all_metrics
from dtaplus.models.ensemble import DTAEnsemble
from dtaplus.models.gbm import MeanPredictor, SimilarityGBM
from dtaplus.uncertainty import evaluate_uncertainty_correlation


def evaluate_gbm_split(
    data: DavisData,
    split_type: str = "random",
    seed: int = 0,
) -> dict[str, Any]:
    """Trains and evaluates SimilarityGBM on the specified split."""
    if split_type == "random":
        splits = data.get_random_split(val_fold_idx=0)
        train_idx = data.official_train_union
        test_idx = splits.test_idx
    elif split_type == "cold_drug":
        splits = data.get_cold_drug_split(seed=seed)
        train_idx = splits.train_idx
        test_idx = splits.test_idx
    elif split_type == "cold_target":
        splits = data.get_cold_target_split(seed=seed)
        train_idx = splits.train_idx
        test_idx = splits.test_idx
    else:
        raise ValueError(f"Unknown split type: {split_type}")

    t0 = time.time()
    model = SimilarityGBM(random_state=seed)
    model.fit_dataset(data, train_idx, split_type=split_type)
    fit_time = time.time() - t0

    preds = model.predict_indices(data, test_idx)
    y_test = data.y[test_idx]
    metrics = compute_all_metrics(y_test, preds)
    metrics["fit_time_sec"] = round(fit_time, 2)
    metrics["num_train"] = len(train_idx)
    metrics["num_test"] = len(test_idx)
    return {
        "metrics": metrics,
        "preds": preds,
        "y_true": y_test,
    }


def evaluate_mean_split(
    data: DavisData,
    split_type: str = "random",
    seed: int = 0,
) -> dict[str, Any]:
    """Evaluates the MeanPredictor baseline on the specified split."""
    if split_type == "random":
        train_idx = data.official_train_union
        test_idx = data.official_test_fold
    elif split_type == "cold_drug":
        splits = data.get_cold_drug_split(seed=seed)
        train_idx = splits.train_idx
        test_idx = splits.test_idx
    elif split_type == "cold_target":
        splits = data.get_cold_target_split(seed=seed)
        train_idx = splits.train_idx
        test_idx = splits.test_idx
    else:
        raise ValueError(f"Unknown split type: {split_type}")

    model = MeanPredictor().fit(data.y[train_idx])
    preds = model.predict(len(test_idx))
    y_test = data.y[test_idx]
    metrics = compute_all_metrics(y_test, preds)
    return {
        "metrics": metrics,
        "preds": preds,
        "y_true": y_test,
    }


def evaluate_ensemble_split(
    data: DavisData,
    split_type: str = "random",
    seed: int = 0,
    num_seeds: int = 3,
) -> dict[str, Any]:
    """Trains and evaluates DTAEnsemble on the specified split."""
    if split_type == "random":
        splits = data.get_random_split(val_fold_idx=0)
        train_idx = data.official_train_union
        val_idx = splits.val_idx
        test_idx = splits.test_idx
    elif split_type == "cold_drug":
        splits = data.get_cold_drug_split(seed=seed)
        train_idx = splits.train_idx
        val_idx = splits.val_idx
        test_idx = splits.test_idx
    elif split_type == "cold_target":
        splits = data.get_cold_target_split(seed=seed)
        train_idx = splits.train_idx
        val_idx = splits.val_idx
        test_idx = splits.test_idx
    else:
        raise ValueError(f"Unknown split type: {split_type}")

    t0 = time.time()
    ensemble = DTAEnsemble(num_gbm_seeds=num_seeds, random_state=seed)
    ensemble.fit_dataset(data, train_idx, val_idx=val_idx, split_type=split_type)
    fit_time = time.time() - t0

    preds, spread = ensemble.predict_indices(data, test_idx)
    y_test = data.y[test_idx]
    metrics = compute_all_metrics(y_test, preds)
    metrics["fit_time_sec"] = round(fit_time, 2)

    unc_eval = evaluate_uncertainty_correlation(y_test, preds, spread)
    metrics["spearman_error_uncertainty"] = unc_eval["spearman_error_uncertainty"]

    return {
        "metrics": metrics,
        "preds": preds,
        "spread": spread,
        "y_true": y_test,
    }


def run_full_benchmark(data: DavisData, output_dir: str = "results") -> dict[str, Any]:
    """Executes the complete evaluation benchmark across all models and splits."""
    os.makedirs(output_dir, exist_ok=True)
    fig_dir = os.path.join(output_dir, "figures")
    os.makedirs(fig_dir, exist_ok=True)

    print("\n--- Running Random Split Benchmark ---")
    mean_rand = evaluate_mean_split(data, split_type="random")
    gbm_rand = evaluate_gbm_split(data, split_type="random")
    ens_rand = evaluate_ensemble_split(data, split_type="random", seed=0, num_seeds=3)

    print(f"Mean Predictor   CI: {mean_rand['metrics']['ci']:.4f}  MSE: {mean_rand['metrics']['mse']:.4f}")
    print(f"Similarity GBM   CI: {gbm_rand['metrics']['ci']:.4f}  MSE: {gbm_rand['metrics']['mse']:.4f}")
    print(f"DTA+ Ensemble    CI: {ens_rand['metrics']['ci']:.4f}  MSE: {ens_rand['metrics']['mse']:.4f}")

    print("\n--- Running Cold-Drug Benchmark (5 Seeds) ---")
    gbm_cold_drug = []
    ens_cold_drug = []
    mean_cold_drug = []
    for s in range(5):
        m_res = evaluate_mean_split(data, split_type="cold_drug", seed=s)
        g_res = evaluate_gbm_split(data, split_type="cold_drug", seed=s)
        e_res = evaluate_ensemble_split(data, split_type="cold_drug", seed=s, num_seeds=3)
        mean_cold_drug.append(m_res["metrics"])
        gbm_cold_drug.append(g_res["metrics"])
        ens_cold_drug.append(e_res["metrics"])

    print("\n--- Running Cold-Target Benchmark (5 Seeds) ---")
    gbm_cold_target = []
    ens_cold_target = []
    mean_cold_target = []
    for s in range(5):
        m_res = evaluate_mean_split(data, split_type="cold_target", seed=s)
        g_res = evaluate_gbm_split(data, split_type="cold_target", seed=s)
        e_res = evaluate_ensemble_split(data, split_type="cold_target", seed=s, num_seeds=3)
        mean_cold_target.append(m_res["metrics"])
        gbm_cold_target.append(g_res["metrics"])
        ens_cold_target.append(e_res["metrics"])

    def aggregate_seeds(results: list[dict[str, float]]) -> dict[str, dict[str, float]]:
        keys = ["ci", "mse", "r2m", "aupr", "spearman"]
        out = {}
        for k in keys:
            vals = [r[k] for r in results]
            out[k] = {
                "mean": round(float(np.mean(vals)), 4),
                "std": round(float(np.std(vals)), 4),
            }
        return out

    benchmarks = {
        "dataset": "Davis",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "random_split": {
            "predict_the_mean": mean_rand["metrics"],
            "deepdta_paper_cnn": {
                "ci": 0.878,
                "mse": 0.261,
                "r2m": 0.630,
                "aupr": 0.714,
                "source": "DeepDTA paper (Öztürk et al., 2018)",
            },
            "similarity_gbm": gbm_rand["metrics"],
            "dtaplus_ensemble": ens_rand["metrics"],
        },
        "cold_drug_split_5seeds": {
            "predict_the_mean": aggregate_seeds(mean_cold_drug),
            "similarity_gbm": aggregate_seeds(gbm_cold_drug),
            "dtaplus_ensemble": aggregate_seeds(ens_cold_drug),
        },
        "cold_target_split_5seeds": {
            "predict_the_mean": aggregate_seeds(mean_cold_target),
            "similarity_gbm": aggregate_seeds(gbm_cold_target),
            "dtaplus_ensemble": aggregate_seeds(ens_cold_target),
        },
        "uncertainty_analysis": {
            "random_split_spearman_error_uncertainty": ens_rand["metrics"].get(
                "spearman_error_uncertainty", 0.0
            ),
        },
    }

    # Save metrics.json
    metrics_path = os.path.join(output_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(benchmarks, f, indent=2)
    print(f"\nSaved metrics to {metrics_path}")

    # Generate Figure 1: Predicted vs Measured
    fig, ax = plt.subplots(figsize=(6, 6))
    y_te = ens_rand["y_true"]
    p_te = ens_rand["preds"]
    ax.scatter(y_te, p_te, alpha=0.15, color="#1f77b4", edgecolors="none", s=20)
    mn, mx = min(y_te.min(), p_te.min()) - 0.2, max(y_te.max(), p_te.max()) + 0.2
    ax.plot([mn, mx], [mn, mx], "r--", linewidth=1.5, label="Ideal (y = x)")
    ax.set_xlabel("Measured pKd", fontsize=11)
    ax.set_ylabel("Predicted pKd", fontsize=11)
    ax.set_title(
        f"DeepDTA+ Ensemble: Predicted vs Measured\n(CI: {ens_rand['metrics']['ci']:.4f}, MSE: {ens_rand['metrics']['mse']:.4f})",
        fontsize=12,
    )
    ax.legend(loc="upper left")
    ax.grid(True, linestyle=":", alpha=0.5)
    plt.tight_layout()
    fig1_path = os.path.join(fig_dir, "predicted_vs_measured.png")
    fig.savefig(fig1_path, dpi=200)
    plt.close(fig)
    print(f"Saved figure: {fig1_path}")

    # Generate Figure 2: CI Bars by Split
    fig, ax = plt.subplots(figsize=(8, 5))
    splits = ["Random Split", "Cold-Drug Split", "Cold-Target Split"]
    x = np.arange(len(splits))
    width = 0.22

    mean_cis = [
        mean_rand["metrics"]["ci"],
        benchmarks["cold_drug_split_5seeds"]["predict_the_mean"]["ci"]["mean"],
        benchmarks["cold_target_split_5seeds"]["predict_the_mean"]["ci"]["mean"],
    ]
    paper_cis = [0.878, np.nan, np.nan]  # Paper only reported random split
    gbm_cis = [
        gbm_rand["metrics"]["ci"],
        benchmarks["cold_drug_split_5seeds"]["similarity_gbm"]["ci"]["mean"],
        benchmarks["cold_target_split_5seeds"]["similarity_gbm"]["ci"]["mean"],
    ]
    gbm_errs = [
        0.0,
        benchmarks["cold_drug_split_5seeds"]["similarity_gbm"]["ci"]["std"],
        benchmarks["cold_target_split_5seeds"]["similarity_gbm"]["ci"]["std"],
    ]
    ens_cis = [
        ens_rand["metrics"]["ci"],
        benchmarks["cold_drug_split_5seeds"]["dtaplus_ensemble"]["ci"]["mean"],
        benchmarks["cold_target_split_5seeds"]["dtaplus_ensemble"]["ci"]["mean"],
    ]
    ens_errs = [
        0.0,
        benchmarks["cold_drug_split_5seeds"]["dtaplus_ensemble"]["ci"]["std"],
        benchmarks["cold_target_split_5seeds"]["dtaplus_ensemble"]["ci"]["std"],
    ]

    ax.bar(x - 1.5 * width, mean_cis, width, label="Predict Mean", color="#7f7f7f")
    ax.bar(x - 0.5 * width, paper_cis, width, label="DeepDTA CNN (Paper)", color="#2ca02c")
    ax.bar(x + 0.5 * width, gbm_cis, width, yerr=gbm_errs, capsize=4, label="Similarity GBM", color="#ff7f0e")
    ax.bar(x + 1.5 * width, ens_cis, width, yerr=ens_errs, capsize=4, label="DeepDTA+ Ensemble", color="#1f77b4")

    ax.set_ylabel("Concordance Index (CI)", fontsize=11)
    ax.set_ylim(0.4, 0.95)
    ax.set_xticks(x)
    ax.set_xticklabels(splits, fontsize=11)
    ax.set_title("Generalization Benchmark: CI Across Evaluation Splits", fontsize=12)
    ax.legend(loc="upper right")
    ax.grid(True, linestyle=":", alpha=0.5, axis="y")
    plt.tight_layout()
    fig2_path = os.path.join(fig_dir, "ci_bars_by_split.png")
    fig.savefig(fig2_path, dpi=200)
    plt.close(fig)
    print(f"Saved figure: {fig2_path}")

    # Generate Figure 3: Error vs Uncertainty
    fig, ax = plt.subplots(figsize=(6, 5))
    spread = ens_rand["spread"]
    abs_err = np.abs(y_te - p_te)
    ax.scatter(spread, abs_err, alpha=0.15, color="#9467bd", edgecolors="none", s=20)

    # Bin spread into 5 quantiles to show error trend
    bins = np.linspace(spread.min(), spread.max(), 10)
    bin_idx = np.digitize(spread, bins)
    bin_centers = 0.5 * (bins[:-1] + bins[1:])
    mean_errs = [abs_err[bin_idx == i].mean() if np.any(bin_idx == i) else np.nan for i in range(1, 10)]
    valid = ~np.isnan(mean_errs)
    ax.plot(bin_centers[valid], np.array(mean_errs)[valid], "r-o", linewidth=2, label="Mean Error Trend")

    corr = ens_rand["metrics"].get("spearman_error_uncertainty", 0.0)
    ax.set_xlabel("Ensemble Uncertainty Spread (std)", fontsize=11)
    ax.set_ylabel("Absolute Prediction Error (|y - p|)", fontsize=11)
    ax.set_title(f"Uncertainty vs Error (Spearman r = {corr:.3f})", fontsize=12)
    ax.legend()
    ax.grid(True, linestyle=":", alpha=0.5)
    plt.tight_layout()
    fig3_path = os.path.join(fig_dir, "error_vs_uncertainty.png")
    fig.savefig(fig3_path, dpi=200)
    plt.close(fig)
    print(f"Saved figure: {fig3_path}")

    return benchmarks


def main():
    parser = argparse.ArgumentParser(description="Evaluate DeepDTA+ models.")
    parser.add_argument(
        "--model",
        type=str,
        default="gbm",
        choices=["gbm", "mean", "ensemble"],
        help="Model to evaluate.",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="random",
        choices=["random", "cold_drug", "cold_target"],
        help="Evaluation split protocol.",
    )
    parser.add_argument("--data_dir", type=str, default="data/davis", help="Path to Davis data.")
    parser.add_argument("--seed", type=int, default=0, help="Random seed for cold splits.")
    parser.add_argument("--all", action="store_true", help="Run full benchmark across all models and splits.")
    args = parser.parse_args()

    data = DavisData(data_dir=args.data_dir)

    if args.all:
        run_full_benchmark(data)
        return

    if args.model == "gbm":
        res = evaluate_gbm_split(data, split_type=args.split, seed=args.seed)
        m = res["metrics"]
        print(f"\n================ GBM {args.split.upper()} Results ================")
        print(f"CI       : {m['ci']:.4f}")
        print(f"MSE      : {m['mse']:.4f}")
        print(f"r2m      : {m['r2m']:.4f}")
        print(f"AUPR     : {m['aupr']:.4f}")
        print(f"Spearman : {m['spearman']:.4f}")
        print(f"Fit Time : {m['fit_time_sec']}s")
        print("==========================================================\n")
        return

    if args.model == "ensemble":
        res = evaluate_ensemble_split(data, split_type=args.split, seed=args.seed)
        m = res["metrics"]
        print(f"\n================ Ensemble {args.split.upper()} Results ================")
        print(f"CI       : {m['ci']:.4f}")
        print(f"MSE      : {m['mse']:.4f}")
        print(f"r2m      : {m['r2m']:.4f}")
        print(f"AUPR     : {m['aupr']:.4f}")
        print(f"Spearman : {m['spearman']:.4f}")
        print(f"Fit Time : {m['fit_time_sec']}s")
        print("===============================================================\n")
        return

    if args.model == "mean":
        res = evaluate_mean_split(data, split_type=args.split, seed=args.seed)
        m = res["metrics"]
        print("\n================ Mean Predictor Results ================")
        print(f"CI       : {m['ci']:.4f}")
        print(f"MSE      : {m['mse']:.4f}")
        print(f"r2m      : {m['r2m']:.4f}")
        print(f"AUPR     : {m['aupr']:.4f}")
        print(f"Spearman : {m['spearman']:.4f}")
        print("========================================================\n")
        return


if __name__ == "__main__":
    main()
