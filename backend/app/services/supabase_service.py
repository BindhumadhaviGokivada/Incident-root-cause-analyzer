"""
Supabase Service
Handles direct Supabase database interactions, JWT authentication verification,
and real-time incident event broadcasts.
"""
from typing import Optional, Dict, Any
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class SupabaseService:
    def __init__(self):
        self._client: Optional[Client] = None
        self._init_client()

    def _init_client(self):
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("supabase_client_initialized", url=settings.SUPABASE_URL)
            except Exception as e:
                logger.error("supabase_init_failed", error=str(e))
                self._client = None
        else:
            logger.info("supabase_credentials_not_provided_operating_in_direct_db_mode")

    @property
    def client(self) -> Optional[Client]:
        if self._client is None and settings.SUPABASE_URL and settings.SUPABASE_KEY:
            self._init_client()
        return self._client

    def verify_auth_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Supabase JWT token and extract user details."""
        if not self.client:
            # Fallback for dev mode
            return {"sub": "dev-user-id", "email": "admin@incidentroot.io", "role": "authenticated"}
        try:
            user_response = self.client.auth.get_user(token)
            if user_response and user_response.user:
                return {
                    "sub": str(user_response.user.id),
                    "email": user_response.user.email,
                    "role": user_response.user.role or "authenticated"
                }
            return None
        except Exception as e:
            logger.warning("supabase_token_verification_failed", error=str(e))
            return None

    async def broadcast_incident_event(self, channel_name: str, event_name: str, payload: Dict[str, Any]):
        """Publish incident status change to Supabase Realtime."""
        if self.client:
            try:
                self.client.channel(channel_name).send_broadcast(event_name, payload)
            except Exception as e:
                logger.error("supabase_realtime_broadcast_failed", error=str(e))


supabase_service = SupabaseService()
