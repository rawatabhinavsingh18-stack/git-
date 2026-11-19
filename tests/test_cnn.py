"""Unit and overfit tests for DeepDTACNN PyTorch model."""

import torch
from torch import nn

from dtaplus.models.cnn import DeepDTACNN


def test_cnn_output_shape():
    model = DeepDTACNN()
    model.eval()

    batch_size = 4
    dummy_smi = torch.randint(1, 64, (batch_size, 85))
    dummy_prot = torch.randint(1, 25, (batch_size, 1200))

    with torch.no_grad():
        out = model(dummy_smi, dummy_prot)

    assert out.shape == (batch_size,), f"Expected shape ({batch_size},), got {out.shape}"
    assert not torch.isnan(out).any(), "NaN found in predictions"


def test_cnn_deterministic_seed():
    torch.manual_seed(123)
    model1 = DeepDTACNN()
    model1.eval()

    torch.manual_seed(123)
    model2 = DeepDTACNN()
    model2.eval()

    dummy_smi = torch.randint(1, 64, (2, 85))
    dummy_prot = torch.randint(1, 25, (2, 1200))

    with torch.no_grad():
        out1 = model1(dummy_smi, dummy_prot)
        out2 = model2(dummy_smi, dummy_prot)

    torch.testing.assert_close(out1, out2)


def test_cnn_one_batch_overfit():
    torch.manual_seed(42)
    model = DeepDTACNN(dropout=0.0)
    model.train()

    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()

    batch_size = 4
    dummy_smi = torch.randint(1, 64, (batch_size, 85))
    dummy_prot = torch.randint(1, 25, (batch_size, 1200))
    target_y = torch.tensor([5.0, 6.0, 7.0, 8.0])

    initial_loss = None
    for step in range(100):
        optimizer.zero_grad()
        pred = model(dummy_smi, dummy_prot)
        loss = criterion(pred, target_y)
        loss.backward()
        optimizer.step()

        if initial_loss is None:
            initial_loss = loss.item()

    final_loss = loss.item()
    print(f"One-batch overfit: initial_loss={initial_loss:.4f}, final_loss={final_loss:.4f}")
    assert final_loss < 0.05, f"Expected final loss < 0.05, got {final_loss:.4f}"
    assert final_loss < initial_loss * 0.01, "Loss did not decrease by at least 99%"
