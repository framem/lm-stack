"""Unit tests for main module."""
import pytest
import signal
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, call
from main import (
    PDF2MarkdownConverter,
    cleanup_temp_dir,
    signal_handler,
    parse_arguments,
    main
)


class TestCleanupFunctions:
    """Test cleanup utility functions."""
    
    @patch('main.shutil.rmtree')
    @patch('main.config')
    def test_cleanup_temp_dir_exists(self, mock_config, mock_rmtree):
        """Test cleanup when temp dir exists."""
        temp_dir = MagicMock()
        temp_dir.exists.return_value = True
        mock_config.TEMP_DIR = temp_dir
        
        cleanup_temp_dir()
        
        mock_rmtree.assert_called_once_with(temp_dir)
    
    @patch('main.shutil.rmtree')
    @patch('main.config')
    def test_cleanup_temp_dir_not_exists(self, mock_config, mock_rmtree):
        """Test cleanup when temp dir doesn't exist."""
        temp_dir = MagicMock()
        temp_dir.exists.return_value = False
        mock_config.TEMP_DIR = temp_dir
        
        cleanup_temp_dir()
        
        mock_rmtree.assert_not_called()
    
    @patch('main.shutil.rmtree')
    @patch('main.config')
    def test_cleanup_temp_dir_error(self, mock_config, mock_rmtree):
        """Test cleanup error handling."""
        temp_dir = MagicMock()
        temp_dir.exists.return_value = True
        mock_config.TEMP_DIR = temp_dir
        mock_rmtree.side_effect = Exception("Cleanup error")
        
        # Should not raise exception
        cleanup_temp_dir()
    
    @patch('main.sys.exit')
    @patch('main.cleanup_temp_dir')
    def test_signal_handler(self, mock_cleanup, mock_exit):
        """Test signal handler."""
        signal_handler(signal.SIGINT, None)
        
        mock_cleanup.assert_called_once()
        mock_exit.assert_called_once_with(0)


class TestPDF2MarkdownConverter:
    """Test suite for PDF2MarkdownConverter."""
    
    @patch('main.TextCleanup')
    @patch('main.OCRProcessor')
    @patch('main.PDFExtractor')
    def test_init_default(self, mock_extractor, mock_ocr, mock_cleanup):
        """Test converter initialization with defaults."""
        converter = PDF2MarkdownConverter()
        
        assert converter.max_pages is None
        mock_extractor.assert_called_once()
        mock_ocr.assert_called_once()
        mock_cleanup.assert_called_once()
    
    @patch('main.TextCleanup')
    @patch('main.OCRProcessor')
    @patch('main.PDFExtractor')
    def test_init_with_max_pages(self, mock_extractor, mock_ocr, mock_cleanup):
        """Test converter initialization with max pages."""
        converter = PDF2MarkdownConverter(max_pages=5)
        
        assert converter.max_pages == 5
    
    def test_create_markdown(self):
        """Test markdown creation."""
        with patch('main.TextCleanup'), \
             patch('main.OCRProcessor'), \
             patch('main.PDFExtractor'):
            converter = PDF2MarkdownConverter()
            result = converter.create_markdown("Test Title", "Test content")
        
        assert "# Test Title" in result
        assert "Test content" in result
    
    def test_save_markdown(self, temp_dir):
        """Test saving markdown to file."""
        output_path = temp_dir / "output.md"
        
        with patch('main.TextCleanup'), \
             patch('main.OCRProcessor'), \
             patch('main.PDFExtractor'):
            converter = PDF2MarkdownConverter()
            converter.save_markdown("# Content", output_path)
        
        assert output_path.exists()
        assert output_path.read_text() == "# Content"
    
    @patch('main.PDF2MarkdownConverter.process_pdf')
    @patch('main.config')
    def test_convert_pdfs_from_directory(self, mock_config, mock_process):
        """Test converting PDFs from directory."""
        mock_pdf1 = MagicMock(spec=Path)
        mock_pdf1.stem = "doc1"
        mock_pdf2 = MagicMock(spec=Path)
        mock_pdf2.stem = "doc2"
        
        mock_config.PDF_DIR.glob.return_value = [mock_pdf1, mock_pdf2]
        mock_config.OUTPUT_DIR = Path("/fake/output")
        mock_process.return_value = "# Markdown"
        
        with patch('main.TextCleanup'), \
             patch('main.OCRProcessor'), \
             patch('main.PDFExtractor'):
            converter = PDF2MarkdownConverter()
            with patch.object(converter, 'save_markdown'):
                converter.convert_pdfs()
        
        assert mock_process.call_count == 2
    
    @patch('main.config')
    def test_convert_pdfs_no_files_found(self, mock_config):
        """Test converting when no PDFs found."""
        mock_config.PDF_DIR.glob.return_value = []
        
        with patch('main.TextCleanup'), \
             patch('main.OCRProcessor'), \
             patch('main.PDFExtractor'):
            converter = PDF2MarkdownConverter()
            converter.convert_pdfs()
        
        # Should handle gracefully without raising
    
    @patch('main.PDF2MarkdownConverter.process_pdf')
    def test_convert_pdfs_from_file_list(self, mock_process, temp_dir):
        """Test converting specific PDF files."""
        pdf1 = temp_dir / "test1.pdf"
        pdf2 = temp_dir / "test2.pdf"
        pdf1.touch()
        pdf2.touch()
        
        mock_process.return_value = "# Markdown"
        
        with patch('main.TextCleanup'), \
             patch('main.OCRProcessor'), \
             patch('main.PDFExtractor'), \
             patch('main.config'):
            converter = PDF2MarkdownConverter()
            with patch.object(converter, 'save_markdown'):
                converter.convert_pdfs(pdf_paths=[pdf1, pdf2])
        
        assert mock_process.call_count == 2
    
    def test_convert_pdfs_invalid_files(self, temp_dir):
        """Test converting with invalid file paths."""
        fake_pdf = temp_dir / "nonexistent.pdf"
        
        with patch('main.TextCleanup'), \
             patch('main.OCRProcessor'), \
             patch('main.PDFExtractor'):
            converter = PDF2MarkdownConverter()
            converter.convert_pdfs(pdf_paths=[fake_pdf])
        
        # Should handle gracefully
    
    @patch('main.shutil.rmtree')
    @patch('main.PDF2MarkdownConverter.create_markdown')
    @patch('main.TextCleanup')
    @patch('main.OCRProcessor')
    @patch('main.PDFExtractor')
    @patch('main.config')
    def test_process_pdf_with_ocr(
        self, mock_config, mock_extractor_class, mock_ocr_class,
        mock_cleanup_class, mock_create_md, mock_rmtree, temp_dir
    ):
        """Test processing PDF that needs OCR."""
        # Setup mocks
        mock_config.TEMP_DIR = temp_dir / "temp"
        mock_config.DPI = 300
        
        mock_extractor = MagicMock()
        mock_extractor_class.return_value = mock_extractor
        mock_extractor.extract_text.return_value = [
            {'page': 1, 'text': 'Short', 'has_text': True}
        ]
        mock_extractor.needs_ocr.return_value = True
        
        mock_ocr = MagicMock()
        mock_ocr_class.return_value = mock_ocr
        mock_ocr.extract_text.return_value = "OCR extracted text"
        
        mock_cleanup = MagicMock()
        mock_cleanup_class.return_value = mock_cleanup
        mock_cleanup.process_text.return_value = "Cleaned text"
        mock_cleanup.merge_page_texts.return_value = "Final text"
        
        mock_create_md.return_value = "# Markdown"
        
        # Test
        with patch('pdf2image.convert_from_path') as mock_convert:
            mock_img = MagicMock()
            mock_convert.return_value = [mock_img]
            
            converter = PDF2MarkdownConverter()
            pdf_path = temp_dir / "test.pdf"
            pdf_path.touch()
            result = converter.process_pdf(pdf_path)
        
        assert result == "# Markdown"
        mock_ocr.extract_text.assert_called_once()


class TestParseArguments:
    """Test argument parsing."""
    
    def test_parse_arguments_defaults(self):
        """Test default arguments."""
        with patch('sys.argv', ['main.py']):
            args = parse_arguments()
        
        assert args.files is None
        assert args.test is False
        assert args.max_pages is None
    
    def test_parse_arguments_test_mode(self):
        """Test test mode argument."""
        with patch('sys.argv', ['main.py', '--test']):
            args = parse_arguments()
        
        assert args.test is True
    
    def test_parse_arguments_files(self):
        """Test files argument."""
        with patch('sys.argv', ['main.py', '--files', 'file1.pdf', 'file2.pdf']):
            args = parse_arguments()
        
        assert args.files == ['file1.pdf', 'file2.pdf']
    
    def test_parse_arguments_max_pages(self):
        """Test max pages argument."""
        with patch('sys.argv', ['main.py', '--max-pages', '10']):
            args = parse_arguments()
        
        assert args.max_pages == 10


class TestMain:
    """Test main function."""
    
    @patch('main.PDF2MarkdownConverter')
    @patch('main.parse_arguments')
    @patch('main.config')
    def test_main_default_mode(self, mock_config, mock_parse, mock_converter_class):
        """Test main function in default mode."""
        mock_args = MagicMock()
        mock_args.test = False
        mock_args.max_pages = None
        mock_args.files = None
        mock_parse.return_value = mock_args
        
        mock_converter = MagicMock()
        mock_converter_class.return_value = mock_converter
        mock_config.PDF_DIR = Path("/fake/pdf")
        mock_config.OUTPUT_DIR = Path("/fake/output")
        
        main()
        
        mock_converter_class.assert_called_once_with(max_pages=None)
        mock_converter.convert_pdfs.assert_called_once()
    
    @patch('main.PDF2MarkdownConverter')
    @patch('main.parse_arguments')
    @patch('main.config')
    def test_main_test_mode(self, mock_config, mock_parse, mock_converter_class):
        """Test main function in test mode."""
        mock_args = MagicMock()
        mock_args.test = True
        mock_args.max_pages = None
        mock_args.files = None
        mock_parse.return_value = mock_args
        
        mock_converter = MagicMock()
        mock_converter_class.return_value = mock_converter
        mock_config.PDF_DIR = Path("/fake/pdf")
        mock_config.OUTPUT_DIR = Path("/fake/output")
        
        main()
        
        mock_converter_class.assert_called_once_with(max_pages=2)
    
    @patch('main.PDF2MarkdownConverter')
    @patch('main.parse_arguments')
    @patch('main.config')
    @patch('main.Path')
    def test_main_with_files(self, mock_path, mock_config, mock_parse, mock_converter_class):
        """Test main function with specific files."""
        mock_args = MagicMock()
        mock_args.test = False
        mock_args.max_pages = None
        mock_args.files = ['file1.pdf']
        mock_parse.return_value = mock_args
        
        mock_file_path = MagicMock(spec=Path)
        mock_file_path.exists.return_value = True
        mock_path.return_value.resolve.return_value = mock_file_path
        
        mock_converter = MagicMock()
        mock_converter_class.return_value = mock_converter
        mock_config.OUTPUT_DIR = Path("/fake/output")
        
        main()
        
        mock_converter.convert_pdfs.assert_called_once()
