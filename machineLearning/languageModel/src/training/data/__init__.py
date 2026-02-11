"""
Training data subpackage.

Provides all dataset constants used by the language model training scripts.
Each dataset is defined in its own module for maintainability.
"""

from .training_data_s import TRAINING_DATA
from .finetuning_data import FINETUNING_DATA
from .fact_correction_data import FACT_CORRECTION_DATA
from .knowledge_correction_data import KNOWLEDGE_CORRECTION_DATA
from .training_data_m import TRAINING_DATA_M
from .training_data_l import TRAINING_DATA_L

__all__ = [
    "TRAINING_DATA",
    "FINETUNING_DATA",
    "FACT_CORRECTION_DATA",
    "KNOWLEDGE_CORRECTION_DATA",
    "TRAINING_DATA_M",
    "TRAINING_DATA_L",
]
