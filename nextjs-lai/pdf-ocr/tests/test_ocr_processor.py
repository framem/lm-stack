"""Unit tests for ocr_processor module."""
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch, mock_open
from ocr_processor import OCRProcessor


class TestOCRProcessor:
    """Test suite for OCR Processor."""
    
    def test_init_without_llm_vision(self):
        """Test initialization without LLM vision."""
        processor = OCRProcessor(
            tesseract_lang="eng",
            use_llm_vision=False
        )
        assert processor.tesseract_lang == "eng"
        assert processor.use_llm_vision is False
    
    def test_init_with_llm_vision(self, mock_openai_client):
        """Test initialization with LLM vision."""
        with patch('ocr_processor.openai.OpenAI', return_value=mock_openai_client):
            processor = OCRProcessor(
                tesseract_lang="deu",
                use_llm_vision=True,
                llm_api_base="http://test:1234/v1",
                llm_model="test-model",
                llm_api_key="test-key"
            )
            assert processor.use_llm_vision is True
            assert processor.llm_model == "test-model"
    
    @patch('ocr_processor.pytesseract.image_to_string')
    @patch('ocr_processor.Image.open')
    def test_extract_text_tesseract_success(self, mock_img_open, mock_tesseract):
        """Test successful Tesseract extraction."""
        mock_tesseract.return_value = "  Extracted text  "
        mock_img = MagicMock()
        mock_img_open.return_value = mock_img
        
        processor = OCRProcessor()
        result = processor.extract_text_tesseract(Path("/fake/image.png"))
        
        assert result == "Extracted text"
        mock_tesseract.assert_called_once()
    
    @patch('ocr_processor.pytesseract.image_to_string')
    @patch('ocr_processor.Image.open')
    def test_extract_text_tesseract_error(self, mock_img_open, mock_tesseract):
        """Test Tesseract error handling."""
        mock_tesseract.side_effect = Exception("Tesseract error")
        
        processor = OCRProcessor()
        result = processor.extract_text_tesseract(Path("/fake/image.png"))
        
        assert result == ""
    
    @patch('builtins.open', new_callable=mock_open, read_data=b'fake_image_data')
    def test_extract_text_llm_vision_success(self, mock_file, mock_openai_client):
        """Test successful LLM vision extraction."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "  LLM extracted text  "
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        with patch('ocr_processor.openai.OpenAI', return_value=mock_openai_client):
            processor = OCRProcessor(
                use_llm_vision=True,
                llm_api_base="http://test/v1",
                llm_model="test-model",
                llm_api_key="key"
            )
            result = processor.extract_text_llm_vision(Path("/fake/image.png"))
        
        assert result == "LLM extracted text"
    
    @patch('builtins.open', new_callable=mock_open)
    def test_extract_text_llm_vision_error(self, mock_file, mock_openai_client):
        """Test LLM vision error handling."""
        mock_openai_client.chat.completions.create.side_effect = Exception("API error")
        
        with patch('ocr_processor.openai.OpenAI', return_value=mock_openai_client):
            processor = OCRProcessor(
                use_llm_vision=True,
                llm_api_base="http://test/v1",
                llm_model="test-model",
                llm_api_key="key"
            )
            result = processor.extract_text_llm_vision(Path("/fake/image.png"))
        
        assert result == ""
    
    def test_combine_ocr_results_success(self, mock_openai_client):
        """Test successful OCR combination."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Combined result"
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        with patch('ocr_processor.openai.OpenAI', return_value=mock_openai_client):
            processor = OCRProcessor(
                use_llm_vision=True,
                llm_api_base="http://test/v1",
                llm_model="test-model",
                llm_api_key="key"
            )
            result = processor.combine_ocr_results("Tesseract text", "LLM text")
        
        assert result == "Combined result"
    
    def test_combine_ocr_results_error(self, mock_openai_client):
        """Test OCR combination error handling."""
        mock_openai_client.chat.completions.create.side_effect = Exception("Combine error")
        
        with patch('ocr_processor.openai.OpenAI', return_value=mock_openai_client):
            processor = OCRProcessor(
                use_llm_vision=True,
                llm_api_base="http://test/v1",
                llm_model="test-model",
                llm_api_key="key"
            )
            result = processor.combine_ocr_results("Short", "Longer text")
        
        # Should return longer text as fallback
        assert result == "Longer text"
    
    @patch('ocr_processor.OCRProcessor.extract_text_tesseract')
    def test_extract_text_without_llm_vision(self, mock_tesseract):
        """Test text extraction without LLM vision."""
        mock_tesseract.return_value = "Tesseract only"
        
        processor = OCRProcessor(use_llm_vision=False)
        result = processor.extract_text(Path("/fake/image.png"))
        
        assert result == "Tesseract only"
        mock_tesseract.assert_called_once()
    
    @patch('ocr_processor.OCRProcessor.combine_ocr_results')
    @patch('ocr_processor.OCRProcessor.extract_text_llm_vision')
    @patch('ocr_processor.OCRProcessor.extract_text_tesseract')
    def test_extract_text_with_llm_combination(
        self, mock_tesseract, mock_llm, mock_combine, mock_openai_client
    ):
        """Test text extraction with LLM combination."""
        mock_tesseract.return_value = "Tesseract result"
        mock_llm.return_value = "LLM result"
        mock_combine.return_value = "Combined result"
        
        with patch('ocr_processor.openai.OpenAI', return_value=mock_openai_client):
            processor = OCRProcessor(
                use_llm_vision=True,
                llm_api_base="http://test/v1",
                llm_model="test-model",
                llm_api_key="key"
            )
            result = processor.extract_text(Path("/fake/image.png"))
        
        assert result == "Combined result"
        mock_combine.assert_called_once_with("Tesseract result", "LLM result")
    
    @patch('ocr_processor.OCRProcessor.extract_text_llm_vision')
    @patch('ocr_processor.OCRProcessor.extract_text_tesseract')
    def test_extract_text_llm_failed_fallback(
        self, mock_tesseract, mock_llm, mock_openai_client
    ):
        """Test fallback to Tesseract when LLM fails."""
        mock_tesseract.return_value = "Tesseract result"
        mock_llm.return_value = ""  # LLM failed
        
        with patch('ocr_processor.openai.OpenAI', return_value=mock_openai_client):
            processor = OCRProcessor(
                use_llm_vision=True,
                llm_api_base="http://test/v1",
                llm_model="test-model",
                llm_api_key="key"
            )
            result = processor.extract_text(Path("/fake/image.png"))
        
        assert result == "Tesseract result"
    
    @patch('ocr_processor.OCRProcessor.extract_text')
    def test_process_images(self, mock_extract):
        """Test processing multiple images."""
        mock_extract.side_effect = ["Text 1", "Text 2", "Text 3"]
        
        processor = OCRProcessor()
        paths = [Path(f"/fake/img{i}.png") for i in range(3)]
        results = processor.process_images(paths)
        
        assert len(results) == 3
        assert results == ["Text 1", "Text 2", "Text 3"]
        assert mock_extract.call_count == 3
