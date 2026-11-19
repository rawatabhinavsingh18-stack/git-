"""Training entrypoint for DeepDTA+.

Allows direct execution from the repository root:
    python train.py --smoke
    python train.py --epochs 100 --batch_size 256
"""

from __future__ import annotations

import os
import sys

_SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from dtaplus.train import main, train_cnn

__all__ = ["main", "train_cnn"]

if __name__ == "__main__":
    main()
