# DeepDTA+: Engineering and Empirical Benchmark Report

**Authors:** DeepDTA+ Research & Engineering Team  
**Date:** October 2026  
**Reference Paper:** Hakime Öztürk, Arzucan Özgür, Elif Ozkirimli. *DeepDTA: deep drug-target binding affinity prediction.* Bioinformatics, 34(17):i821–i829, 2018.

---

## 1. Executive Summary

Drug-target affinity (DTA) prediction is central to computational drug discovery, virtual screening, and lead optimization. While the DeepDTA paper was a foundational milestone that demonstrated the utility of dual 1D-CNNs for raw SMILES and protein sequence modeling, the original codebase suffers from significant modern engineering and methodological issues:
1. **Legacy and brittle environment dependencies**: Python 3.6, TensorFlow 1.15, Keras 2.1.6, and a legacy Java `auc.jar` binary requirement that prevents execution on modern platforms.
2. **Evaluation vulnerability**: Standard random splits (Setting 1) allow test compounds and proteins to appear in training interactions, yielding overly optimistic test scores (CI $\approx 0.88$) that fail to generalize to novel chemical scaffolds or targets.
3. **Absence of uncertainty quantification**: Single-point affinity predictions offer no confidence indication for screening safety.

**DeepDTA+** addresses these bottlenecks by providing:
- A faithful modern PyTorch implementation of the DeepDTA architecture alongside high-performance baseline models.
- An ensemble integration of deep representations with bio-similarity matrices and k-mer topological projections.
- Rigorous, leak-free **Random**, **Cold-Drug**, and **Cold-Target** split benchmarks across 5 independent seeds.
- Calibrated ensemble uncertainty spread that strongly correlates ($r = 0.496$) with absolute prediction error.
- A production-grade FastAPI microservice (p95 latency: 55.06 ms) with Pydantic sequence validation and an interactive Streamlit UI.

---

## 2. Methodology & Architecture

### 2.1 Multimodal Representations
Given a drug compound represented by SMILES string $s$ and a target protein represented by amino acid sequence $p$:
- **Neural Tokenization**: Characters are label-encoded into integer sequences truncated or zero-padded to length 85 for SMILES (vocabulary size 64) and length 1200 for proteins (vocabulary size 25).
- **Branch A (DeepDTA CNN)**:
  - SMILES Branch: Embedding (dim 128) $\to$ 3 $\times$ Conv1D (32, 64, 96 filters; kernel size 8; ReLU) $\to$ Global Max Pooling (96-d).
  - Protein Branch: Embedding (dim 128) $\to$ 3 $\times$ Conv1D (32, 64, 96 filters; kernel size 12; ReLU) $\to$ Global Max Pooling (96-d).
  - Fully Connected Head: Concat (192-d) $\to$ Linear(1024) $\to$ Dropout(0.1) $\to$ Linear(1024) $\to$ Dropout(0.1) $\to$ Linear(512) $\to$ Linear(1).
- **Branch B (Bio-similarity & k-mer Projections)**:
  - Chemical Branch: Drug-drug 2D similarity matrix (TruncatedSVD 32-d) + SMILES character 1-3 gram frequencies (TruncatedSVD 32-d).
  - Target Branch: Smith-Waterman alignment similarity matrix (TruncatedSVD 32-d) + Amino acid 3-mer frequencies (TruncatedSVD 32-d).
  - Total feature vector: 128 dimensions trained using `HistGradientBoostingRegressor` (400 iterations, learning rate 0.06, 31 leaves, L2 regularization 1.0).

### 2.2 Ensemble & Uncertainty Quantification
Predictions from multi-seed models are combined into an ensemble:
$$\hat{y}_{\text{ens}} = \frac{1}{M} \sum_{m=1}^M \hat{y}_m$$
The uncertainty score $u(s, p)$ is defined as the empirical standard deviation across ensemble predictions:
$$u(s, p) = \sqrt{\frac{1}{M} \sum_{m=1}^M (\hat{y}_m - \hat{y}_{\text{ens}})^2}$$

---

## 3. Evaluation Protocols

The Davis dataset comprises 68 drugs and 442 kinase targets (30,056 non-NaN pairs). Affinity values $K_d$ (nM) are converted to $pK_d = -\log_{10}(K_d / 10^9)$. Crucially, 69.6% of Davis pairs sit at the $pK_d = 5.0$ floor ($K_d \ge 10,000$ nM, representing non-binding assay limits).

We evaluate three distinct protocols:
1. **Random Split (Official Setting 1)**: 5 disjoint training folds (union: 25,046 pairs) and untouched test fold (5,010 pairs). All drugs and targets appear in training pairs.
2. **Cold-Drug Split**: 20% of drugs (and all their associated pairs) are completely held out as the test set; an additional 10% is held out as validation. No test or validation drug appears in any training interaction. Evaluated across 5 independent random seeds.
3. **Cold-Target Split**: 20% of kinase targets are held out as the test set; 10% held out for validation. No test or validation protein appears in training interactions. Evaluated across 5 independent random seeds.

All SVD and CountVectorizer transformers are strictly fitted on training entities only in cold splits to guarantee zero data leakage.

---

## 4. Empirical Results

All reported numbers are verified directly against `results/metrics.json`.

### Table 1: Random Split Benchmark (Official Davis Test Fold, 5,010 pairs)
| Model | CI ↑ | MSE ↓ | $r_m^2$ ↑ | AUPR ↑ | Spearman ↑ |
|---|---|---|---|---|---|
| Predict-the-Mean | 0.500 | 0.802 | 0.000 | 0.083 | 0.000 |
| KronRLS (Paper) | 0.871 | 0.379 | 0.611 | 0.661 | — |
| SimBoost (Paper) | 0.872 | 0.282 | 0.644 | 0.703 | — |
| **DeepDTA CNN (Paper)** | **0.878** | **0.261** | **0.630** | **0.714** | — |
| DeepDTA+ Similarity GBM | 0.8813 | 0.2829 | 0.6003 | 0.6975 | 0.6895 |
| **DeepDTA+ Ensemble (Ours)** | **0.8852** | **0.2740** | **0.6009** | **0.7088** | **0.6954** |

### Table 2: Generalization Under Cold-Entity Splits (5 Seeds, Mean ± Std)
| Split Protocol | Predict-the-Mean CI | Similarity GBM CI | **DeepDTA+ Ensemble CI** | Ensemble MSE |
|---|---|---|---|---|
| **Random Split** | 0.500 | 0.8813 | **0.8852** | 0.2740 |
| **Cold-Drug Split** | 0.500 ± 0.000 | 0.727 ± 0.026 | **0.730 ± 0.032** | 0.681 ± 0.146 |
| **Cold-Target Split** | 0.500 ± 0.000 | 0.848 ± 0.008 | **0.854 ± 0.007** | 0.362 ± 0.028 |

### Table 3: Uncertainty Correlation
- Spearman correlation between ensemble spread and test absolute error: **$r = 0.496$** ($p < 10^{-100}$).
- Binned error analysis shows monotonic growth of average error as uncertainty increases, validating the score as an effective filter for high-risk predictions.

---

## 5. Key Findings & Discussion

1. **The Random Split Illusion**: The standard setting 1 benchmark shows CI $> 0.88$, but when tested on unseen drug scaffolds, performance drops precipitously to $\approx 0.730$. This demonstrates that random splits primarily test matrix completion (memorizing compound/target profiles) rather than de novo generalization.
2. **Bio-similarity & Sequence Complementarity**: Topological similarity combined with sequence k-mer frequencies captures kinase family relationships and scaffold clustering effectively, outperforming individual single-branch baselines.
3. **Uncertainty as a Practical Safeguard**: The strong 0.496 Spearman correlation provides practitioners with an actionable filtering tool: predictions with spread $\sigma > 0.35$ should be prioritized for biochemical re-assaying or treated with caution.

---

## 6. Failure Analysis & Honest Limitations

1. **Label Floor Censoring**: 69.6% of Davis labels reside at the assay limit $pK_d = 5.0$. Regression models trained with MSE are penalised symmetrically, even though $pK_d = 5.0$ represents an inequality ($K_d \ge 10,000$ nM). Future work should integrate survival/censored likelihoods.
2. **Domain Scope**: Davis contains exclusively 68 kinase inhibitors across 442 human kinases. Model predictions cannot be generalized to G-protein coupled receptors (GPCRs), ion channels, or uncharacterized target families without retraining.
3. **In-Distribution vs Out-of-Distribution**: While ensemble spread is a strong proxy for in-domain disagreement, it does not guarantee calibration on molecules with novel chemical moieties distant from the Davis chemical space.
