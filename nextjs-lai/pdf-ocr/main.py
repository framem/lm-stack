"""Main script to convert PDFs to Markdown with OCR and cleanup."""
import argparse
import atexit
import logging
import shutil
import signal
import sys
from pathlib import Path
from typing import List, Optional
from tqdm import tqdm

import config
from pdf_extractor import PDFExtractor
from ocr_processor import OCRProcessor
from text_cleanup import TextCleanup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.PROJECT_DIR / 'conversion.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def cleanup_temp_dir():
    """Clean up temporary directory on exit or interruption."""
    try:
        if config.TEMP_DIR.exists():
            shutil.rmtree(config.TEMP_DIR)
            logger.info(f"Cleaned up temporary directory: {config.TEMP_DIR}")
    except Exception as e:
        logger.error(f"Error cleaning up temp directory: {e}")


def signal_handler(signum, frame):
    """Handle interruption signals (Ctrl+C, etc.)."""
    logger.info("\nInterruption received, cleaning up...")
    cleanup_temp_dir()
    sys.exit(0)


# Register cleanup handlers
atexit.register(cleanup_temp_dir)
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


class PDF2MarkdownConverter:
    """Convert PDF files to clean Markdown documents."""
    
    def __init__(self, max_pages: Optional[int] = None):
        """Initialize the converter.
        
        Args:
            max_pages: Maximum number of pages to process per PDF (None for all)
        """
        self.pdf_extractor = PDFExtractor(dpi=config.DPI)
        self.ocr_processor = OCRProcessor(
            tesseract_lang=config.TESSERACT_LANG,
            use_llm_vision=config.USE_LLM_VISION,
            llm_api_base=config.LLM_API_BASE,
            llm_model=config.LLM_MODEL,
            llm_api_key=config.LLM_API_KEY
        )
        self.text_cleanup = TextCleanup(
            use_llm=config.USE_LLM_CLEANUP,
            llm_api_base=config.LLM_API_BASE,
            llm_model=config.LLM_MODEL,
            llm_api_key=config.LLM_API_KEY,
            min_text_length=config.MIN_TEXT_LENGTH
        )
        self.max_pages = max_pages
    
    def process_pdf(self, pdf_path: Path) -> str:
        """Process a single PDF file.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted and cleaned text in Markdown format
        """
        logger.info(f"Processing {pdf_path.name}...")
        
        # Step 1: Extract text from PDF
        logger.info("Step 1: Extracting text from PDF...")
        pages_data = self.pdf_extractor.extract_text(pdf_path)
        
        if not pages_data:
            logger.error(f"Failed to extract text from {pdf_path}")
            return ""
        
        # Step 2: Process pages
        page_texts = []
        temp_dir = config.TEMP_DIR / pdf_path.stem
        
        # Limit pages if in test mode
        if self.max_pages:
            pages_data = pages_data[:self.max_pages]
            logger.info(f"Test mode: Processing only first {len(pages_data)} pages")
        
        try:
            for page_data in tqdm(pages_data, desc="Processing pages"):
                page_num = page_data['page']
                extracted_text = page_data['text']
                
                # Check if page needs OCR
                if self.pdf_extractor.needs_ocr(page_data):
                    logger.info(f"Page {page_num} needs OCR")
                    
                    # Convert page to image
                    temp_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Convert single page
                    single_page_dir = temp_dir / f"page_{page_num}"
                    single_page_dir.mkdir(exist_ok=True)
                    
                    # Extract just this page
                    from pdf2image import convert_from_path
                    images = convert_from_path(
                        pdf_path,
                        dpi=config.DPI,
                        first_page=page_num,
                        last_page=page_num,
                        output_folder=single_page_dir
                    )
                    
                    if images:
                        image_path = single_page_dir / f"page_{page_num}.png"
                        images[0].save(image_path, 'PNG')
                        
                        # Perform OCR
                        ocr_text = self.ocr_processor.extract_text(image_path)
                        
                        # Combine with any extracted text
                        if extracted_text:
                            combined_text = f"{extracted_text}\n\n{ocr_text}"
                        else:
                            combined_text = ocr_text
                    else:
                        combined_text = extracted_text
                else:
                    combined_text = extracted_text
                
                # Clean up the text
                if combined_text:
                    cleaned_text = self.text_cleanup.process_text(
                        combined_text,
                        context=pdf_path.stem,
                        page_num=page_num
                    )
                    
                    if cleaned_text:
                        page_texts.append(f"## Seite {page_num}\n\n{cleaned_text}")
        
        finally:
            # Clean up temporary files
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
        
        # Step 3: Merge all pages
        logger.info("Step 3: Merging pages...")
        final_text = self.text_cleanup.merge_page_texts(page_texts)
        
        # Create Markdown document
        markdown = self.create_markdown(pdf_path.stem, final_text)
        
        logger.info(f"Completed processing {pdf_path.name}")
        return markdown
    
    def create_markdown(self, title: str, content: str) -> str:
        """Create a Markdown document.
        
        Args:
            title: Document title
            content: Document content
            
        Returns:
            Formatted Markdown
        """
        markdown = f"""# {title}

{content}
"""
        return markdown
    
    def save_markdown(self, markdown: str, output_path: Path):
        """Save Markdown to file.
        
        Args:
            markdown: Markdown content
            output_path: Output file path
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        logger.info(f"Saved to {output_path}")
    
    def convert_pdfs(self, pdf_paths: Optional[List[Path]] = None):
        """Convert PDFs from the PDF directory or from a list of files.
        
        Args:
            pdf_paths: List of PDF file paths. If None, processes all PDFs in PDF_DIR.
        """
        if pdf_paths:
            # Use provided file list
            pdf_files = [Path(p) for p in pdf_paths]
            # Validate that files exist
            pdf_files = [p for p in pdf_files if p.exists() and p.suffix.lower() == '.pdf']
            if not pdf_files:
                logger.error("No valid PDF files found in provided list")
                return
        else:
            # Use default directory
            pdf_files = list(config.PDF_DIR.glob("*.pdf"))
            if not pdf_files:
                logger.warning(f"No PDF files found in {config.PDF_DIR}")
                return
        
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        for pdf_file in pdf_files:
            try:
                markdown = self.process_pdf(pdf_file)
                
                if markdown:
                    output_path = config.OUTPUT_DIR / f"{pdf_file.stem}.md"
                    self.save_markdown(markdown, output_path)
                else:
                    logger.warning(f"No content extracted from {pdf_file.name}")
            
            except Exception as e:
                logger.error(f"Error processing {pdf_file.name}: {e}", exc_info=True)
        
        logger.info("Conversion complete!")


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Convert PDF files to Markdown with OCR and AI cleanup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process all PDFs in the default directory
  python main.py
  
  # Process specific PDF files
  python main.py --files file1.pdf file2.pdf
  
  # Test mode: process only first 2 pages
  python main.py --test
  
  # Test mode with specific files
  python main.py --test --files document.pdf
        """
    )
    
    parser.add_argument(
        '--files',
        nargs='+',
        type=str,
        help='Specific PDF files to process (full or relative paths)'
    )
    
    parser.add_argument(
        '--test',
        action='store_true',
        help='Test mode: process only the first 2 pages of each PDF'
    )
    
    parser.add_argument(
        '--max-pages',
        type=int,
        help='Maximum number of pages to process per PDF'
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_arguments()
    
    print("=" * 70)
    print("PDF to Markdown Converter with OCR and AI Cleanup")
    print("=" * 70)
    print()
    
    # Determine max pages
    max_pages = None
    if args.test:
        max_pages = 2
        print("📝 TEST MODE: Processing only first 2 pages per PDF")
    elif args.max_pages:
        max_pages = args.max_pages
        print(f"📝 LIMITED MODE: Processing only first {max_pages} pages per PDF")
    
    # Convert file arguments to Path objects
    pdf_files = None
    if args.files:
        pdf_files = [Path(f).resolve() for f in args.files]
        print(f"📄 Processing {len(pdf_files)} specified file(s)")
        for pdf in pdf_files:
            if not pdf.exists():
                print(f"⚠️  Warning: File not found: {pdf}")
    else:
        print(f"📁 Processing all PDFs from: {config.PDF_DIR}")
    
    print()
    
    # Create converter and process
    converter = PDF2MarkdownConverter(max_pages=max_pages)
    converter.convert_pdfs(pdf_paths=pdf_files)
    
    print()
    print("=" * 70)
    print(f"✅ Conversion complete! Check {config.OUTPUT_DIR} for results.")
    print("=" * 70)


if __name__ == "__main__":
    main()
