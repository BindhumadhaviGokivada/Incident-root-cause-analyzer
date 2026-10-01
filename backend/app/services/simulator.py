"""
Observability Mock Ingest Engine & Incident Simulator
Generates realistic logs, Prometheus metric time-series, and OpenTelemetry trace spans.
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random

SAMPLE_SERVICES = [
    "api-gateway",
    "order-service",
    "payment-service",
    "inventory-service",
    "auth-service",
    "postgres-cluster",
    "redis-cache"
]

ERROR_TEMPLATES = [
    ("order-service", "Connection acquisition timed out after 5000ms: max_pool_size (50) exhausted", "DBConnectionTimeoutException"),
    ("payment-service", "Payment processor gateway unreachable: HTTP 504 from upstream provider", "GatewayTimeoutException"),
    ("api-gateway", "Circuit breaker opened for route /v1/checkout due to high error threshold (>25%)", "CircuitBreakerOpenException"),
    ("inventory-service", "Deadlock detected on resource row lock id: sku_9812401", "DatabaseDeadlockException"),
    ("auth-service", "Redis connection refused on redis-cluster-node-02.prod.internal:6379", "RedisConnectionError")
]


class IncidentSimulator:
    def __init__(self):
        pass

    def generate_incident_scenario(
        self,
        scenario_type: str = "db_pool_exhaustion"
    ) -> Dict[str, Any]:
        """
        Creates a coherent multi-signal incident dataset:
        1. Logs reflecting the cascading failure
        2. Metric spikes matching the failure timeline
        3. Distributed traces with high-latency bottleneck spans
        """
        now = datetime.utcnow()

        # 1. Synthesize Error Logs
        logs = []
        for i in range(20):
            ts = now - timedelta(minutes=random.randint(1, 15), seconds=random.randint(0, 59))
            service, msg, exc = random.choice(ERROR_TEMPLATES)
            logs.append({
                "timestamp": ts.isoformat(),
                "level": "ERROR" if random.random() > 0.2 else "WARN",
                "service": service,
                "message": msg,
                "trace_id": f"tr-{random.randint(100000, 999999):x}",
                "span_id": f"sp-{random.randint(1000, 9999):x}",
                "exception": exc
            })
        logs.sort(key=lambda x: x["timestamp"])

        # 2. Synthesize Prometheus Metrics (Latency p99 & 5xx Error Rate)
        metric_points = []
        for minute_offset in range(15, 0, -1):
            ts = now - timedelta(minutes=minute_offset)
            # Latency curve (spikes at minute 8-2)
            latency = 120 + (random.uniform(2500, 5200) if 2 <= minute_offset <= 9 else random.uniform(20, 80))
            error_rate = random.uniform(0.18, 0.42) if 2 <= minute_offset <= 9 else random.uniform(0.001, 0.01)
            metric_points.append({
                "timestamp": ts.isoformat(),
                "latency_p99_ms": round(latency, 2),
                "error_rate_percent": round(error_rate * 100, 2),
                "cpu_usage_percent": round(random.uniform(75, 96) if 2 <= minute_offset <= 9 else random.uniform(20, 45), 1)
            })

        # 3. Synthesize Distributed Waterfall Traces
        trace_id = f"tr-{random.randint(100000, 999999):x}"
        spans = [
            {
                "trace_id": trace_id,
                "span_id": "span-01",
                "parent_span_id": None,
                "service": "api-gateway",
                "operation": "POST /v1/checkout",
                "duration_ms": 5240.0,
                "status": "error",
                "error_message": "504 Gateway Timeout"
            },
            {
                "trace_id": trace_id,
                "span_id": "span-02",
                "parent_span_id": "span-01",
                "service": "order-service",
                "operation": "OrderController::createOrder",
                "duration_ms": 5190.0,
                "status": "error",
                "error_message": "PoolAcquisitionTimeoutException"
            },
            {
                "trace_id": trace_id,
                "span_id": "span-03",
                "parent_span_id": "span-02",
                "service": "postgres-cluster",
                "operation": "SELECT * FROM inventory FOR UPDATE",
                "duration_ms": 5000.0,
                "status": "timeout",
                "error_message": "Query timed out after 5000ms"
            }
        ]

        return {
            "scenario": scenario_type,
            "generated_at": now.isoformat(),
            "logs": logs,
            "metrics": metric_points,
            "traces": spans
        }


incident_simulator = IncidentSimulator()
