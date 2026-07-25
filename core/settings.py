import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(env_path)

SECRET_KEY = 'django-insecure-chave-secreta-troque-em-producao'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Apps de Terceiros (ESSENCIAIS)
    'rest_framework',
    'corsheaders',            # <--- Para o React conectar
    'storages',               # <--- Para gerenciar arquivos

    # Seus Apps
    'app_correcao',
]

AUTH_USER_MODEL = 'app_correcao.CustomUser'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # <--- TEM QUE SER O PRIMEIRO
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# --------------------------------------------------
# CONFIGURAÇÃO DO BANCO DE DADOS
# --------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.getenv('DB_NAME', os.path.join(BASE_DIR, 'db.sqlite3')),
        'USER': os.getenv('DB_USER', ''),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', ''),
        'PORT': os.getenv('DB_PORT', ''),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# --- CONFIGURAÇÕES ESTÁTICAS E DE MÍDIA (CORRIGE O ERRO DE UPLOAD) ---
STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --- CONFIGURAÇÃO DO CORS (CORRIGE O ERRO DE CONEXÃO) ---
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 1. Abre o cofre (.env) UMA única vez
load_dotenv()

# --------------------------------------------------
# CONFIGURAÇÕES DA AMAZON S3
# --------------------------------------------------
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME')

# --------------------------------------------------
# CONFIGURAÇÃO DA IA (GEMINI)
# --------------------------------------------------
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Isso diz ao Django para usar a Amazon em vez do seu computador
# DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# Configuração extra para o Token durar mais tempo (opcional, mas bom para testes)
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# ==========================================
# CONFIGURAÇÕES DE E-MAIL
# ==========================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
# Substitua pelos seus dados reais:
EMAIL_HOST_USER = 'brunoso.suporte@gmail.com' 
EMAIL_HOST_PASSWORD = 'ewfdczgtelzuxpro' 
DEFAULT_FROM_EMAIL = f'Equipe Guia do Texto <{EMAIL_HOST_USER}>'

# ==========================================
# INTEGRAÇÃO DE PAGAMENTO (MERCADO PAGO)
# ==========================================
MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-4251176395290032-030620-998314a434cb68be6f60dd0f5898a316-210305364'