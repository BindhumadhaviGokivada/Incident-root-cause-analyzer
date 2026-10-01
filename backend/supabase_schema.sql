-- Supabase Migration: Incident Root-Cause Analyzer Schema
-- Includes Row-Level Security (RLS) policies and Realtime publication

-- 1. Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    affected_services JSONB DEFAULT '[]'::jsonb,
    labels JSONB DEFAULT '{}'::jsonb,
    source VARCHAR(100) DEFAULT 'manual',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. RCA Analyses Table
CREATE TABLE IF NOT EXISTS public.rca_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    root_cause TEXT,
    root_cause_confidence FLOAT,
    contributing_factors JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    immediate_actions JSONB DEFAULT '[]'::jsonb,
    long_term_fixes JSONB DEFAULT '[]'::jsonb,
    prevention_measures JSONB DEFAULT '[]'::jsonb,
    postmortem_draft TEXT,
    llm_model VARCHAR(100),
    analysis_duration_ms INT,
    tokens_used INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Incident Evidence Table
CREATE TABLE IF NOT EXISTS public.incident_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    content JSONB NOT NULL,
    relevance_score FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rca_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_evidence ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all incidents
CREATE POLICY "Authenticated users can view incidents"
    ON public.incidents FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create and update incidents
CREATE POLICY "Authenticated users can create incidents"
    ON public.incidents FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update incidents"
    ON public.incidents FOR UPDATE
    TO authenticated
    USING (true);

-- Realtime Publication (Enables live UI sync when incidents change)
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rca_analyses;
