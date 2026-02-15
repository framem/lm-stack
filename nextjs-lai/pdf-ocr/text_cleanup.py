"""Text cleanup and spell checking module using LLM."""
import logging
import re
from typing import List
import openai
from spellchecker import SpellChecker

logger = logging.getLogger(__name__)


class TextCleanup:
    """Clean up and validate OCR text using LLM and spell checking."""
    
    def __init__(
        self,
        use_llm: bool = True,
        llm_api_base: str = None,
        llm_model: str = None,
        llm_api_key: str = None,
        min_text_length: int = 3
    ):
        """Initialize text cleanup.
        
        Args:
            use_llm: Whether to use LLM for cleanup
            llm_api_base: LLM API base URL
            llm_model: LLM model name
            llm_api_key: LLM API key
            min_text_length: Minimum text length to keep
        """
        self.use_llm = use_llm
        self.min_text_length = min_text_length
        self.spell_checker = SpellChecker(language='de')
        
        if use_llm:
            self.llm_client = openai.OpenAI(
                base_url=llm_api_base,
                api_key=llm_api_key
            )
            self.llm_model = llm_model
    
    def remove_scattered_text(self, text: str) -> str:
        """Remove scattered text and single characters.
        
        Args:
            text: Input text
            
        Returns:
            Cleaned text
        """
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip very short lines (likely noise)
            if len(line) < self.min_text_length:
                continue
            
            # Skip lines with mostly single characters separated by spaces
            words = line.split()
            if len(words) > 5 and sum(len(w) == 1 for w in words) / len(words) > 0.5:
                continue
            
            # Skip lines with too many special characters
            if len(re.findall(r'[^a-zA-ZäöüÄÖÜß0-9\s\-.,;:!?()\[\]]', line)) > len(line) * 0.3:
                continue
            
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def basic_cleanup(self, text: str) -> str:
        """Perform basic text cleanup.
        
        Args:
            text: Input text
            
        Returns:
            Cleaned text
        """
        # Remove scattered text
        text = self.remove_scattered_text(text)
        
        # Fix common OCR errors
        text = text.replace('|', 'I')
        text = text.replace('~', '-')
        
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)
        
        # Remove multiple newlines (keep max 2)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Remove trailing/leading whitespace
        text = text.strip()
        
        return text
    
    def cleanup_with_llm(self, text: str, context: str = "") -> str:
        """Clean up text using LLM.
        
        Args:
            text: Input text to clean
            context: Context about the document
            
        Returns:
            Cleaned text
        """
        if not text or not text.strip():
            return text
        
        try:
            prompt = f"""Du bist ein Experte für die Korrektur von OCR-Fehlern in deutschen Texten.

Aufgabe:
1. Korrigiere Rechtschreibfehler und OCR-Fehler
2. Entferne verstreuten, sinnlosen Text
3. Entferne einzelne Zeichen ohne Kontext
4. Behalte die Original-Formatierung (Absätze, Listen, etc.)
5. Behalte alle sinnvollen Zahlen, Formeln und Fachbegriffe
6. Gib nur den korrigierten Text zurück, ohne Kommentare

{f"Kontext: {context}" if context else ""}

Text:
{text}

Korrigierter Text:"""

            response = self.llm_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Du bist ein präziser Text-Korrektor für deutsche OCR-Texte."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=4000,
                temperature=0.2
            )
            
            cleaned_text = response.choices[0].message.content.strip()
            logger.info(f"LLM cleanup: {len(text)} -> {len(cleaned_text)} chars")
            return cleaned_text
            
        except Exception as e:
            logger.error(f"LLM cleanup error: {e}")
            return text
    
    def process_text(self, text: str, context: str = "", page_num: int = None) -> str:
        """Process and clean text.
        
        Args:
            text: Input text
            context: Document context
            page_num: Page number (for logging)
            
        Returns:
            Cleaned text
        """
        if not text or not text.strip():
            return ""
        
        logger.info(f"Cleaning text{f' from page {page_num}' if page_num else ''}...")
        
        # Basic cleanup first
        text = self.basic_cleanup(text)
        
        # LLM cleanup if enabled and text is substantial
        if self.use_llm and len(text) > 20:
            text = self.cleanup_with_llm(text, context)
        
        return text.strip()
    
    def merge_page_texts(self, page_texts: List[str]) -> str:
        """Merge texts from multiple pages into a coherent document.
        
        Args:
            page_texts: List of page texts
            
        Returns:
            Merged text
        """
        # Filter out empty pages
        page_texts = [text for text in page_texts if text.strip()]
        
        if not page_texts:
            return ""
        
        # Join with double newline between pages
        merged = '\n\n---\n\n'.join(page_texts)
        
        return merged
