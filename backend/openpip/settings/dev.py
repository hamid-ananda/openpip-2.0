from .base import *  # noqa: F401, F403

environ.Env.read_env(BASE_DIR.parent / '.env')  # reads ~/openpip-2.0/.env

DEBUG = True
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
