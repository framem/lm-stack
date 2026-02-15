"""PDF text extraction module."""
import logging
from pathlib import Path
from typing import List, Dict
import PyPDF2
from pdf2image import convert_from_path
from PIL import Image

logger = logging.getLogger(__name__)


class PDFExtractor:
    """Extract text and images from PDF files."""
    
    def __init__(self, dpi: int = 300):
        """Initialize PDF extractor.
        
        Args:
            dpi: DPI for PDF to image conversion
        """
        self.dpi = dpi
    
    def extract_text(self, pdf_path: Path) -> List[Dict[str, any]]:
        """Extract text from PDF pages.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List of dictionaries with page number and text
        """
        pages_data = []
        
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages, start=1):
                    text = page.extract_text()
                    pages_data.append({
                        'page': page_num,
                        'text': text.strip() if text else '',
                        'has_text': bool(text and text.strip())
                    })
                    
            logger.info(f"Extracted text from {len(pages_data)} pages")
            return pages_data
            
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {e}")
            return []
    
    def convert_to_images(self, pdf_path: Path, output_dir: Path) -> List[Path]:
        """Convert PDF pages to images.
        
        Args:
            pdf_path: Path to PDF file
            output_dir: Directory to save images
            
        Returns:
            List of paths to saved images
        """
        try:
            output_dir.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Converting PDF to images at {self.dpi} DPI...")
            images = convert_from_path(
                pdf_path,
                dpi=self.dpi,
                output_folder=output_dir,
                fmt='png'
            )
            
            image_paths = []
            for i, image in enumerate(images, start=1):
                image_path = output_dir / f"page_{i:03d}.png"
                image.save(image_path, 'PNG')
                image_paths.append(image_path)
                
            logger.info(f"Converted {len(image_paths)} pages to images")
            return image_paths
            
        except Exception as e:
            logger.error(f"Error converting PDF to images: {e}")
            return []
    
    def needs_ocr(self, page_data: Dict[str, any], min_text_ratio: float = 0.1) -> bool:
        """Determine if a page needs OCR.
        
        Args:
            page_data: Page data dictionary
            min_text_ratio: Minimum text ratio to consider page has text
            
        Returns:
            True if page needs OCR
        """
        # If no text extracted or very little text, needs OCR
        text = page_data.get('text', '')
        return len(text.strip()) < 50  # Less than 50 characters likely needs OCR
