"""
Shared training configuration for all models.

This ensures consistent hyperparameters across LSTM and Transformer training.
"""

# Training parameters
EPOCHS = 500
LOG_INTERVAL = 50  # Log every N epochs

# Learning rates
LEARNING_RATE_LSTM = 0.01
LEARNING_RATE_TRANSFORMER = 0.005

# Batch sizes
BATCH_SIZE_LSTM = 4
BATCH_SIZE_TRANSFORMER = 8

# Sequence length
SEQ_LENGTH = 4

# Random seed for reproducibility
RANDOM_SEED = 42
