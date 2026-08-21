"""
NakharaX Protocol — Decentralized Weight Merging Engine (TIES & DARE)

Implements cutting-edge continual learning algorithms for combining specialized
domain LoRA adapters into unified base models without catastrophic forgetting.

Algorithms:
1. TIES-Merging: Trimming small deltas, Electing disjoint signs, Scaling & Merging.
2. DARE: Drop And REscale random sparsification for high-capacity adapter fusion.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple
import torch

logger = logging.getLogger(__name__)


class LoRAWeightMerger:
    """
    Decentralized Continual Learning Tensor Merger.
    Merges delta parameter matrices from distributed workers.
    """

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or (torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu"))
        logger.info("LoRAWeightMerger initialized on device: %s", self.device)

    def ties_merge(
        self,
        base_weights: Dict[str, torch.Tensor],
        adapters: List[Dict[str, torch.Tensor]],
        weights: Optional[List[float]] = None,
        density: float = 0.2,
    ) -> Dict[str, torch.Tensor]:
        """
        TIES Merging (Trimming, Electing Sign, Disjoint Averaging).
        
        Args:
            base_weights: Dict of base model parameters.
            adapters: List of adapter delta state dicts (diff from base).
            weights: Interpolation scaling factors per adapter (default: uniform).
            density: Fraction of top-magnitude parameters to retain (e.g. 0.2 = keep top 20%).
        
        Returns:
            Merged model state dict.
        """
        num_adapters = len(adapters)
        if num_adapters == 0:
            return base_weights
        if weights is None:
            weights = [1.0 / num_adapters] * num_adapters

        merged = {}
        with torch.no_grad():
            for key in base_weights.keys():
                base_tensor = base_weights[key].to(self.device)
                
                # Check if all adapters contain this key
                deltas = []
                for i, adapter in enumerate(adapters):
                    if key in adapter:
                        delta = (adapter[key].to(self.device) - base_tensor) * weights[i]
                        # 1. Trimming: keep top-k magnitude values
                        trimmed = self._trim_topk(delta, density)
                        deltas.append(trimmed)

                if not deltas:
                    merged[key] = base_tensor.cpu()
                    continue

                # Stack deltas [K, ...]
                stacked = torch.stack(deltas, dim=0)

                # 2. Elect Sign: Majority sign across adapters
                signs = torch.sign(stacked)
                majority_sign = torch.sign(signs.sum(dim=0))
                majority_sign[majority_sign == 0] = 1.0

                # 3. Disjoint Merging: Zero out values that disagree with majority sign
                disjoint_mask = (signs == majority_sign.unsqueeze(0)).float()
                disjoint_deltas = stacked * disjoint_mask

                # 4. Average and Apply
                counts = disjoint_mask.sum(dim=0).clamp(min=1.0)
                final_delta = disjoint_deltas.sum(dim=0) / counts

                merged[key] = (base_tensor + final_delta).cpu()

        logger.info("TIES merge completed for %d parameter tensors.", len(merged))
        return merged

    def dare_merge(
        self,
        base_weights: Dict[str, torch.Tensor],
        adapters: List[Dict[str, torch.Tensor]],
        weights: Optional[List[float]] = None,
        drop_rate: float = 0.5,
    ) -> Dict[str, torch.Tensor]:
        """
        DARE Merging (Drop And REscale).
        Randomly drops parameter deltas with Bernoulli mask and rescales by 1/(1-p).
        """
        num_adapters = len(adapters)
        if num_adapters == 0:
            return base_weights
        if weights is None:
            weights = [1.0 / num_adapters] * num_adapters

        scale = 1.0 / (1.0 - drop_rate)
        merged = {}
        with torch.no_grad():
            for key in base_weights.keys():
                base_tensor = base_weights[key].to(self.device)
                combined_delta = torch.zeros_like(base_tensor)

                for i, adapter in enumerate(adapters):
                    if key in adapter:
                        delta = adapter[key].to(self.device) - base_tensor
                        mask = (torch.rand_like(delta) > drop_rate).float()
                        combined_delta += (delta * mask * scale) * weights[i]

                merged[key] = (base_tensor + combined_delta).cpu()

        logger.info("DARE merge completed for %d parameter tensors.", len(merged))
        return merged

    @staticmethod
    def _trim_topk(tensor: torch.Tensor, density: float) -> torch.Tensor:
        """Keep top-k magnitude values and zero out the rest."""
        if density >= 1.0:
            return tensor
        k = max(1, int(tensor.numel() * density))
        flat = tensor.abs().flatten()
        threshold = torch.kthvalue(flat, flat.numel() - k + 1).values
        mask = tensor.abs() >= threshold
        return tensor * mask.float()


def ties_merging(
    base_weights: Dict[str, torch.Tensor],
    adapters: List[Dict[str, torch.Tensor]],
    weights: Optional[List[float]] = None,
    density: float = 0.2,
) -> Dict[str, torch.Tensor]:
    """Top-level functional interface for TIES parameter merging."""
    merger = LoRAWeightMerger()
    return merger.ties_merge(base_weights, adapters, weights, density)


def dare_merging(
    base_weights: Dict[str, torch.Tensor],
    adapters: List[Dict[str, torch.Tensor]],
    weights: Optional[List[float]] = None,
    drop_rate: float = 0.5,
) -> Dict[str, torch.Tensor]:
    """Top-level functional interface for DARE parameter merging."""
    merger = LoRAWeightMerger()
    return merger.dare_merge(base_weights, adapters, weights, drop_rate)

