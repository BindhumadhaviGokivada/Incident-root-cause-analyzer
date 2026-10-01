export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'analyzing' | 'root_cause_found' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  started_at: string;
  detected_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  affected_services: string[];
  labels: Record<string, string>;
  source?: string;
}

export interface ContributingFactor {
  factor: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  source: string;
  impact?: string;
}

export interface RCAAnalysis {
  id: string;
  incident_id: string;
  root_cause: string;
  root_cause_confidence: number;
  contributing_factors: ContributingFactor[];
  timeline: TimelineEvent[];
  immediate_actions: string[];
  long_term_fixes: string[];
  prevention_measures: string[];
  postmortem_draft: string;
  llm_model?: string;
  analysis_duration_ms?: number;
  tokens_used?: number;
  created_at: string;
}

export interface ServiceTopology {
  nodes: { id: string; name: string }[];
  edges: { source: string; target: string }[];
}
