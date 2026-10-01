"""
Telemetry & OpenTelemetry Trace Ingestion Service
Handles trace data aggregation, dependency graph construction, and latency bottleneck discovery.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.logging import get_logger

logger = get_logger(__name__)


class OpenTelemetryService:
    def __init__(self):
        pass

    async def analyze_trace_bottlenecks(
        self,
        trace_spans: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Analyze spans in distributed traces to find:
        1. Root error span (where failure originated)
        2. High-latency bottlenecks (p95 outliers)
        3. Cascading failure paths
        """
        if not trace_spans:
            return []

        bottlenecks = []
        error_spans = [s for s in trace_spans if s.get("status") in ["error", "500", "503", "timeout"]]

        # Find spans with highest duration
        sorted_by_duration = sorted(trace_spans, key=lambda x: x.get("duration_ms", 0), reverse=True)
        top_slowest = sorted_by_duration[:5]

        for s in top_slowest:
            bottlenecks.append({
                "type": "latency_bottleneck",
                "service": s.get("service"),
                "operation": s.get("operation"),
                "duration_ms": s.get("duration_ms"),
                "trace_id": s.get("trace_id"),
                "span_id": s.get("span_id"),
                "description": f"Service '{s.get('service')}' operation '{s.get('operation')}' took {s.get('duration_ms')}ms"
            })

        for err in error_spans:
            bottlenecks.append({
                "type": "error_origin",
                "service": err.get("service"),
                "operation": err.get("operation"),
                "trace_id": err.get("trace_id"),
                "span_id": err.get("span_id"),
                "error_message": err.get("error_message") or "Unknown span error",
                "description": f"Error triggered in {err.get('service')}:{err.get('operation')}"
            })

        return bottlenecks

    def build_service_dependency_graph(
        self,
        trace_spans: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Construct nodes and directed edges between microservices based on parent/child span relations.
        """
        nodes = set()
        edges = []
        span_lookup = {s["span_id"]: s for s in trace_spans if "span_id" in s}

        for s in trace_spans:
            svc = s.get("service")
            if svc:
                nodes.add(svc)

            parent_id = s.get("parent_span_id")
            if parent_id and parent_id in span_lookup:
                parent_svc = span_lookup[parent_id].get("service")
                if parent_svc and svc and parent_svc != svc:
                    edge = {"source": parent_svc, "target": svc}
                    if edge not in edges:
                        edges.append(edge)

        return {
            "nodes": [{"id": node, "name": node} for node in sorted(nodes)],
            "edges": edges
        }


otel_service = OpenTelemetryService()
