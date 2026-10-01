"""
Prometheus Service
Queries Prometheus HTTP API for metrics during incident window
"""
import httpx
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Key metrics to analyze during an incident
INCIDENT_METRICS = [
    "http_requests_total",
    "http_request_duration_seconds",
    "process_cpu_seconds_total",
    "process_resident_memory_bytes",
    "go_goroutines",
    "pg_stat_activity_count",
    "redis_connected_clients",
    "node_cpu_seconds_total",
    "node_memory_MemAvailable_bytes",
    "container_cpu_usage_seconds_total",
    "container_memory_usage_bytes",
]


class PrometheusService:
    def __init__(self):
        self.base_url = settings.PROMETHEUS_URL
        self.client = httpx.AsyncClient(timeout=30.0)

    async def health_check(self) -> str:
        try:
            resp = await self.client.get(f"{self.base_url}/-/healthy")
            return "healthy" if resp.status_code == 200 else "unhealthy"
        except Exception:
            return "unhealthy"

    async def query_range(
        self,
        query: str,
        start: datetime,
        end: datetime,
        step: str = "60s",
    ) -> List[Dict[str, Any]]:
        """Execute a Prometheus range query."""
        try:
            resp = await self.client.get(
                f"{self.base_url}/api/v1/query_range",
                params={
                    "query": query,
                    "start": start.timestamp(),
                    "end": end.timestamp(),
                    "step": step,
                },
            )
            data = resp.json()
            if data.get("status") == "success":
                return data["data"]["result"]
            return []
        except Exception as e:
            logger.error("prometheus_query_failed", query=query, error=str(e))
            return []

    async def query_instant(self, query: str) -> List[Dict[str, Any]]:
        """Execute a Prometheus instant query."""
        try:
            resp = await self.client.get(
                f"{self.base_url}/api/v1/query",
                params={"query": query},
            )
            data = resp.json()
            if data.get("status") == "success":
                return data["data"]["result"]
            return []
        except Exception as e:
            logger.error("prometheus_instant_query_failed", query=query, error=str(e))
            return []

    async def fetch_incident_metrics(
        self,
        start: datetime,
        end: datetime,
        services: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Fetch all relevant metrics for incident RCA."""
        results = {}

        # Error rate
        error_rate_query = (
            'rate(http_requests_total{status=~"5.."}[5m])'
            if not services
            else f'rate(http_requests_total{{status=~"5..",service=~"{"|".join(services)}"}}[5m])'
        )
        results["error_rate"] = await self.query_range(error_rate_query, start, end)

        # Latency P99
        latency_query = (
            'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))'
        )
        results["latency_p99"] = await self.query_range(latency_query, start, end)

        # CPU usage
        results["cpu_usage"] = await self.query_range(
            'rate(process_cpu_seconds_total[5m])', start, end
        )

        # Memory usage
        results["memory_usage"] = await self.query_range(
            'process_resident_memory_bytes', start, end
        )

        # Detect metric anomalies
        results["anomalies"] = self._detect_anomalies(results)

        return results

    def _detect_anomalies(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Simple threshold-based anomaly detection."""
        anomalies = []

        error_rate_data = metrics.get("error_rate", [])
        for series in error_rate_data:
            values = [float(v[1]) for v in series.get("values", [])]
            if values:
                avg = sum(values) / len(values)
                if avg > 0.05:  # >5% error rate
                    anomalies.append({
                        "metric": "error_rate",
                        "severity": "critical" if avg > 0.2 else "high",
                        "average_value": avg,
                        "labels": series.get("metric", {}),
                        "description": f"High error rate detected: {avg:.1%} average",
                    })

        return anomalies

    async def close(self):
        await self.client.aclose()


prometheus_service = PrometheusService()
