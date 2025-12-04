from functools import lru_cache
from typing import Any, Dict

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from app.config import settings
from app.utils.logger import app_logger


@lru_cache(maxsize=1)
def _initialize_firebase() -> None:
    if firebase_admin._apps:
        return

    if settings.FIREBASE_CREDENTIALS_PATH:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
    else:
        firebase_admin.initialize_app()


def verify_firebase_id_token(id_token: str) -> Dict[str, Any]:
    _initialize_firebase()
    try:
        return firebase_auth.verify_id_token(id_token , clock_skew_seconds=10)
    except Exception as exc:  # noqa: BLE001
        app_logger.error(f"Firebase token verification failed: {exc}")
        raise ValueError("Invalid Firebase ID token") from exc