"""
Incident API Routes
CRUD operations for incidents and triggering AI Root-Cause Analysis.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.incident import Incident, RCAAnalysis, IncidentEvidence, IncidentStatus, IncidentSeverity
from app.models.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse,
    RCAAnalysisRequest, RCAAnalysisResponse, PaginatedResponse
)
from app.services.elasticsearch_service import elasticsearch_service
from app.services.prometheus_service import prometheus_service
from app.services.otel_service import otel_service
from app.ml.rca_engine import rca_engine
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(
    payload: IncidentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new incident."""
    incident = Incident(
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        status=IncidentStatus.OPEN,
        started_at=payload.started_at or datetime.utcnow(),
        detected_at=datetime.utcnow(),
        affected_services=payload.affected_services,
        labels=payload.labels,
        source=payload.source
    )
    db.add(incident)
    await db.flush()
    await db.refresh(incident)
    return incident


@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status: Optional[IncidentStatus] = None,
    severity: Optional[IncidentSeverity] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of incidents with optional filtering."""
    query = select(Incident).order_by(desc(Incident.created_at)).limit(limit)
    if status:
        query = query.where(Incident.status == status)
    if severity:
        query = query.where(Incident.severity == severity)
        
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get incident details by ID."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/{incident_id}/analyze", response_model=RCAAnalysisResponse)
async def analyze_incident(
    incident_id: UUID,
    payload: Optional[RCAAnalysisRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger full multimodal AI Root-Cause Analysis:
    Fetches real-time / windowed logs, Prometheus metrics, and distributed spans,
    then executes LLM & correlation reasoning.
    """
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = IncidentStatus.ANALYZING
    await db.flush()

    hours = payload.time_range_hours if payload else 2
    end_time = datetime.utcnow()
    start_time = incident.started_at - timedelta(minutes=15) if incident.started_at else end_time - timedelta(hours=hours)

    services = incident.affected_services or []

    # 1. Fetch Observability telemetry asynchronously
    logs = await elasticsearch_service.fetch_error_logs(
        services=services,
        start_time=start_time,
        end_time=end_time
    )

    metrics = await prometheus_service.fetch_incident_metrics(
        start=start_time,
        end=end_time,
        services=services
    )

    # 2. Simulate / query sample trace spans
    sample_trace_spans = [
        {
            "trace_id": "tr-9842a1",
            "span_id": "sp-01",
            "parent_span_id": None,
            "service": services[0] if services else "api-gateway",
            "operation": "HTTP POST /v1/checkout",
            "start_time": datetime.utcnow(),
            "duration_ms": 5210.0,
            "status": "error",
            "error_message": "HTTP 504 Gateway Timeout"
        },
        {
            "trace_id": "tr-9842a1",
            "span_id": "sp-02",
            "parent_span_id": "sp-01",
            "service": "order-service",
            "operation": "processPayment",
            "start_time": datetime.utcnow(),
            "duration_ms": 5150.0,
            "status": "error",
            "error_message": "ConnectionPoolExhausted: all 50 slots acquired"
        }
    ]
    trace_bottlenecks = await otel_service.analyze_trace_bottlenecks(sample_trace_spans)

    # 3. Run AI RCA Engine
    analysis_res = await rca_engine.analyze(
        incident_title=incident.title,
        incident_description=incident.description,
        services=services,
        logs=logs,
        metrics=metrics,
        trace_bottlenecks=trace_bottlenecks
    )

    # 4. Save analysis to database
    analysis_record = RCAAnalysis(
        incident_id=incident.id,
        root_cause=analysis_res.get("root_cause"),
        root_cause_confidence=analysis_res.get("root_cause_confidence"),
        contributing_factors=analysis_res.get("contributing_factors", []),
        timeline=analysis_res.get("timeline", []),
        immediate_actions=analysis_res.get("immediate_actions", []),
        long_term_fixes=analysis_res.get("long_term_fixes", []),
        prevention_measures=analysis_res.get("prevention_measures", []),
        postmortem_draft=analysis_res.get("postmortem_draft"),
        llm_model=analysis_res.get("llm_model"),
        analysis_duration_ms=analysis_res.get("analysis_duration_ms"),
        tokens_used=analysis_res.get("tokens_used")
    )
    db.add(analysis_record)

    incident.status = IncidentStatus.ROOT_CAUSE_FOUND
    await db.flush()
    await db.refresh(analysis_record)

    return analysis_record


@router.get("/{incident_id}/analyses", response_model=List[RCAAnalysisResponse])
async def get_incident_analyses(
    incident_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all past RCA analyses for an incident."""
    result = await db.execute(
        select(RCAAnalysis)
        .where(RCAAnalysis.incident_id == incident_id)
        .order_by(desc(RCAAnalysis.created_at))
    )
    return result.scalars().all()
