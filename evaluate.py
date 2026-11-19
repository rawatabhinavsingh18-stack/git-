"""Evaluation and benchmarking entrypoint for DeepDTA+.

Allows direct execution from the repository root:
    python evaluate.py --all
    python evaluate.py --model gbm --split random
    python evaluate.py --model ensemble --split cold_drug
"""

from __future__ import annotations

import os
import sys

_SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from dtaplus.evaluate import (
    evaluate_ensemble_split,
    evaluate_gbm_split,
    evaluate_mean_split,
    main,
    run_full_benchmark,
)

__all__ = [
    "evaluate_ensemble_split",
    "evaluate_gbm_split",
    "evaluate_mean_split",
    "main",
    "run_full_benchmark",
]

if __name__ == "__main__":
    main()
