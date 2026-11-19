"""Training script for DeepDTA+ PyTorch CNN model."""

from __future__ import annotations

import argparse
import json
import os
import random
import time

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from dtaplus.data import DavisData
from dtaplus.metrics import concordance_index, mean_squared_error
from dtaplus.models.cnn import DeepDTACNN


def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def create_dataloader(
    drugs: np.ndarray,
    prots: np.ndarray,
    affinities: np.ndarray,
    batch_size: int = 256,
    shuffle: bool = True,
) -> DataLoader:
    t_drugs = torch.from_numpy(drugs).long()
    t_prots = torch.from_numpy(prots).long()
    t_y = torch.from_numpy(affinities).float()
    dataset = TensorDataset(t_drugs, t_prots, t_y)
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)


def train_cnn(
    data: DavisData,
    val_fold_idx: int = 0,
    epochs: int = 100,
    lr: float = 0.001,
    batch_size: int = 256,
    device: str = "cpu",
    smoke: bool = False,
    smoke_pairs: int = 2000,
    seed: int = 42,
    save_dir: str = "results/checkpoints",
) -> dict[str, float]:
    set_seed(seed)
    os.makedirs(save_dir, exist_ok=True)

    splits = data.get_random_split(val_fold_idx=val_fold_idx)
    train_idx = splits.train_idx
    val_idx = splits.val_idx

    if smoke:
        epochs = min(epochs, 2)
        train_idx = train_idx[:smoke_pairs]
        val_idx = val_idx[: min(len(val_idx), 500)]
        batch_size = min(batch_size, 64)
        print(f"[SMOKE MODE] Running {epochs} epochs on {len(train_idx)} pairs, batch_size={batch_size}")

    train_loader = create_dataloader(
        data.encoded_drugs[train_idx],
        data.encoded_proteins[train_idx],
        data.y[train_idx],
        batch_size=batch_size,
        shuffle=True,
    )
    val_loader = create_dataloader(
        data.encoded_drugs[val_idx],
        data.encoded_proteins[val_idx],
        data.y[val_idx],
        batch_size=batch_size,
        shuffle=False,
    )

    model = DeepDTACNN().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    best_val_ci = -1.0
    best_epoch = 0
    history = []
    initial_loss = None
    final_loss = None

    t_start = time.time()
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss_sum = 0.0
        train_count = 0

        for b_smi, b_prot, b_y in train_loader:
            b_smi = b_smi.to(device)
            b_prot = b_prot.to(device)
            b_y = b_y.to(device)

            optimizer.zero_grad()
            preds = model(b_smi, b_prot)
            loss = criterion(preds, b_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
            optimizer.step()

            train_loss_sum += loss.item() * len(b_y)
            train_count += len(b_y)

        train_loss = train_loss_sum / train_count
        if initial_loss is None:
            initial_loss = train_loss
        final_loss = train_loss

        # Validation
        model.eval()
        val_preds_list = []
        with torch.no_grad():
            for b_smi, b_prot, _ in val_loader:
                b_smi = b_smi.to(device)
                b_prot = b_prot.to(device)
                p = model(b_smi, b_prot)
                val_preds_list.append(p.cpu().numpy())

        val_preds = np.concatenate(val_preds_list)
        y_val = data.y[val_idx]
        val_ci = concordance_index(y_val, val_preds)
        val_mse = mean_squared_error(y_val, val_preds)

        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "val_ci": val_ci,
            "val_mse": val_mse,
        })

        print(
            f"Epoch {epoch:02d}/{epochs:02d} | "
            f"Train Loss (MSE): {train_loss:.4f} | "
            f"Val CI: {val_ci:.4f} | "
            f"Val MSE: {val_mse:.4f}"
        )

        if val_ci > best_val_ci:
            best_val_ci = val_ci
            best_epoch = epoch
            ckpt_path = os.path.join(save_dir, "deepdta_cnn_best.pt")
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_ci": val_ci,
                    "val_mse": val_mse,
                },
                ckpt_path,
            )

    elapsed = time.time() - t_start

    # Save training summary config
    cfg = {
        "model": "DeepDTACNN",
        "epochs": epochs,
        "lr": lr,
        "batch_size": batch_size,
        "smoke": smoke,
        "seed": seed,
        "device": device,
        "best_epoch": best_epoch,
        "best_val_ci": best_val_ci,
        "initial_loss": initial_loss,
        "final_loss": final_loss,
        "elapsed_sec": round(elapsed, 2),
    }
    with open(os.path.join(save_dir, "training_summary.json"), "w") as f:
        json.dump(cfg, f, indent=2)

    return cfg


def main():
    parser = argparse.ArgumentParser(description="Train DeepDTA+ models.")
    parser.add_argument("--model", type=str, default="cnn", choices=["cnn"], help="Model type.")
    parser.add_argument("--smoke", action="store_true", help="Run quick 2-epoch smoke test.")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs.")
    parser.add_argument("--batch_size", type=int, default=256, help="Batch size.")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--data_dir", type=str, default="data/davis")
    parser.add_argument("--save_dir", type=str, default="results/checkpoints")
    args = parser.parse_args()

    data = DavisData(data_dir=args.data_dir)
    res = train_cnn(
        data=data,
        val_fold_idx=0,
        epochs=args.epochs,
        lr=args.lr,
        batch_size=args.batch_size,
        device=args.device,
        smoke=args.smoke,
        seed=args.seed,
        save_dir=args.save_dir,
    )
    print("\nTraining complete! Summary:", json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
