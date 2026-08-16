from .base import *  # noqa: F401, F403, F405

DEBUG = True
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
            "datefmt": "%H:%M:%S",
        },
        "sql": {
            "format": "  SQL ({duration:.1f}ms)  {sql}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "datasets": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "proteins": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "interactions": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
