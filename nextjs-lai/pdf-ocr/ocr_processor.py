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
    
    def extract_text(self, image_path: Path) -> str:
        """Extract text from image using best available method.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Extracted text
        """
        # Try LLM vision first if enabled
        if self.use_llm_vision:
            text = self.extract_text_llm_vision(image_path)
            if text:
                return text
            logger.warning("LLM vision failed, falling back to Tesseract")
        
        # Fall back to Tesseract
        return self.extract_text_tesseract(image_path)
    
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
