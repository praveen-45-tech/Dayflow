"""
Central configuration for Dayflow.
Reads from environment variables with sane local-dev defaults.
"""
import os

SECRET_KEY = os.getenv("DAYFLOW_SECRET_KEY", "dayflow-dev-secret-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12  # 12 hours

DATABASE_URL = os.getenv("DAYFLOW_DATABASE_URL", "sqlite:///./dayflow.db")

# Standard work day used for hours/payable-day calculations
STANDARD_WORK_HOURS = 8.0
