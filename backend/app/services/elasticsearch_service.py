"""
Elasticsearch Service
Connects to Elasticsearch cluster if available; otherwise uses simulated fallback.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ElasticsearchService:
    def __init__(self):
        self._client = None
        try:
            from elasticsearch import AsyncElasticsearch
            self._client = AsyncElasticsearch(
                hosts=[settings.ELASTICSEARCH_URL],
                retry_on_timeout=True,
                max_retries=2,
            )
        except ImportError:
            self._client = None

    async def health_check(self) -> str:
        if not self._client:
            return "simulated"
        try:
            info = await self._client.ping()
            return "healthy" if info else "unhealthy"
        except Exception:
            return "unhealthy"

    async def fetch_error_logs(
        self,
        services: Optional[List[str]],
        start_time: datetime,
        end_time: datetime,
        min_level: str = "ERROR",
        size: int = 500,
    ) -> List[Dict[str, Any]]:
        """Fetch error logs from ES or fallback to simulated logs."""
        if not self._client:
            from app.services.simulator import incident_simulator
            scenario = incident_simulator.generate_incident_scenario()
            return scenario.get("logs", [])

        must_clauses = [
            {"range": {"@timestamp": {"gte": start_time.isoformat(), "lte": end_time.isoformat()}}},
        ]
        if services:
            must_clauses.append({"terms": {"service.keyword": services}})

        query = {
            "query": {"bool": {"must": must_clauses}},
            "size": size,
        }
        try:
            resp = await self._client.search(index=settings.ELASTICSEARCH_INDEX_LOGS, body=query)
            hits = resp.get("hits", {}).get("hits", [])
            return [hit["_source"] for hit in hits]
        except Exception as e:
            logger.warning("elasticsearch_query_failed_using_simulator", error=str(e))
            from app.services.simulator import incident_simulator
            scenario = incident_simulator.generate_incident_scenario()
            return scenario.get("logs", [])

    async def close(self):
        if self._client:
            try:
                await self._client.close()
            except Exception:
                pass


elasticsearch_service = ElasticsearchService()
