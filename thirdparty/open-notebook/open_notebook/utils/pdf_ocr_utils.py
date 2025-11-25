"""
PDF OCR Utilities for Open Notebook

This module provides OCR capabilities for processing scanned/image-based PDFs
that don't contain extractable text layers.

Supports:
- Detection of image-only PDFs
- OCR text extraction using PaddleOCR (Chinese + English)
- Fallback to Tesseract if PaddleOCR is unavailable
"""

import io
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
from PIL import Image
from loguru import logger

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("PyMuPDF not available - OCR functionality will be limited")

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    logger.info("PaddleOCR not available - will try Tesseract as fallback")

try:
    from PIL import Image
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.info("Tesseract not available")


# Global OCR instance (lazy initialization)
_ocr_engine: Optional[PaddleOCR] = None


def _get_ocr_engine() -> Optional[PaddleOCR]:
    """Get or initialize the global PaddleOCR engine"""
    global _ocr_engine

    if not PADDLEOCR_AVAILABLE:
        return None

    if _ocr_engine is None:
        try:
            _ocr_engine = PaddleOCR(
                use_textline_orientation=True,  # Replaces deprecated use_angle_cls
                lang='ch'  # Chinese + English support
            )
            logger.info("PaddleOCR engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}")
            return None

    return _ocr_engine


def is_image_only_pdf(pdf_path: str) -> bool:
    """
    Detect if a PDF is image-only (no text layer)

    Strategy:
    1. Sample first 3 pages
    2. Try to extract text
    3. If less than 50 characters found, consider it image-only

    Args:
        pdf_path: Path to the PDF file

    Returns:
        True if PDF appears to be image-only
    """
    if not PYMUPDF_AVAILABLE:
        logger.warning("PyMuPDF not available - cannot detect image-only PDFs")
        return False

    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        sample_pages = min(3, total_pages)

        total_chars = 0
        for page_num in range(sample_pages):
            page = doc[page_num]
            text = page.get_text()
            total_chars += len(text.strip())

        doc.close()

        # If less than 50 characters in first 3 pages, likely image-only
        is_image_only = total_chars < 50

        if is_image_only:
            logger.info(
                f"PDF appears to be image-only: {total_chars} chars in {sample_pages} pages"
            )

        return is_image_only

    except Exception as e:
        logger.error(f"Error detecting PDF type: {e}")
        return False


def extract_text_with_paddleocr(pdf_path: str, max_pages: Optional[int] = None) -> Tuple[str, dict]:
    """
    Extract text from image-only PDF using PaddleOCR

    Args:
        pdf_path: Path to the PDF file
        max_pages: Maximum number of pages to process (None = all pages)

    Returns:
        Tuple of (extracted_text, metadata)
    """
    if not PYMUPDF_AVAILABLE:
        raise RuntimeError("PyMuPDF is required for PDF OCR")

    ocr = _get_ocr_engine()
    if ocr is None:
        raise RuntimeError("PaddleOCR is not available")

    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        pages_to_process = min(max_pages, total_pages) if max_pages else total_pages

        logger.info(f"Starting OCR on {pages_to_process} pages (total: {total_pages})")

        extracted_pages = []

        for page_num in range(pages_to_process):
            logger.debug(f"Processing page {page_num + 1}/{pages_to_process}")

            page = doc[page_num]

            # Render page to image at 72 DPI (balance quality vs speed, ~5s per page)
            pix = page.get_pixmap(dpi=72)
            img_data = pix.tobytes("png")

            # Convert to PIL Image and numpy array for OCR
            img = Image.open(io.BytesIO(img_data))
            img_array = np.array(img)

            # OCR recognition using PaddleOCR 3.3.2+ predict() API
            result = ocr.predict(img_array)

            if result and len(result) > 0:
                # Extract text from OCR result (PaddleOCR 3.3.2 format)
                page_text = []
                rec_texts = result[0].get('rec_texts', [])
                for text in rec_texts:
                    if text and isinstance(text, str):
                        page_text.append(text)

                extracted_pages.append(f"=== Page {page_num + 1} ===\n" + "\n".join(page_text))
            else:
                logger.warning(f"No text detected on page {page_num + 1}")
                extracted_pages.append(f"=== Page {page_num + 1} ===\n[No text detected]")

        doc.close()

        full_text = "\n\n".join(extracted_pages)

        metadata = {
            "ocr_engine": "PaddleOCR",
            "pages_processed": pages_to_process,
            "total_pages": total_pages,
            "chars_extracted": len(full_text)
        }

        logger.info(
            f"OCR completed: {pages_to_process} pages, {len(full_text)} characters"
        )

        return full_text, metadata

    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        raise


def extract_text_with_tesseract(pdf_path: str, max_pages: Optional[int] = None) -> Tuple[str, dict]:
    """
    Extract text from image-only PDF using Tesseract OCR (fallback)

    Args:
        pdf_path: Path to the PDF file
        max_pages: Maximum number of pages to process (None = all pages)

    Returns:
        Tuple of (extracted_text, metadata)
    """
    if not PYMUPDF_AVAILABLE or not TESSERACT_AVAILABLE:
        raise RuntimeError("PyMuPDF and Tesseract are required for PDF OCR")

    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        pages_to_process = min(max_pages, total_pages) if max_pages else total_pages

        logger.info(f"Starting Tesseract OCR on {pages_to_process} pages")

        extracted_pages = []

        for page_num in range(pages_to_process):
            logger.debug(f"Processing page {page_num + 1}/{pages_to_process}")

            page = doc[page_num]
            pix = page.get_pixmap(dpi=150)

            # Convert to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            # OCR with Tesseract (Chinese + English)
            text = pytesseract.image_to_string(img, lang='chi_sim+eng')

            extracted_pages.append(f"=== Page {page_num + 1} ===\n{text}")

        doc.close()

        full_text = "\n\n".join(extracted_pages)

        metadata = {
            "ocr_engine": "Tesseract",
            "pages_processed": pages_to_process,
            "total_pages": total_pages,
            "chars_extracted": len(full_text)
        }

        logger.info(
            f"Tesseract OCR completed: {pages_to_process} pages, {len(full_text)} characters"
        )

        return full_text, metadata

    except Exception as e:
        logger.error(f"Tesseract OCR failed: {e}")
        raise


def extract_text_with_ocr(pdf_path: str, max_pages: Optional[int] = None) -> Tuple[str, dict]:
    """
    Extract text from image-only PDF using available OCR engine

    Tries PaddleOCR first, falls back to Tesseract if unavailable.

    Args:
        pdf_path: Path to the PDF file
        max_pages: Maximum number of pages to process (None = all pages)

    Returns:
        Tuple of (extracted_text, metadata)

    Raises:
        RuntimeError: If no OCR engine is available
    """
    if PADDLEOCR_AVAILABLE and _get_ocr_engine() is not None:
        logger.info("Using PaddleOCR for text extraction")
        return extract_text_with_paddleocr(pdf_path, max_pages)

    elif TESSERACT_AVAILABLE:
        logger.info("Using Tesseract OCR for text extraction")
        return extract_text_with_tesseract(pdf_path, max_pages)

    else:
        raise RuntimeError(
            "No OCR engine available. Please install PaddleOCR or Tesseract:\n"
            "  pip install paddlepaddle paddleocr\n"
            "  # or\n"
            "  brew install tesseract tesseract-lang && pip install pytesseract"
        )


def process_pdf_with_ocr_fallback(
    pdf_path: str,
    extracted_text: str,
    max_pages: Optional[int] = None
) -> Tuple[str, Optional[dict]]:
    """
    Process PDF with OCR fallback if text extraction failed

    This is the main entry point for PDF processing with OCR support.

    Args:
        pdf_path: Path to the PDF file
        extracted_text: Text extracted by content-core
        max_pages: Maximum pages for OCR (None = all, default: 100)

    Returns:
        Tuple of (final_text, ocr_metadata or None)
    """
    # If extraction succeeded, return as-is
    if extracted_text and len(extracted_text.strip()) > 100:
        logger.debug("PDF text extraction successful, no OCR needed")
        return extracted_text, None

    # Check if this is an image-only PDF
    if not is_image_only_pdf(pdf_path):
        logger.debug("PDF has text layer but extraction failed - returning empty")
        return extracted_text, None

    # Apply OCR
    logger.info("Detected image-only PDF, applying OCR...")

    try:
        # Limit to 100 pages by default to avoid excessive processing time
        ocr_text, ocr_metadata = extract_text_with_ocr(
            pdf_path,
            max_pages=max_pages if max_pages is not None else 100
        )

        return ocr_text, ocr_metadata

    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        # Return original (empty) text if OCR fails
        return extracted_text, None
