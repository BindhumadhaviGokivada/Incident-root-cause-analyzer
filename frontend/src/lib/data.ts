/**
 * SINGLE SOURCE OF TRUTH for all display data.
 * Every page must import from here — no local duplicate arrays.
 */

export type ServiceStatus = 'critical' | 'warning' | 'healthy';
export type Severity = 'P1' | 'P2' | 'P3';

export interface ServiceHealth {
  name: string;
  desc: string;
  status: ServiceStatus;
  cpu: string;
  mem: string;
  err: string;
  p99: string;
  pods: string;
  note: string;
}

export const SERVICES: ServiceHealth[] = [
  { name: 'payment-service', desc: 'Payments, checkout & settlement', status: 'critical', cpu: '89%', mem: '74%', err: '14.2%', p99: '1,840ms', pods: '12/12 (3 crashloop)', note: 'Sev-1 Linked' },
  { name: 'api-gateway', desc: 'Edge ingress, rate limiting, SSL', status: 'warning', cpu: '62%', mem: '58%', err: '3.1%', p99: '620ms', pods: 'Throughput: 84k req/s', note: 'Degraded upstream' },
  { name: 'postgres-primary', desc: 'Aurora PG 15.4 Core Cluster', status: 'critical', cpu: '98% (Saturated)', mem: '94%', err: '4.2k IOPS', p99: '410ms', pods: 'Max Pool: 2,000 / 2,000', note: 'Pool Starvation' },
  { name: 'auth-service', desc: 'OAuth2, JWT tokens, Session Store', status: 'warning', cpu: '48%', mem: '65%', err: '1.8%', p99: '210ms', pods: 'Replicas: 8/8 Ready', note: 'Slow DB lookups' },
  { name: 'user-service', desc: 'Profile accounts, roles & RBAC', status: 'healthy', cpu: '32%', mem: '41%', err: '0.01%', p99: '45ms', pods: 'Replicas: 16/16', note: 'Nominal' },
  { name: 'notification-service', desc: 'Push, SMS, Webhooks & Email queue', status: 'healthy', cpu: '24%', mem: '38%', err: '0.00%', p99: '38ms', pods: 'Worker Threads: 64 OK', note: 'Nominal' },
  { name: 'redis-cluster', desc: 'L2 Distributed Cache Cluster', status: 'healthy', cpu: '99.2% hit', mem: '44%', err: '142k ops/s', p99: '1.8ms', pods: 'Nodes: 6 Shards (All Sync)', note: 'Nominal' },
  { name: 'kafka-pipeline', desc: 'Event streaming backplane & CDC', status: 'healthy', cpu: '124 msgs lag', mem: '48k msg/s', err: '128 Sync', p99: '34 MB/s', pods: 'Brokers: 5 Active', note: 'Nominal' },
];

export interface Finding {
  conf: number;
  signals: string;
  text: string;
  label: string;
  action: string;
}

export const FINDINGS: Finding[] = [
  { conf: 91, signals: '12 signals', text: 'Payment service degradation is strongly correlated with database connection pool exhaustion.', label: 'Primary Fault Hypothesis', action: 'Inspect RCA Graph' },
  { conf: 94, signals: '4 commit diffs', text: 'Recent deployment v2.8.1 occurred 7 minutes before the error spike in payment-service.', label: 'Trigger Event', action: 'Inspect Deployment' },
  { conf: 89, signals: '27 trace spans', text: 'PostgreSQL is currently the primary bottleneck in the payment request path.', label: 'Bottleneck Node', action: 'View Trace Waterfall' },
];

export interface LogEntry {
  time: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service: string;
  msg: string;
}

export const LOGS: LogEntry[] = [
  { time: '14:21:03.841', level: 'ERROR', service: 'payment-service', msg: 'ConnectionTimeoutError: pool exhausted after 30000ms' },
  { time: '14:21:03.792', level: 'ERROR', service: 'payment-service', msg: 'acquire_connection timeout: no available slots in pool (max=100)' },
  { time: '14:21:02.114', level: 'WARN', service: 'postgres-primary', msg: 'pg_stat_activity: 98 connections active (threshold: 90)' },
  { time: '14:21:01.441', level: 'ERROR', service: 'payment-service', msg: 'HTTP 500: POST /api/v1/payments failed — upstream DB unreachable' },
  { time: '14:20:58.001', level: 'INFO', service: 'api-gateway', msg: 'Upstream timeout: payment-service responded in 30041ms > threshold 5000ms' },
  { time: '14:20:55.312', level: 'WARN', service: 'auth-service', msg: 'JWT validation latency elevated: 210ms (SLA: 50ms)' },
  { time: '14:20:52.098', level: 'ERROR', service: 'payment-service', msg: 'ConnectionTimeoutError: pool exhausted after 30000ms' },
  { time: '14:20:48.774', level: 'INFO', service: 'kafka-pipeline', msg: 'Consumer group lag: 124 messages (normal range < 500)' },
];

export interface MetricSeries {
  label: string;
  color: string;
  path: string;
  peak: string;
}

export const METRIC_SERIES: MetricSeries[] = [
  { label: 'Payment Error Rate (%)', color: '#ffb4ab', path: 'M0,60 L40,58 L80,56 L120,48 L160,30 L200,12 L240,4', peak: '14.2%' },
  { label: 'DB Connections (%)', color: '#adc6ff', path: 'M0,55 L50,54 L100,50 L140,42 L180,20 L220,8 L260,3', peak: '98%' },
  { label: 'P99 Latency (ms)', color: '#d0bcff', path: 'M0,58 L50,57 L100,54 L150,45 L190,28 L230,14 L260,7', peak: '1,840ms' },
];

export interface TraceSpan {
  service: string;
  op: string;
  dur: number;
  offset: number;
  color: string;
}

export const TRACE_SPANS: TraceSpan[] = [
  { service: 'api-gateway', op: 'POST /payments', dur: 30041, offset: 0, color: 'bg-primary/60' },
  { service: 'payment-service', op: 'process_payment()', dur: 29990, offset: 20, color: 'bg-secondary/60' },
  { service: 'postgres-primary', op: 'acquire_connection', dur: 29850, offset: 80, color: 'bg-error/80' },
  { service: 'postgres-primary', op: 'BEGIN TRANSACTION', dur: 0, offset: 29900, color: 'bg-outline/40' },
  { service: 'payment-service', op: 'emit_kafka_event()', dur: 12, offset: 29960, color: 'bg-tertiary/60' },
];

export interface TopologyNode {
  id: string;
  name: string;
  icon: string;
  type: string;
  status: ServiceStatus;
  metrics: { label: string; value: string }[];
  note?: string;
}

export const TOPOLOGY_NODES: TopologyNode[] = [
  { id: 'ingress', name: 'Cloudflare / ALB', icon: 'cloud', type: 'Ingress', status: 'healthy', metrics: [{ label: 'RPS', value: '14.8k' }, { label: 'Latency', value: '12ms' }] },
  { id: 'api-gateway', name: 'Envoy API Gateway', icon: 'router', type: 'Gateway', status: 'warning', metrics: [{ label: 'RPS', value: '14.8k' }, { label: 'Error', value: '3.1%' }], note: 'Circuit Breaker: Open' },
  { id: 'auth-service', name: 'auth-service', icon: 'lock', type: 'Service', status: 'warning', metrics: [{ label: 'RPS', value: '2.1k' }, { label: 'P99', value: '210ms' }], note: 'Slow DB lookups' },
  { id: 'payment-service', name: 'payment-service', icon: 'payments', type: 'Service (Critical Path)', status: 'critical', metrics: [{ label: 'RPS', value: '3.6k' }, { label: 'Error', value: '14.2%' }], note: 'Sev-1 Degraded' },
  { id: 'order-service', name: 'order-service', icon: 'shopping_cart', type: 'Service', status: 'healthy', metrics: [{ label: 'RPS', value: '11.4k' }, { label: 'P99', value: '32ms' }] },
  { id: 'user-service', name: 'user-service', icon: 'person', type: 'Service', status: 'healthy', metrics: [{ label: 'RPS', value: '4.2k' }, { label: 'P99', value: '45ms' }] },
  { id: 'postgres-primary', name: 'postgres-primary', icon: 'database', type: 'Database (Root Cause)', status: 'critical', metrics: [{ label: 'Conn', value: '98%' }, { label: 'CPU', value: '94%' }], note: 'Pool Starvation ← Root Cause' },
  { id: 'redis-cluster', name: 'redis-cluster', icon: 'memory', type: 'Cache', status: 'healthy', metrics: [{ label: 'Hit', value: '99.2%' }, { label: 'P99', value: '1.8ms' }] },
  { id: 'kafka-pipeline', name: 'kafka-pipeline', icon: 'stream', type: 'Event Streaming', status: 'healthy', metrics: [{ label: 'Lag', value: '124 msgs' }, { label: 'Thru', value: '48k/s' }] },
];

export const TOPOLOGY_EDGES = [
  { from: 'ingress', to: 'api-gateway' },
  { from: 'api-gateway', to: 'auth-service' },
  { from: 'api-gateway', to: 'payment-service' },
  { from: 'api-gateway', to: 'order-service' },
  { from: 'payment-service', to: 'postgres-primary' },
  { from: 'auth-service', to: 'postgres-primary' },
  { from: 'order-service', to: 'user-service' },
  { from: 'payment-service', to: 'redis-cluster' },
  { from: 'payment-service', to: 'kafka-pipeline' },
  { from: 'order-service', to: 'kafka-pipeline' },
];

export const TOPOLOGY_TIERS: string[][] = [
  ['ingress'],
  ['api-gateway'],
  ['auth-service', 'payment-service', 'order-service', 'user-service'],
  ['postgres-primary', 'redis-cluster', 'kafka-pipeline'],
];

export interface Deployment {
  id: string;
  service: string;
  version: string;
  author: string;
  at: string;
  status: 'healthy' | 'suspect' | 'rolled-back';
  changes: number;
  risk: 'low' | 'medium' | 'high';
}

export const DEPLOYMENTS: Deployment[] = [
  { id: 'dep-8812', service: 'payment-service', version: 'v2.8.1', author: '@dev-lead', at: '7m before spike', status: 'suspect', changes: 14, risk: 'high' },
  { id: 'dep-8810', service: 'api-gateway', version: 'v1.44.0', author: '@platform', at: '2h ago', status: 'healthy', changes: 6, risk: 'low' },
  { id: 'dep-8807', service: 'auth-service', version: 'v3.2.1', author: '@identity', at: '6h ago', status: 'healthy', changes: 3, risk: 'low' },
  { id: 'dep-8801', service: 'payment-service', version: 'v2.8.0', author: '@dev-lead', at: '2d ago', status: 'rolled-back', changes: 9, risk: 'medium' },
];

export interface Slo {
  name: string;
  target: string;
  current: string;
  burn: number;
  status: 'healthy' | 'warning' | 'breaching';
}

export const SLOS: Slo[] = [
  { name: 'Checkout availability', target: '99.95%', current: '99.94%', burn: 2.4, status: 'warning' },
  { name: 'Payment p99 < 500ms', target: '99.00%', current: '96.20%', burn: 6.1, status: 'breaching' },
  { name: 'Auth success rate', target: '99.90%', current: '99.97%', burn: 0.4, status: 'healthy' },
  { name: 'Ingest freshness < 60s', target: '99.50%', current: '99.81%', burn: 0.6, status: 'healthy' },
];

export const TIME_RANGES = ['Last 15m', 'Last 1h', 'Last 6h', 'Last 24h', 'Last 7d'] as const;

export const CAUSAL_STEPS = [
  { num: '01', title: 'PostgreSQL Connection Saturation', time: 'T+03m after deploy', desc: 'Database connection utilization 61% → 98% within 180s of v2.8.1 rollout.' },
  { num: '02', title: 'Thread Blocking & Latency Cascades', time: 'T+05m', desc: 'Payment-service latency rose as workers blocked on connection acquisition.' },
  { num: '03', title: 'Span Bottleneck Isolation', time: 'OpenTelemetry', desc: 'acquire_connection dominates 94% of failing requests.' },
  { num: '04', title: 'Exhaustion Log Signatures', time: '1,842 hits', desc: '"ConnectionTimeoutError: pool exhausted" across payment-service.' },
  { num: '05', title: 'Code Commit Causal Trigger', time: 'Commit #a7f82c9', desc: 'v2.8.1 changed transaction isolation without pool adjustments.' },
];

export const CONFIDENCE_VECTORS = [
  { label: 'Temporal Alignment', val: 98 },
  { label: 'Error Signature', val: 94 },
  { label: 'Trace Bottleneck', val: 92 },
  { label: 'Code Diff Relevance', val: 81 },
];

export const EVIDENCE_SOURCES = [
  { icon: 'subject', name: 'Elasticsearch', count: '1,842 events', desc: 'filter: "ConnectionTimeoutError: pool exhausted"', action: 'Query cluster logs' },
  { icon: 'ssid_chart', name: 'Prometheus', count: '5 anomalies', desc: 'Z-score > 3.8 on pg_stat_activity', action: 'View metric curves' },
  { icon: 'account_tree', name: 'OpenTelemetry', count: '27 traces', desc: 'Bottleneck: db.query on "payments" (avg 1.72s)', action: 'Open trace waterfall' },
  { icon: 'commit', name: 'Git / CI-CD', count: '7m prior', desc: 'Release v2.8.1 merged by @dev-lead', action: 'Inspect commit diffs' },
];
