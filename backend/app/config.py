# Re-export configuration from root config.py for modular package imports
import sys
import os

# Add parent directory to sys.path so config can be imported from root
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from config import Config, DevelopmentConfig, TestingConfig, ProductionConfig, config_by_name

__all__ = [
    "Config",
    "DevelopmentConfig",
    "TestingConfig",
    "ProductionConfig",
    "config_by_name",
]
