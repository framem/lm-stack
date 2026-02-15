"""Unit tests for config module."""
import os
from pathlib import Path
import pytest


def test_project_dir_exists():
    """Test that PROJECT_DIR is set correctly."""
    import config
    assert config.PROJECT_DIR.exists()
    assert config.PROJECT_DIR.is_dir()


def test_directories_created(mock_config):
    """Test that output and temp directories are created."""
    assert mock_config.OUTPUT_DIR.exists()
    assert mock_config.TEMP_DIR.exists()


def test_llm_config_defaults():
    """Test that LLM config has sensible defaults."""
    import config
    assert config.LLM_API_BASE is not None
    assert config.LLM_MODEL is not None
    assert config.LLM_API_KEY is not None


def test_ocr_config_values():
    """Test OCR configuration values."""
    import config
    assert config.TESSERACT_LANG == "deu"
    assert config.MIN_TEXT_LENGTH >= 0
    assert config.MIN_CONFIDENCE >= 0


def test_processing_config():
    """Test processing configuration."""
    import config
    assert config.DPI > 0
    assert isinstance(config.USE_LLM_VISION, bool)
    assert isinstance(config.USE_LLM_CLEANUP, bool)


def test_env_override(monkeypatch, temp_dir):
    """Test that environment variables override defaults."""
    monkeypatch.setenv("LLM_API_BASE", "http://test:9999/v1")
    monkeypatch.setenv("LLM_MODEL", "test-model")
    
    # Reload config module
    import importlib
    import config as conf
    importlib.reload(conf)
    
    assert "test:9999" in conf.LLM_API_BASE
    assert conf.LLM_MODEL == "test-model"
