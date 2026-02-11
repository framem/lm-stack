"""
Backwards-compatible re-export of all training datasets.

The actual data now lives in the ``data/`` subpackage (one file per dataset).
This module re-exports every public name so that existing imports like
``from .training_data import TRAINING_DATA`` continue to work unchanged.
"""

from .data import (
    TRAINING_DATA,
    FINETUNING_DATA,
    FACT_CORRECTION_DATA,
    KNOWLEDGE_CORRECTION_DATA,
    TRAINING_DATA_M,
    TRAINING_DATA_L,
)

__all__ = [
    "TRAINING_DATA",
    "FINETUNING_DATA",
    "FACT_CORRECTION_DATA",
    "KNOWLEDGE_CORRECTION_DATA",
    "TRAINING_DATA_M",
    "TRAINING_DATA_L",
]
