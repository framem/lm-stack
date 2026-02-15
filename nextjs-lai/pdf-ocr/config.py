"""Configuration settings for PDF to Markdown converter."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Directories
PROJECT_DIR = Path(__file__).parent
PDF_DIR = PROJECT_DIR / "pdf-input"
OUTPUT_DIR = PROJECT_DIR / "output"
TEMP_DIR = PROJECT_DIR / "temp"

# Create directories if they don't exist
OUTPUT_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# LLM API Configuration
LLM_API_BASE = os.getenv("LLM_API_BASE", "http://localhost:1234/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "google/gemma-3-12b")
LLM_API_KEY = os.getenv("LLM_API_KEY", "not-needed")

# OCR Configuration
TESSERACT_LANG = "deu"  # German language for OCR
MIN_TEXT_LENGTH = 3  # Minimum text length to keep
MIN_CONFIDENCE = 30  # Minimum OCR confidence score

# Processing Configuration
DPI = 300  # DPI for PDF to image conversion
USE_LLM_VISION = True  # Use 3-stage OCR: Tesseract + LLM Vision + LLM Combination
USE_LLM_CLEANUP = True  # Use LLM for post-processing cleanup
