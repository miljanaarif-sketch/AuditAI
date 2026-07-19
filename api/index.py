"""Vercel Python serverless entry point.

Exposes the FastAPI app (from backend/main.py) as an ASGI application. Storage is
pointed at /tmp because the serverless filesystem is read-only elsewhere; the app
re-seeds its demo data on each cold start.
"""
import os
import sys

_BACKEND = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend")
sys.path.insert(0, _BACKEND)

os.environ.setdefault("DATA_DIR", "/tmp/nawras-data")
os.environ.setdefault("UPLOADS_DIR", "/tmp/nawras-uploads")

from main import app  # noqa: E402  (import after sys.path / env setup)

# Vercel's Python runtime serves the module-level `app` ASGI application.
