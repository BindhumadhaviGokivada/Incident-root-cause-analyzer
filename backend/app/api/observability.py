"""
Observability Telemetry API Routes
Provides live queries to Prometheus, Elasticsearch, and OpenTelemetry for dashboard visualization.
"""
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
from typing import List, Optional
from app.services.prometheus_service import prometheus_service
from app.services.elasticsearch_service import elasticsearch_service
from app.services.otel_service import otel_service
from app.services.simulator import incident_simulator

router = APIRouter(prefix="/observability", tags=["observability"])


@router.post("/simulate", summary="Generate synthetic telemetry scenario")
async def simulate_telemetry_scenario(scenario: str = Query("db_pool_exhaustion")):
    """Generates synthetic multi-signal telemetry (logs, metrics, traces) for instant RCA testing."""
    return incident_simulator.generate_incident_scenario(scenario_type=scenario)


@router.get("/metrics/summary")
async def get_metrics_summary(
    hours: int = Query(2, ge=1, le=24),
    services: Optional[str] = None
):
    """Retrieve Prometheus metrics overview."""
    end = datetime.utcnow()
    start = end - timedelta(hours=hours)
    svc_list = [s.strip() for s in services.split(",")] if services else None
    return await prometheus_service.fetch_incident_metrics(start=start, end=end, services=svc_list)


@router.get("/logs/errors")
async def get_error_logs(
    hours: int = Query(2, ge=1, le=24),
    services: Optional[str] = None,
    limit: int = Query(100, ge=10, le=500)
):
    """Retrieve aggregated error logs from Elasticsearch."""
    end = datetime.utcnow()
    start = end - timedelta(hours=hours)
    svc_list = [s.strip() for s in services.split(",")] if services else None
    return await elasticsearch_service.fetch_error_logs(
        services=svc_list,
        start_time=start,
        end_time=end,
        size=limit
    )


@router.get("/traces/topology")
async def get_service_topology():
    """Retrieve service dependency map derived from distributed trace spans."""
    mock_spans = [
        {"span_id": "1", "parent_span_id": None, "service": "api-gateway"},
        {"span_id": "2", "parent_span_id": "1", "service": "auth-service"},
        {"span_id": "3", "parent_span_id": "1", "service": "order-service"},
        {"span_id": "4", "parent_span_id": "3", "service": "payment-service"},
        {"span_id": "5", "parent_span_id": "3", "service": "inventory-service"},
        {"span_id": "6", "parent_span_id": "3", "service": "postgres-cluster"},
        {"span_id": "7", "parent_span_id": "4", "service": "stripe-connector"}
    ]
    return otel_service.build_service_dependency_graph(mock_spans)
