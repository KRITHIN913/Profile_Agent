import sys
from unittest.mock import patch, MagicMock

# Mock missing dependencies in the Mingw environment
mock_httpx = MagicMock()
class MockTimeoutException(Exception):
    pass
class MockHTTPStatusError(Exception):
    def __init__(self, message, response=None):
        super().__init__(message)
        self.response = response
        
mock_httpx.TimeoutException = MockTimeoutException
mock_httpx.HTTPStatusError = MockHTTPStatusError

sys.modules["httpx"] = mock_httpx
sys.modules["trafilatura"] = MagicMock()

import pytest
from app.services.retrieval import fetch_and_extract, RESTRICTED_DOMAINS

@pytest.mark.asyncio
async def test_blocklist():
    """Test that paywalled/ToS domains are blocked immediately without fetching."""
    url = "https://www.linkedin.com/in/some-profile"
    text, accessible, note = await fetch_and_extract(url)
    
    assert text is None
    assert accessible is False
    assert "restricted blocklist" in note

@pytest.mark.asyncio
async def test_tavily_tier_bypass():
    """Test that Tavily's pre-extracted content is used if substantive."""
    url = "https://example.com/article"
    tavily_text = "This is a substantive piece of content. " * 20  # > 500 chars
    
    # We shouldn't need to mock httpx because it should return before fetching
    with patch("app.services.retrieval.check_robots_txt", return_value=True):
        text, accessible, note = await fetch_and_extract(url, tavily_content=tavily_text)
        
        assert accessible is True
        assert text == tavily_text
        assert note is None

@pytest.mark.asyncio
@patch("app.services.retrieval.httpx.AsyncClient")
@patch("app.services.retrieval.check_robots_txt", return_value=True)
async def test_httpx_html_fallback(mock_robots, mock_client_class):
    """Test HTML fetching and trafilatura extraction."""
    url = "https://example.com/blog"
    
    # Mock HTTP response
    mock_response = MagicMock()
    mock_response.headers = {"content-type": "text/html"}
    mock_response.text = "<html><body><p>This is extracted article text.</p></body></html>"
    mock_response.raise_for_status = MagicMock()
    
    # Setup the mock async context manager
    mock_client = mock_client_class.return_value.__aenter__.return_value
    mock_client.get.return_value = mock_response
    
    # Mock trafilatura
    with patch("trafilatura.extract", return_value="This is extracted article text."):
        text, accessible, note = await fetch_and_extract(url)
        
        assert accessible is True
        assert text == "This is extracted article text."
        assert note is None

@pytest.mark.asyncio
@patch("app.services.retrieval.httpx.AsyncClient")
@patch("app.services.retrieval.check_robots_txt", return_value=True)
async def test_timeout_handling(mock_robots, mock_client_class):
    """Test that httpx TimeoutException is caught and handled gracefully."""
    url = "https://example.com/slow"
    
    # Setup the mock async context manager and the get method
    mock_client = mock_client_class.return_value.__aenter__.return_value
    mock_client.get.side_effect = sys.modules["httpx"].TimeoutException("Timeout")
    
    text, accessible, note = await fetch_and_extract(url)
    
    assert text is None
    assert accessible is False
    assert "Timeout" in note
