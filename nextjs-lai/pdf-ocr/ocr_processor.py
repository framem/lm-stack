"""OCR module using Tesseract and LLM vision."""
import logging
import base64
from pathlib import Path
from typing import List, Optional
import pytesseract
from PIL import Image
import openai

logger = logging.getLogger(__name__)


class OCRProcessor:
    """Process images with OCR using Tesseract and optionally LLM vision."""
    
    def __init__(
        self,
        tesseract_lang: str = "deu",
        use_llm_vision: bool = False,
        llm_api_base: str = None,
        llm_model: str = None,
        llm_api_key: str = None
    ):
        """Initialize OCR processor.
        
        Args:
            tesseract_lang: Language code for Tesseract
            use_llm_vision: Whether to use LLM vision for enhanced OCR
            llm_api_base: LLM API base URL
            llm_model: LLM model name
            llm_api_key: LLM API key
        """
        self.tesseract_lang = tesseract_lang
        self.use_llm_vision = use_llm_vision
        
        if use_llm_vision:
            self.llm_client = openai.OpenAI(
                base_url=llm_api_base,
                api_key=llm_api_key
            )
            self.llm_model = llm_model
    
    def extract_text_tesseract(self, image_path: Path) -> str:
        """Extract text from image using Tesseract OCR.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Extracted text
        """
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(
                image,
                lang=self.tesseract_lang,
                config='--psm 6'  # Assume uniform block of text
            )
            return text.strip()
            
        except Exception as e:
            logger.error(f"Tesseract OCR error for {image_path}: {e}")
            return ""
    
    def extract_text_llm_vision(self, image_path: Path) -> str:
        """Extract text from image using LLM vision capabilities.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Extracted text
        """
        try:
            # Read and encode image
            with open(image_path, 'rb') as img_file:
                image_data = base64.b64encode(img_file.read()).decode('utf-8')
            
            # Call LLM vision API
            response = self.llm_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extrahiere bitte den gesamten Text aus diesem Bild. "
                                        "Gib nur den erkannten Text zurück, ohne zusätzliche Kommentare. "
                                        "Achte auf korrekte deutsche Rechtschreibung und Formatierung."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.1
            )
            
            text = response.choices[0].message.content.strip()
            logger.info(f"LLM vision extracted {len(text)} characters")
            return text
            
        except Exception as e:
            logger.error(f"LLM vision error for {image_path}: {e}")
            return ""
    
    def combine_ocr_results(self, tesseract_text: str, llm_text: str) -> str:
        """Use LLM to intelligently combine and validate OCR results from both methods.
        
        Args:
            tesseract_text: Text extracted by Tesseract OCR
            llm_text: Text extracted by LLM Vision
            
        Returns:
            Combined and validated text
        """
        try:
            # Call LLM to combine and validate both results
            response = self.llm_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Du bist ein Experte für die Validierung und Kombination von OCR-Ergebnissen. "
                                   "Deine Aufgabe ist es, zwei OCR-Ergebnisse zu vergleichen und das beste kombinierte "
                                   "Ergebnis zu erstellen."
                    },
                    {
                        "role": "user",
                        "content": f"""Ich habe zwei OCR-Ergebnisse vom selben Bild:

**Tesseract OCR Ergebnis:**
{tesseract_text}

**LLM Vision Ergebnis:**
{llm_text}

Aufgaben:
1. Vergleiche beide Ergebnisse auf Genauigkeit und Vollständigkeit
2. Identifiziere Stärken und Schwächen jedes Ergebnisses
3. Erstelle ein kombiniertes Ergebnis, das:
   - Die korrekt erkannten Teile beider Methoden nutzt
   - Lücken eines Ergebnisses mit Informationen aus dem anderen füllt
   - OCR-Fehler korrigiert (z.B. "1" statt "l", "0" statt "O")
   - Die beste Formatierung (Absätze, Listen, etc.) beibehält
   - Keine zusätzlichen Kommentare oder Erklärungen enthält

Gib NUR den kombinierten, korrigierten Text zurück, ohne Meta-Kommentare oder Erklärungen."""
                    }
                ],
                max_tokens=3000,
                temperature=0.2
            )
            
            combined_text = response.choices[0].message.content.strip()
            logger.info(f"LLM combined OCR results: {len(combined_text)} chars")
            return combined_text
            
        except Exception as e:
            logger.error(f"Error combining OCR results with LLM: {e}")
            # Fallback: return the longer result
            return llm_text if len(llm_text) > len(tesseract_text) else tesseract_text
    
    def extract_text(self, image_path: Path) -> str:
        """Extract text from image combining Tesseract and optionally LLM vision.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Extracted text (combined from both methods if LLM vision is enabled)
        """
        # Always run Tesseract OCR as baseline
        tesseract_text = self.extract_text_tesseract(image_path)
        
        # If LLM vision is enabled, run it additionally and combine results
        if self.use_llm_vision:
            llm_text = self.extract_text_llm_vision(image_path)
            
            if llm_text:
                # If we have both results, use LLM to combine them intelligently
                if tesseract_text and llm_text:
                    logger.info(f"Tesseract: {len(tesseract_text)} chars, LLM Vision: {len(llm_text)} chars")
                    
                    # Use LLM to validate and combine both results
                    combined_text = self.combine_ocr_results(tesseract_text, llm_text)
                    return combined_text
                elif llm_text:
                    # Only LLM vision has content
                    logger.info(f"Using LLM vision result ({len(llm_text)} chars)")
                    return llm_text
                elif tesseract_text:
                    # Only Tesseract has content
                    logger.info(f"Using Tesseract result ({len(tesseract_text)} chars)")
                    return tesseract_text
            else:
                logger.warning("LLM vision failed, using Tesseract result")
        
        # Return Tesseract result (either as fallback or as only method)
        return tesseract_text
    
    def process_images(self, image_paths: List[Path]) -> List[str]:
        """Process multiple images and extract text.
        
        Args:
            image_paths: List of image paths
            
        Returns:
            List of extracted texts
        """
        texts = []
        for image_path in image_paths:
            logger.info(f"Processing {image_path.name}...")
            text = self.extract_text(image_path)
            texts.append(text)
        
        return texts
