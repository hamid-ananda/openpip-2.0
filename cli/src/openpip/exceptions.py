class OpenPIPError(Exception):
    """Base exception for all openPIP SDK errors."""


class AuthRequired(OpenPIPError):
    """Raised when a command requires admin credentials that weren't provided."""


class NotFound(OpenPIPError):
    """Raised when a requested resource does not exist (404)."""


class ServerError(OpenPIPError):
    """Raised when the server returns a 5xx response."""
