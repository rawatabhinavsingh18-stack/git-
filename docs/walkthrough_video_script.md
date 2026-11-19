# DeepDTA+ Video Walkthrough Script (6–8 Minutes)

**Presenter:** Lead Research & ML Systems Engineer  
**Visual Cue Key:** `[SLIDE/SCREEN]` indicates what is shown on screen; `[ACTION]` indicates cursor/mouse action.

---

### [00:00 - 01:15] 1. Introduction & Base Paper Overview
**[SLIDE: Title Card — DeepDTA+: Modernized, Honest Drug-Target Affinity Benchmarks]**
> "Hello everyone! Today we present **DeepDTA+**, a modern, production-grade re-engineering and honest evaluation of the seminal DeepDTA paper by Öztürk et al., published in *Bioinformatics 2018*.
> 
> In virtual drug discovery and screening, predicting Drug-Target Affinity—specifically binding affinity $pK_d$ between small molecule ligands and target kinase proteins—is fundamental. 
> 
> The original DeepDTA paper pioneered using deep learning directly on raw text representations: SMILES strings for compounds and amino acid sequences for proteins, using dual 1D Convolutional Neural Networks."

---

### [01:15 - 02:30] 2. The Problems with the Original Paper and Codebase
**[SLIDE: The Reproducibility and Evaluation Challenge]**
> "However, when taking the original implementation into 2026, we face three critical bottlenecks:
> 
> 1. **Brittle, Obsolete Tooling**: The original codebase depends on Python 3.6, TensorFlow 1.15, Keras 2.1.6, and calls a legacy Java jar (`auc.jar`) for metric calculation. It simply fails to install or run on modern operating systems without emulation.
> 2. **The Random Split Generalization Illusion**: In the paper's official setting, pairs are randomly split into train and test folds. This means compounds and proteins seen in training reappear in the test set. Models achieve a high Concordance Index of 0.878, but when evaluated on truly *unseen* drugs or targets, performance collapses.
> 3. **Deterministic Predictions with No Safety Bounds**: Screening engines in clinical pipelines require uncertainty estimates to flag unreliable predictions."

---

### [02:30 - 04:00] 3. Proposed Solution & Architecture
**[SCREEN: docs/architecture.png displayed on screen]**
> "To address this, we developed **DeepDTA+**. Let's examine the architecture.
> 
> First, our neural branch faithfully ports DeepDTA into modern PyTorch with PyTorch 2.x support:
> - Two 128-dimensional embedding layers for SMILES and amino acids.
> - Parallel 3-layer 1D convolutions with 32, 64, and 96 filters, followed by global max pooling and a 3-layer dense head with dropout.
> 
> Second, we introduce a complementary bio-similarity and topological feature branch:
> - For compounds: 2D chemical similarity rows compressed via TruncatedSVD to 32 dimensions, plus SMILES character 1-to-3 gram count projections.
> - For targets: Smith-Waterman sequence alignment similarity compressed to 32 dimensions, plus protein 3-mer frequency projections.
> 
> Third, our **DTAEnsemble** integrates these complementary representations and produces calibrated uncertainty spreads across ensemble members."

---

### [04:00 - 05:45] 4. Honest Empirical Results & Generalization Gaps
**[SCREEN: results/figures/ci_bars_by_split.png and results/figures/predicted_vs_measured.png]**
> "Let's review the verified empirical benchmarks on the Davis dataset:
> 
> - On the **Official Random Split**, our DeepDTA+ Ensemble matches and exceeds the paper, achieving a Concordance Index of **0.8852** and MSE of **0.2740** (beating the paper's CNN CI of 0.878).
> - But here is the honest finding: on our leak-free **Cold-Drug Split**—where 20% of compounds are never seen during training—the CI drops to **0.730 ± 0.032**.
> - On the **Cold-Target Split**, holding out 20% of kinase targets yields a CI of **0.854 ± 0.007**.
> 
> Furthermore, in `results/figures/error_vs_uncertainty.png`, our ensemble spread achieves a **0.496 Spearman rank correlation** with absolute prediction error. When the model exhibits high uncertainty, actual prediction error is provably higher!"

---

### [05:45 - 07:15] 5. Live Service Demo & Engineering Rigor
**[ACTION: Open terminal, show `pytest -v` passing 19/19 tests, then switch browser to Streamlit demo at `docs/demo.png` and FastAPI `/docs`]**
> "Turning to software engineering:
> - We built a comprehensive test suite with 19 unit and integration tests across data shapes, metrics, CNN overfit convergence, leak-free splits, and API routes.
> - Our FastAPI microservice provides `/health`, `/predict`, and `/predict_batch` with strict Pydantic validation.
> - In our 200-request benchmark (`scripts/loadtest.py`), the service achieves a **p95 latency of only 55.06 ms** on CPU, easily surpassing the 300 ms target.
> - Our Streamlit interface lets researchers test inhibitors like Dasatinib or Lapatinib in real-time with qualitative affinity categorization."

---

### [07:15 - 08:00] 6. Summary & Closing
**[SLIDE: Conclusions, GitHub Link, and Limitations]**
> "In summary:
> DeepDTA+ transforms an obsolete 2018 proof-of-concept into a clean, reproducible, production-grade engine. It proves that combining deep representations with bio-similarity provides superior performance, exposes the real generalization gap in cold screening, and equips practitioners with actionable uncertainty estimation.
> 
> Thank you, and the code and benchmarks are fully open and reproducible in the repository!"
