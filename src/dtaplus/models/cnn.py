"""DeepDTA PyTorch Convolutional Neural Network architecture."""

from __future__ import annotations

import torch
import torch.nn.functional as F
from torch import nn

from dtaplus.data import CHARISOSMILEN, CHARPROTLEN


class DeepDTACNN(nn.Module):
    """
    Faithful PyTorch implementation of DeepDTA (Öztürk et al., 2018).
    Two parallel 3-layer 1D-CNN branches (SMILES and protein sequence)
    followed by global max-pooling and a 3-layer MLP.
    """

    def __init__(
        self,
        smi_vocab_size: int = CHARISOSMILEN + 1,  # 65 (0 = padding, 1..64)
        prot_vocab_size: int = CHARPROTLEN + 1,  # 26 (0 = padding, 1..25)
        embedding_dim: int = 128,
        num_filters: int = 32,
        smi_kernel_size: int = 8,
        prot_kernel_size: int = 12,
        dropout: float = 0.1,
    ):
        super().__init__()

        # SMILES branch
        self.smi_embed = nn.Embedding(smi_vocab_size, embedding_dim, padding_idx=0)
        self.smi_conv1 = nn.Conv1d(embedding_dim, num_filters, kernel_size=smi_kernel_size)
        self.smi_conv2 = nn.Conv1d(num_filters, num_filters * 2, kernel_size=smi_kernel_size)
        self.smi_conv3 = nn.Conv1d(num_filters * 2, num_filters * 3, kernel_size=smi_kernel_size)

        # Protein sequence branch
        self.prot_embed = nn.Embedding(prot_vocab_size, embedding_dim, padding_idx=0)
        self.prot_conv1 = nn.Conv1d(embedding_dim, num_filters, kernel_size=prot_kernel_size)
        self.prot_conv2 = nn.Conv1d(num_filters, num_filters * 2, kernel_size=prot_kernel_size)
        self.prot_conv3 = nn.Conv1d(num_filters * 2, num_filters * 3, kernel_size=prot_kernel_size)

        # Fully connected layers
        combined_dim = (num_filters * 3) * 2  # 96 + 96 = 192
        self.fc1 = nn.Linear(combined_dim, 1024)
        self.dropout1 = nn.Dropout(dropout)
        self.fc2 = nn.Linear(1024, 1024)
        self.dropout2 = nn.Dropout(dropout)
        self.fc3 = nn.Linear(1024, 512)
        self.out = nn.Linear(512, 1)

        self._init_weights()

    def _init_weights(self) -> None:
        """Keras-like normal/xavier initialization."""
        for m in self.modules():
            if isinstance(m, (nn.Conv1d, nn.Linear)):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
            elif isinstance(m, nn.Embedding):
                nn.init.normal_(m.weight, mean=0.0, std=0.05)
                if m.padding_idx is not None:
                    with torch.no_grad():
                        m.weight[m.padding_idx].fill_(0)

    def forward(self, smi: torch.Tensor, prot: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        smi: (B, L_smi) int tensor
        prot: (B, L_prot) int tensor
        returns: (B,) float tensor of predicted affinities
        """
        # SMILES encoding: (B, L, E) -> (B, E, L) -> Conv1d
        x_smi = self.smi_embed(smi).transpose(1, 2)
        x_smi = F.relu(self.smi_conv1(x_smi))
        x_smi = F.relu(self.smi_conv2(x_smi))
        x_smi = F.relu(self.smi_conv3(x_smi))
        pool_smi = torch.max(x_smi, dim=-1)[0]  # Global max pool (B, 96)

        # Protein encoding: (B, L, E) -> (B, E, L) -> Conv1d
        x_prot = self.prot_embed(prot).transpose(1, 2)
        x_prot = F.relu(self.prot_conv1(x_prot))
        x_prot = F.relu(self.prot_conv2(x_prot))
        x_prot = F.relu(self.prot_conv3(x_prot))
        pool_prot = torch.max(x_prot, dim=-1)[0]  # Global max pool (B, 96)

        # Concatenate
        combined = torch.cat([pool_smi, pool_prot], dim=-1)  # (B, 192)

        # MLP
        h1 = F.relu(self.fc1(combined))
        h1 = self.dropout1(h1)
        h2 = F.relu(self.fc2(h1))
        h2 = self.dropout2(h2)
        h3 = F.relu(self.fc3(h2))
        pred = self.out(h3).squeeze(-1)  # (B,)

        return pred
