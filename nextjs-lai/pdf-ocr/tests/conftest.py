"""Pytest configuration and fixtures."""
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, Mock
import pytest
from PIL import Image
import io


@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sample_image(temp_dir):
    """Create a sample test image."""
    img_path = temp_dir / "test_image.png"
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='white')
    img.save(img_path)
    return img_path


@pytest.fixture
def sample_pdf_path(temp_dir):
    """Create a sample PDF path (not actual PDF, just path for testing)."""
    pdf_path = temp_dir / "test.pdf"
    pdf_path.touch()
    return pdf_path


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Mocked LLM response"
    mock_client.chat.completions.create.return_value = mock_response
    return mock_client


@pytest.fixture
def mock_config(temp_dir, monkeypatch):
    """Mock config module with test paths."""
    import config
    
    # Mock directories
    monkeypatch.setattr(config, 'PROJECT_DIR', temp_dir)
    monkeypatch.setattr(config, 'PDF_DIR', temp_dir / 'pdf-input')
    monkeypatch.setattr(config, 'OUTPUT_DIR', temp_dir / 'output')
    monkeypatch.setattr(config, 'TEMP_DIR', temp_dir / 'temp')
    
    # Create directories
    config.PDF_DIR.mkdir(exist_ok=True)
    config.OUTPUT_DIR.mkdir(exist_ok=True)
    config.TEMP_DIR.mkdir(exist_ok=True)
    
    return config


@pytest.fixture
def sample_text():
    """Sample text for testing."""
    return """Dies ist ein Beispieltext.
    
Er enthält mehrere Absätze.

Und auch einige Formatierungen.
- Liste 1
- Liste 2

Zahlen: 123, 456
"""


@pytest.fixture
def mock_tesseract_result():
    """Mock Tesseract OCR result."""
    return "Tesseräct OCR Ergebnis mit einigen Feh1ern"


@pytest.fixture
def mock_llm_vision_result():
    """Mock LLM Vision result."""
    return "Tesseract OCR Ergebnis mit einigen Fehlern"
