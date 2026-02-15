"""Unit tests for text_cleanup module."""
import pytest
from unittest.mock import MagicMock, patch
from text_cleanup import TextCleanup


class TestTextCleanup:
    """Test suite for Text Cleanup."""
    
    def test_init_without_llm(self):
        """Test initialization without LLM."""
        cleanup = TextCleanup(
            use_llm=False,
            min_text_length=5
        )
        assert cleanup.use_llm is False
        assert cleanup.min_text_length == 5
    
    def test_init_with_llm(self, mock_openai_client):
        """Test initialization with LLM."""
        with patch('text_cleanup.openai.OpenAI', return_value=mock_openai_client):
            cleanup = TextCleanup(
                use_llm=True,
                llm_api_base="http://test/v1",
                llm_model="test-model",
                llm_api_key="key"
            )
            assert cleanup.use_llm is True
    
    def test_remove_scattered_text_short_lines(self):
        """Test removal of short scattered lines."""
        cleanup = TextCleanup(use_llm=False, min_text_length=5)
        text = "ab\nThis is good content\nxy\nAnother good line\ny z"
        
        result = cleanup.remove_scattered_text(text)
        
        assert "This is good content" in result
        assert "Another good line" in result
        assert "ab\n" not in result
        assert "\nxy\n" not in result
    
    def test_remove_scattered_text_single_chars(self):
        """Test removal of lines with mostly single characters."""
        cleanup = TextCleanup(use_llm=False)
        text = "a b c d e f g h\nThis is a proper sentence\ni j k l m n"
        
        result = cleanup.remove_scattered_text(text)
        
        assert "This is a proper sentence" in result
        assert "a b c d" not in result
    
    def test_remove_scattered_text_special_chars(self):
        """Test removal of lines with too many special characters."""
        cleanup = TextCleanup(use_llm=False)
        text = "Normal text\n###@@@%%%&&&\nMore normal text"
        
        result = cleanup.remove_scattered_text(text)
        
        assert "Normal text" in result
        assert "More normal text" in result
        assert "###@@@" not in result
    
    def test_basic_cleanup_pipe_replacement(self):
        """Test replacement of pipe characters."""
        cleanup = TextCleanup(use_llm=False)
        text = "He||o wor|d"
        
        result = cleanup.basic_cleanup(text)
        
        assert "IIIo worId" in result or "Hello world" in result.replace("I", "l")
    
    def test_basic_cleanup_multiple_spaces(self):
        """Test removal of multiple spaces."""
        cleanup = TextCleanup(use_llm=False)
        text = "Too    many     spaces"
        
        result = cleanup.basic_cleanup(text)
        
        assert "  " not in result
        assert "Too many spaces" in result
    
    def test_basic_cleanup_multiple_newlines(self):
        """Test normalization of multiple newlines."""
        cleanup = TextCleanup(use_llm=False)
        text = "Line 1\n\n\n\n\nLine 2"
        
        result = cleanup.basic_cleanup(text)
        
        assert "\n\n\n" not in result
        assert "Line 1" in result
        assert "Line 2" in result
    
    def test_basic_cleanup_strips_whitespace(self):
        """Test stripping of leading/trailing whitespace."""
        cleanup = TextCleanup(use_llm=False)
        text = "   \n  Text with spaces  \n  "
        
        result = cleanup.basic_cleanup(text)
        
        assert result == result.strip()
    
    @patch('text_cleanup.openai.OpenAI')
    def test_cleanup_with_llm_success(self, mock_openai_class, mock_openai_client):
        """Test LLM cleanup success."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Cleaned text"
        mock_openai_client.chat.completions.create.return_value = mock_response
        mock_openai_class.return_value = mock_openai_client
        
        cleanup = TextCleanup(
            use_llm=True,
            llm_api_base="http://test/v1",
            llm_model="test-model",
            llm_api_key="key"
        )
        result = cleanup.cleanup_with_llm("Dirty text", "context")
        
        assert result == "Cleaned text"
    
    @patch('text_cleanup.openai.OpenAI')
    def test_cleanup_with_llm_error(self, mock_openai_class, mock_openai_client):
        """Test LLM cleanup error handling."""
        mock_openai_client.chat.completions.create.side_effect = Exception("API error")
        mock_openai_class.return_value = mock_openai_client
        
        cleanup = TextCleanup(
            use_llm=True,
            llm_api_base="http://test/v1",
            llm_model="test-model",
            llm_api_key="key"
        )
        result = cleanup.cleanup_with_llm("Original text", "context")
        
        # Should return original text on error
        assert result == "Original text"
    
    def test_cleanup_with_llm_empty_text(self, mock_openai_client):
        """Test LLM cleanup with empty text."""
        with patch('text_cleanup.openai.OpenAI', return_value=mock_openai_client):
            cleanup = TextCleanup(
                use_llm=True,
                llm_api_base="http://test/v1",
                llm_model="test",
                llm_api_key="key"
            )
            result = cleanup.cleanup_with_llm("", "context")
        
        assert result == ""
    
    @patch('text_cleanup.openai.OpenAI')
    def test_process_text_with_llm(self, mock_openai_class, mock_openai_client):
        """Test full text processing with LLM."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "LLM cleaned"
        mock_openai_client.chat.completions.create.return_value = mock_response
        mock_openai_class.return_value = mock_openai_client
        
        cleanup = TextCleanup(
            use_llm=True,
            llm_api_base="http://test/v1",
            llm_model="test",
            llm_api_key="key"
        )
        result = cleanup.process_text("Input text with enough length for LLM processing", "context", 1)
        
        assert result == "LLM cleaned"
    
    @patch('text_cleanup.TextCleanup.basic_cleanup')
    def test_process_text_without_llm(self, mock_basic):
        """Test text processing without LLM."""
        mock_basic.return_value = "Basic cleaned"
        
        cleanup = TextCleanup(use_llm=False)
        result = cleanup.process_text("Input text", "context", 1)
        
        assert result == "Basic cleaned"
        mock_basic.assert_called_once()
    
    def test_process_text_empty_input(self):
        """Test processing empty text."""
        cleanup = TextCleanup(use_llm=False)
        result = cleanup.process_text("", "context")
        
        assert result == ""
    
    def test_process_text_short_text_no_llm(self, mock_openai_client):
        """Test that very short text skips LLM."""
        with patch('text_cleanup.openai.OpenAI', return_value=mock_openai_client):
            cleanup = TextCleanup(
                use_llm=True,
                llm_api_base="http://test/v1",
                llm_model="test",
                llm_api_key="key"
            )
            result = cleanup.process_text("Short", "context")
        
        # Should be processed with basic cleanup only
        assert isinstance(result, str)
        assert len(result) > 0
    
    def test_merge_page_texts(self):
        """Test merging multiple page texts."""
        cleanup = TextCleanup(use_llm=False)
        pages = ["Page 1 text", "Page 2 text", "Page 3 text"]
        
        result = cleanup.merge_page_texts(pages)
        
        assert "Page 1 text" in result
        assert "Page 2 text" in result
        assert "Page 3 text" in result
        assert "---" in result  # Separator
    
    def test_merge_page_texts_empty_pages(self):
        """Test merging with empty pages."""
        cleanup = TextCleanup(use_llm=False)
        pages = ["Page 1", "", "  ", "Page 2"]
        
        result = cleanup.merge_page_texts(pages)
        
        assert "Page 1" in result
        assert "Page 2" in result
    
    def test_merge_page_texts_all_empty(self):
        """Test merging all empty pages."""
        cleanup = TextCleanup(use_llm=False)
        pages = ["", "  ", "\n"]
        
        result = cleanup.merge_page_texts(pages)
        
        assert result == ""
    
    def test_merge_page_texts_single_page(self):
        """Test merging single page."""
        cleanup = TextCleanup(use_llm=False)
        pages = ["Only page"]
        
        result = cleanup.merge_page_texts(pages)
        
        assert result == "Only page"
