import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Float, JSON, Integer, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class IncidentSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    ANALYZING = "analyzing"
    ROOT_CAUSE_FOUND = "root_cause_found"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(SQLEnum(IncidentSeverity), nullable=False, default=IncidentSeverity.MEDIUM)
    status = Column(SQLEnum(IncidentStatus), nullable=False, default=IncidentStatus.OPEN)

    # Time tracking
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    detected_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Affected services
    affected_services = Column(JSON, nullable=True, default=list)

    # Metadata
    labels = Column(JSON, nullable=True, default=dict)
    source = Column(String(100), nullable=True)  # e.g., "pagerduty", "manual", "prometheus"

    # Relationships
    analyses = relationship("RCAAnalysis", back_populates="incident", cascade="all, delete-orphan")
    evidence = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")


class RCAAnalysis(Base):
    __tablename__ = "rca_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)

    # AI Analysis Results
    root_cause = Column(Text, nullable=True)
    root_cause_confidence = Column(Float, nullable=True)  # 0.0 - 1.0
    contributing_factors = Column(JSON, nullable=True, default=list)
    timeline = Column(JSON, nullable=True, default=list)

    # Recommendations
    immediate_actions = Column(JSON, nullable=True, default=list)
    long_term_fixes = Column(JSON, nullable=True, default=list)
    prevention_measures = Column(JSON, nullable=True, default=list)

    # Postmortem draft
    postmortem_draft = Column(Text, nullable=True)

    # Analysis metadata
    llm_model = Column(String(100), nullable=True)
    analysis_duration_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="analyses")


class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=False)

    evidence_type = Column(String(50), nullable=False)  # log, metric, trace, deployment
    source = Column(String(100), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    content = Column(JSON, nullable=False)
    relevance_score = Column(Float, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="evidence")
