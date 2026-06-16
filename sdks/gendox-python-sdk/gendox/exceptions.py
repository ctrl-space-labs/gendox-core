class GendoxError(Exception):
    """Base exception for all Gendox SDK errors."""


class GendoxAuthError(GendoxError):
    """Raised when authentication fails (401)."""


class GendoxAPIError(GendoxError):
    """Raised when an API call returns an unexpected response."""


class GendoxTimeoutError(GendoxError):
    """Raised when polling for a background job times out."""
