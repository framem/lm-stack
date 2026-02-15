"""Unit tests for pdf_extractor module."""
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch, mock_open
from pdf_extractor import PDFExtractor


class TestPDFExtractor:
    """Test suite for PDF Extractor."""
    
    def test_init(self):
        """Test PDFExtractor initialization."""
        extractor = PDFExtractor(dpi=200)
        assert extractor.dpi == 200
    
    def test_init_default_dpi(self):
        """Test default DPI value."""
        extractor = PDFExtractor()
        assert extractor.dpi == 300
    
    @patch('pdf_extractor.PyPDF2.PdfReader')
    @patch('builtins.open', new_callable=mock_open)
    def test_extract_text_success(self, mock_file, mock_pdf_reader):
        """Test successful text extraction from PDF."""
        # Setup mock
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Sample text from page"
        
        mock_reader_instance = MagicMock()
        mock_reader_instance.pages = [mock_page, mock_page]
        mock_pdf_reader.return_value = mock_reader_instance
        
        # Test
        extractor = PDFExtractor()
        pdf_path = Path("/fake/path.pdf")
        result = extractor.extract_text(pdf_path)
        
        assert len(result) == 2
        assert result[0]['page'] == 1
        assert result[0]['text'] == "Sample text from page"
        assert result[0]['has_text'] is True
    
    @patch('pdf_extractor.PyPDF2.PdfReader')
    @patch('builtins.open', new_callable=mock_open)
    def test_extract_text_empty_page(self, mock_file, mock_pdf_reader):
        """Test extraction from page with no text."""
        mock_page = MagicMock()
        mock_page.extract_text.return_value = ""
        
        mock_reader_instance = MagicMock()
        mock_reader_instance.pages = [mock_page]
        mock_pdf_reader.return_value = mock_reader_instance
        
        extractor = PDFExtractor()
        result = extractor.extract_text(Path("/fake/path.pdf"))
        
        assert len(result) == 1
        assert result[0]['text'] == ''
        assert result[0]['has_text'] is False
    
    @patch('pdf_extractor.PyPDF2.PdfReader')
    @patch('builtins.open', new_callable=mock_open)
    def test_extract_text_error(self, mock_file, mock_pdf_reader):
        """Test error handling in text extraction."""
        mock_pdf_reader.side_effect = Exception("PDF read error")
        
        extractor = PDFExtractor()
        result = extractor.extract_text(Path("/fake/path.pdf"))
        
        assert result == []
    
    def test_needs_ocr_short_text(self):
        """Test OCR needed for short text."""
        extractor = PDFExtractor()
        page_data = {'text': 'Short', 'has_text': True}
        
        assert extractor.needs_ocr(page_data) is True
    
    def test_needs_ocr_long_text(self):
        """Test OCR not needed for sufficient text."""
        extractor = PDFExtractor()
        page_data = {
            'text': 'This is a long enough text that should not need OCR processing',
            'has_text': True
        }
        
        assert extractor.needs_ocr(page_data) is False
    
    def test_needs_ocr_no_text(self):
        """Test OCR needed when no text."""
        extractor = PDFExtractor()
        page_data = {'text': '', 'has_text': False}
        
        assert extractor.needs_ocr(page_data) is True
    
    @patch('pdf_extractor.convert_from_path')
    def test_convert_to_images(self, mock_convert, temp_dir):
        """Test PDF to image conversion."""
        # Mock PIL Image
        mock_image = MagicMock()
        mock_convert.return_value = [mock_image, mock_image]
        
        extractor = PDFExtractor(dpi=200)
        pdf_path = temp_dir / "test.pdf"
        pdf_path.touch()
        
        result = extractor.convert_to_images(pdf_path, temp_dir)
        
        assert len(result) == 2
        mock_convert.assert_called_once_with(
            pdf_path,
            dpi=200,
            output_folder=temp_dir,
            fmt='png'
        )
    
    @patch('pdf_extractor.convert_from_path')
    def test_convert_to_images_error(self, mock_convert, temp_dir):
        """Test error handling in image conversion."""
        mock_convert.side_effect = Exception("Conversion error")
        
        extractor = PDFExtractor()
        pdf_path = temp_dir / "test.pdf"
        pdf_path.touch()
        
        result = extractor.convert_to_images(pdf_path, temp_dir)
        
        assert result == []
