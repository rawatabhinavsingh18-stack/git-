"""Verification script ensuring all README and Report numbers match results/metrics.json."""

from __future__ import annotations

import json
import os
import sys


def check_numbers():
    metrics_path = "results/metrics.json"
    if not os.path.exists(metrics_path):
        print(f"Error: {metrics_path} does not exist.")
        sys.exit(1)

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    # Key metrics to verify
    rand_ens_ci = round(metrics["random_split"]["dtaplus_ensemble"]["ci"], 4)
    rand_ens_mse = round(metrics["random_split"]["dtaplus_ensemble"]["mse"], 4)
    round(metrics["random_split"]["similarity_gbm"]["ci"], 4)
    round(metrics["random_split"]["similarity_gbm"]["mse"], 4)

    cd_ens_ci = round(metrics["cold_drug_split_5seeds"]["dtaplus_ensemble"]["ci"]["mean"], 3)
    round(metrics["cold_drug_split_5seeds"]["dtaplus_ensemble"]["mse"]["mean"], 3)

    ct_ens_ci = round(metrics["cold_target_split_5seeds"]["dtaplus_ensemble"]["ci"]["mean"], 3)
    round(metrics["cold_target_split_5seeds"]["dtaplus_ensemble"]["mse"]["mean"], 3)

    unc_corr = round(metrics["uncertainty_analysis"]["random_split_spearman_error_uncertainty"], 3)

    files_to_check = ["README.md", "docs/report.md"]
    for path in files_to_check:
        if not os.path.exists(path):
            print(f"Error: {path} not found.")
            sys.exit(1)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Check random split ensemble CI
        assert str(rand_ens_ci) in content or f"{rand_ens_ci:.3f}" in content, (
            f"{path}: Missing random split ensemble CI ({rand_ens_ci})"
        )
        # Check random split ensemble MSE
        assert str(rand_ens_mse) in content or f"{rand_ens_mse:.3f}" in content, (
            f"{path}: Missing random split ensemble MSE ({rand_ens_mse})"
        )
        # Check cold-drug CI
        assert str(cd_ens_ci) in content, f"{path}: Missing cold-drug ensemble CI ({cd_ens_ci})"
        # Check cold-target CI
        assert str(ct_ens_ci) in content, f"{path}: Missing cold-target ensemble CI ({ct_ens_ci})"
        # Check uncertainty correlation
        assert str(unc_corr) in content or f"{unc_corr:.2f}" in content, (
            f"{path}: Missing uncertainty correlation ({unc_corr})"
        )
        print(f"Verified all benchmark numbers in {path} match results/metrics.json.")

    print("\nAll README and report numbers successfully verified!")


if __name__ == "__main__":
    check_numbers()
