"""
Diligencify Profile Builder — Retrieval Service

Tiered extraction pipeline:
1. Tavily pre-extracted content (if substantive)
2. httpx + trafilatura (HTML)
3. PyMuPDF + pytesseract (PDFs)

Enforces robots.txt, paywall blocklists, and strict timeouts.
"""

import logging
import urllib.robotparser
import urllib.request
from urllib.parse import urlparse
from datetime import datetime, timezone
import httpx
import trafilatura
import io

# Optional imports for PDF processing
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None

logger = logging.getLogger(__name__)

# Hard limits
FETCH_TIMEOUT = 8.0  # seconds
MAX_OCR_PAGES = 15
MIN_PDF_TEXT_CHARS = 200

# Blocklist of known paywalled/ToS-restricted domains (no bypass attempts allowed)
RESTRICTED_DOMAINS = {
    "linkedin.com",
    "www.linkedin.com",
    "wsj.com",
    "www.wsj.com",
    "ft.com",
    "www.ft.com",
    "bloomberg.com",
    "www.bloomberg.com",
}

# In-memory cache for robots.txt parsers
_robot_parsers: dict[str, urllib.robotparser.RobotFileParser] = {}

def get_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""

def check_robots_txt(url: str) -> bool:
    """Checks robots.txt for the given URL. Returns True if allowed, False if disallowed."""
    parsed = urlparse(url)
    domain = parsed.netloc
    if not domain:
        return True

    scheme = parsed.scheme or "https"
    robots_url = f"{scheme}://{domain}/robots.txt"

    if domain not in _robot_parsers:
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)
        try:
            req = urllib.request.Request(robots_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
            with urllib.request.urlopen(req, timeout=3.0) as response:
                rp.parse(response.read().decode('utf-8').splitlines())
            _robot_parsers[domain] = rp
        except Exception as e:
            logger.debug(f"Failed to read robots.txt for {domain}: {e}")
            # If we can't read robots.txt (e.g. 403, timeout), we fail open (allow)
            _robot_parsers[domain] = None
    
    if _robot_parsers[domain] is None:
        return True
        
    try:
        # User-agent used by httpx default or our custom one
        return _robot_parsers[domain].can_fetch("*", url)
    except Exception:
        return True

def extract_pdf_content(content: bytes) -> str | None:
    """Extracts text from PDF using PyMuPDF, falling back to OCR if it's an image."""
    if fitz is None:
        logger.warning("PyMuPDF (fitz) not installed. Cannot process PDF.")
        return None

    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as e:
        logger.error(f"Failed to open PDF: {e}")
        return None

    text_blocks = []
    
    # 1. Try native text extraction
    for i in range(min(len(doc), MAX_OCR_PAGES)):
        page = doc[i]
        text_blocks.append(page.get_text())

    extracted_text = "\n".join(text_blocks).strip()

    # 2. If it looks like a scanned document, fall back to OCR
    if len(extracted_text) < MIN_PDF_TEXT_CHARS and pytesseract is not None and Image is not None:
        logger.info("PDF appears to be scanned. Falling back to OCR.")
        ocr_blocks = []
        for i in range(min(len(doc), MAX_OCR_PAGES)):
            page = doc[i]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text = pytesseract.image_to_string(img)
            ocr_blocks.append(ocr_text)
        extracted_text = "\n".join(ocr_blocks).strip()

    doc.close()
    return extracted_text

async def fetch_and_extract(url: str, tavily_content: str | None = None) -> tuple[str | None, bool, str | None]:
    """
    Tiered retrieval for a given URL.
    Returns: (extracted_text, accessible, note)
    """
    domain = get_domain(url)

    # 0. Compliance check: Blocklist
    if domain in RESTRICTED_DOMAINS:
        return (None, False, "Domain in restricted blocklist (paywall/ToS).")

    # 0. Compliance check: robots.txt
    if not check_robots_txt(url):
        return (None, False, "Blocked by robots.txt.")

    # 1. Tier 1: Tavily provided content
    if tavily_content and len(tavily_content.strip()) > 500:
        return (tavily_content, True, None)

    # 2. Tier 2/3: Fetch the raw page
    try:
        async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
            # Mask as a standard browser to avoid trivial blocks, though robots.txt is respected
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "").lower()
            
            # Tier 3: PDF
            if "application/pdf" in content_type or url.lower().endswith(".pdf"):
                pdf_text = extract_pdf_content(response.content)
                if pdf_text and len(pdf_text.strip()) > 0:
                    return (pdf_text, True, None)
                return (None, True, "Failed to extract text from PDF.")
            
            # Tier 2: HTML
            extracted = trafilatura.extract(
                response.text, 
                include_comments=False, 
                include_tables=True, 
                no_fallback=False
            )
            
            if extracted and len(extracted.strip()) > 0:
                return (extracted, True, None)
            else:
                # If trafilatura fails to find article content, fallback to raw text extraction (rare)
                return (None, True, "Trafilatura extracted empty content.")

    except httpx.TimeoutException:
        return (None, False, f"Timeout after {FETCH_TIMEOUT}s.")
    except httpx.HTTPStatusError as e:
        return (None, False, f"HTTP Error {e.response.status_code}")
    except Exception as e:
        return (None, False, f"Fetch error: {str(e)}")
