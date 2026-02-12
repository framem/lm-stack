# Inference modules

import torch


def get_device():
    """Detect the best available device (CUDA GPU or CPU)."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def device_info_string(device):
    """Return a human-readable device description."""
    if device.type == "cuda":
        name = torch.cuda.get_device_name(device)
        return f"GPU ({name})"
    return "CPU"


def print_device_info(device):
    """Print device info for CLI inference scripts."""
    info = device_info_string(device)
    print(f"   Device: {info}")
