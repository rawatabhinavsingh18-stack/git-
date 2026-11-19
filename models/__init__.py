"""DeepDTA+ Models package wrapper.

Re-exports model architectures for top-level access:
    from models import DeepDTACNN, SimilarityGBM, DTAEnsemble, MeanPredictor
"""

from __future__ import annotations

import os
import sys

_SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(_SRC_DIR))

from dtaplus.models.cnn import DeepDTACNN
from dtaplus.models.ensemble import DTAEnsemble
from dtaplus.models.gbm import MeanPredictor, SimilarityGBM

__all__ = ["DTAEnsemble", "DeepDTACNN", "MeanPredictor", "SimilarityGBM"]
