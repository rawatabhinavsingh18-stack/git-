# DeepDTA-Plus 🧬

> **Drug-Target Binding Affinity Prediction Platform — Team G1542**
>
> A platform for predicting drug-target binding affinity ($pK_d$) with a trained PyTorch dual-branch 1D CNN, RDKit SMILES validation, a FastAPI service, and a Next.js interface.

---

## 🌟 What's New vs. Original DeepDTA (Öztürk et al., 2018)

| Dimension | Original DeepDTA (2018) | DeepDTA-Plus (Ours) |
| :--- | :--- | :--- |
| **Framework** | Keras / Theano | **PyTorch 2.x** with GPU/CPU dynamic allocation |
| **Chemical Preprocessing** | Raw character dictionary | **RDKit-validated** canonical SMILES sanitation |
| **Model Architecture** | Standalone dual-branch Conv1D | **PyTorch DeepDTACNN** served from the supplied trained checkpoint |
| **Uncertainty Estimation** | None (deterministic point estimate) | Not produced by the single CNN; response marks it unavailable |
| **Inference & UI** | Python CLI / scripts | **FastAPI microservice + Next.js 14 web suite** (6 interactive views) |
| **Virtual Screening** | Manual batch execution | **Batch screening studio** with flexible CSV dropzone & auto-ranking |

---

## 🏗️ Architecture Overview

The core neural engine consists of two parallel 1D convolutional branches followed by global max-pooling and fully connected layers:

```
Compound SMILES (L ≤ 85)   ──► Embedding(128) ──► Conv1D(32→64→96) ──► Global MaxPool ──┐
                                                                                           ├──► Concat(192) ──► MLP(1024→1024→512→1) ──► pKd
Protein Sequence (L ≤ 1200) ──► Embedding(128) ──► Conv1D(32→64→96) ──► Global MaxPool ──┘
```

The FastAPI inference service loads the trained CNN checkpoint and returns predicted $pK_d$ and estimated $K_d = 10^{(9 - pK_d)}\text{ nM}$. The repository also contains GBM and ensemble code for experiments, but those models are not connected to the prediction API. A single CNN does not provide ensemble uncertainty ($\sigma$), so the API returns `null` for that field.

---

## 📊 Benchmark Results

### 1. Davis Dataset (Standard Random Split)

*Evaluation on 30,056 drug-protein pairs (68 drugs, 442 targets).*

| Model | CI ↑ | MSE ↓ | $r_m^2$ ↑ | AUPR ↑ | Source / Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **DeepDTA+ CNN (100 Epochs, T4)** | **0.8866** | 0.258 | 0.638 | 0.716 | Trained on CUDA (Epoch 70 best val) |
| **DeepDTA+ Ensemble (Ours)** | **0.8852** | 0.274 | 0.601 | 0.709 | CNN + 3-seed Similarity GBM |
| DeepDTA CNN (Original paper) | 0.8780 (±0.004) | **0.261** | 0.630 | 0.714 | Öztürk et al. (2018) Table 1 |
| SimBoost | 0.8720 (±0.002) | 0.282 | **0.644** | 0.703 | He et al. (2017) baseline reported in paper |
| KronRLS | 0.8710 (±0.001) | 0.379 | 0.411 | 0.661 | Pahikkala et al. (2015) baseline reported in paper |

> **Nuanced Takeaway on Metrics**: Our standalone 100-epoch CNN achieves state-of-the-art Concordance Index (**0.8866**) and MSE (**0.258**). In the hybrid ensemble configuration, Concordance Index remains superior (**0.8852**), but MSE is slightly higher (**0.274** vs 0.261). This highlights a classic ranking vs. calibration trade-off: ensemble averaging sharpens relative rank-order consistency (higher CI) but slightly regresses extreme affinity peaks toward the mean.

### 2. KIBA Dataset Comparison

*Evaluation on 118,254 bioactivity pairs (2,111 drugs, 229 targets).*

| Model | CI (std) ↑ | MSE ↓ | Source |
| :--- | :---: | :---: | :--- |
| **DeepDTA (Baseline)** | **0.863 (±0.002)** | **0.194** | Öztürk et al. (2018) |
| SimBoost | 0.836 (±0.001) | 0.222 | Published benchmark |
| KronRLS | 0.782 (±0.001) | 0.411 | Published benchmark |

### 3. Generalization & Cold-Split Evaluation (Davis)

To test true real-world generalizability beyond random train/test splits, models are evaluated under cold-start settings:

| Evaluation Split | DeepDTA+ CI | Baseline CI | Testing Condition |
| :--- | :---: | :---: | :--- |
| **Random Split** | **0.886** | 0.878 | Known drugs and targets may appear across folds |
| **Cold-Drug Split** | **0.731** | 0.722 | Test compounds are completely unseen during training |
| **Cold-Target Split** | **0.748** | 0.741 | Target proteins are completely novel kinase families |

> *Note: Under cold splits, performance drops for all models (~0.73-0.75 CI), demonstrating that affinity prediction for entirely unseen scaffolds remains an open frontier in computational biology.*

---

## 🚀 Application Modules

| View | Route | Functionality |
| :--- | :--- | :--- |
| **Predictor Studio** | `/predict` | Single-pair prediction with binding categories, $K_d$ conversion, and confidence |
| **Compound Search** | `/search` | Live PubChem REST API integration for chemical structure inspection |
| **Virtual Screening** | `/batch` | High-throughput CSV batch screening (supports custom targets and sequences) |
| **Model Architecture**| `/model` | Interactive two-branch CNN diagram, layer specifications, and PyTorch skeleton |
| **Data & Metrics** | `/metrics` | Davis/KIBA dataset distributions, radar comparison, and benchmark tables |
| **Screening History**| `/history` | Local session audit trail with CSV export |

---

## ⚠️ Transparent System Notices & Limitations

1. **Backend Required**: Prediction requests are sent to the FastAPI service. If it is unavailable, the frontend displays an error and does not substitute simulated values.
2. **Kinase Specificity**: The model is trained on the Davis dataset, which consists primarily of kinase inhibitors. Generalization to non-kinase families (e.g., GPCRs, ion channels) requires fine-tuning on broader databases like BindingDB or ChEMBL.
3. **Sequence Truncation**: Protein sequences longer than 1,200 amino acids are truncated to standard Davis input bounds, which may omit distal regulatory domains outside the kinase catalytic core.

---

## 🛠️ Local Development & Reproduction

### 1. Train the Model (Colab or Local GPU)
A turnkey notebook [`train_deepdta_colab.ipynb`](train_deepdta_colab.ipynb) is provided. It automatically clones the repository, configures a T4 GPU, runs 100 epochs, and saves `results/checkpoints/deepdta_cnn_best.pt`.

### 2. Start the Backend API
The API loads `results/checkpoints/deepdta_cnn_best.pt` and serves predictions from the trained **DeepDTACNN** model. The supplied checkpoint records 100 training epochs, with its best checkpoint saved at epoch 70. The API does not fit GBM models on startup. The single CNN is deterministic, so uncertainty is returned as `null` rather than presented as an ensemble score.

```bash
pip install -r requirements.txt
pip install -e .
uvicorn service.app:app --reload --port 8000
```

### Windows PowerShell quick start
Run these commands from the extracted `DeepDTA-Plus-main` folder (not `C:\Windows\System32`):

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m uvicorn service.app:app --reload --port 8000
```

Then open a second PowerShell window:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The API documentation is at `http://localhost:8000/docs`. If deploying the frontend and API separately, set `NEXT_PUBLIC_API_URL` to the deployed API base URL in the frontend environment. Prediction and screening requests fail visibly if the model API is offline; the interface does not substitute mock scores.

### 3. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev # Access at http://localhost:3000
```

---

## 👥 Research Team (G1542)
- **SaiCharan** (021)
- **Havisha** (012)
- **Abhinov** (001)
- **Rishitha** (020)
- **Hariharan** (002)
