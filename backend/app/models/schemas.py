from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from app.models.incident import IncidentSeverity, IncidentStatus


# ─── Incident Schemas ────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: Optional[str] = None
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    started_at: Optional[datetime] = None
    affected_services: List[str] = Field(default_factory=list)
    labels: Dict[str, str] = Field(default_factory=dict)
    source: Optional[str] = "manual"


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    resolved_at: Optional[datetime] = None
    affected_services: Optional[List[str]] = None
    labels: Optional[Dict[str, str]] = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str]
    severity: IncidentSeverity
    status: IncidentStatus
    started_at: datetime
    detected_at: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    affected_services: List[str]
    labels: Dict[str, Any]
    source: Optional[str]


# ─── RCA Analysis Schemas ─────────────────────────────────────────────────────

class ContributingFactor(BaseModel):
    factor: str
    severity: str  # high / medium / low
    category: str  # infrastructure / application / deployment / network / database
    description: str
    evidence_refs: List[str] = Field(default_factory=list)


class TimelineEvent(BaseModel):
    timestamp: datetime
    event: str
    source: str
    impact: Optional[str] = None


class RCAAnalysisRequest(BaseModel):
    incident_id: UUID
    time_range_hours: int = Field(default=2, ge=1, le=48)
    services: Optional[List[str]] = None
    include_logs: bool = True
    include_metrics: bool = True
    include_traces: bool = True
    include_deployments: bool = True


class RCAAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    incident_id: UUID
    root_cause: Optional[str]
    root_cause_confidence: Optional[float]
    contributing_factors: List[ContributingFactor]
    timeline: List[TimelineEvent]
    immediate_actions: List[str]
    long_term_fixes: List[str]
    prevention_measures: List[str]
    postmortem_draft: Optional[str]
    llm_model: Optional[str]
    analysis_duration_ms: Optional[int]
    tokens_used: Optional[int]
    created_at: datetime


# ─── Observability Data Schemas ───────────────────────────────────────────────

class LogEntry(BaseModel):
    timestamp: datetime
    level: str  # ERROR, WARN, INFO, DEBUG
    service: str
    message: str
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    extra: Dict[str, Any] = Field(default_factory=dict)


class MetricDataPoint(BaseModel):
    timestamp: datetime
    metric_name: str
    value: float
    labels: Dict[str, str] = Field(default_factory=dict)


class TraceSpan(BaseModel):
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    service: str
    operation: str
    start_time: datetime
    duration_ms: float
    status: str  # ok / error / timeout
    error_message: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, str]
