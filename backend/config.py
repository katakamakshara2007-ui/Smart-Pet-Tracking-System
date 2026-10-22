import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration with safe defaults."""
    SECRET_KEY = os.getenv("SECRET_KEY", "smart-pet-secret-key-anurag-univ-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smart-pet-jwt-secret-key-btech-ds")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRATION_HOURS", 24)))
    
    # MySQL Database Configuration
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME", "smart_pet_tracking")
    
    # Priority: explicit URI -> constructed MySQL URI -> SQLite fallback if requested
    CUSTOM_DB_URI = os.getenv("DATABASE_URL")
    if CUSTOM_DB_URI:
        SQLALCHEMY_DATABASE_URI = CUSTOM_DB_URI
    elif os.getenv("USE_SQLITE", "false").lower() in ("true", "1", "yes"):
        basedir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(basedir, 'smart_pet_tracking.db')}"
    else:
        # Default MySQL connection via PyMySQL driver
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
        )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
    }
    
    # Geofence & Simulation Defaults
    DEFAULT_SAFEZONE_RADIUS = float(os.getenv("DEFAULT_SAFEZONE_RADIUS", 100.0))  # in meters
    SIMULATION_MODE = os.getenv("SIMULATION_MODE", "true").lower() == "true"


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    # In-memory SQLite for fast, isolated, reliable unit tests
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
