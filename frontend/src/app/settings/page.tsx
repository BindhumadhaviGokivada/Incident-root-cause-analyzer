'use client';

import React, { useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { useApp } from '@/lib/app-store';
import { cx, copyToClipboard } from '@/lib/format';

const INTEGRATIONS = [
  { icon: 'database', label: 'Supabase PostgreSQL', detail: 'project-ref · us-east-1' },
  { icon: 'subject', label: 'Elasticsearch (Logs)', detail: 'cluster: es-omega-prod · 3 nodes' },
  { icon: 'ssid_chart', label: 'Prometheus (Metrics)', detail: 'prometheus.prod.internal:9090' },
  { icon: 'account_tree', label: 'OpenTelemetry (Traces)', detail: 'collector: otel-gateway:4317' },
  { icon: 'psychology', label: 'DeepRCA AI Engine', detail: 'Model: DeepRCA-70B-SRE · GPU cluster' },
  { icon: 'notifications', label: 'PagerDuty (Alerts)', detail: 'Service key: ••••••xk29' },
  { icon: 'commit', label: 'GitHub (CI/CD)', detail: 'org: acme-corp · Webhooks active' },
];

const ENV_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', val: 'https://•••.supabase.co', masked: false },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', val: '•••••••• (masked)', masked: true },
  { key: 'DEEPRCA_API_KEY', val: '•••••••• (masked)', masked: true },
  { key: 'PROMETHEUS_ENDPOINT', val: 'http://prometheus.prod.internal:9090', masked: false },
  { key: 'OTEL_EXPORTER_ENDPOINT', val: 'http://otel-gateway:4317', masked: false },
];

const SECTIONS = ['Integrations', 'Environment', 'Alert Rules', 'AI Engine'] as const;

export default function SettingsPage() {
  const { toast, logAudit } = useApp();
  const [tab, setTab] = useState(0);
  const [testing, setTesting] = useState<string | null>(null);
  const [rules, setRules] = useState([
    { name: 'Payment Error Rate > 5%', target: 'payment-service', threshold: '5%', status: 'firing', severity: 'P1', enabled: true },
    { name: 'DB Connection Pool > 90%', target: 'postgres-primary', threshold: '90%', status: 'firing', severity: 'P1', enabled: true },
    { name: 'API Gateway P99 > 500ms', target: 'api-gateway', threshold: '500ms', status: 'pending', severity: 'P2', enabled: true },
    { name: 'Auth Service Error > 2%', target: 'auth-service', threshold: '2%', status: 'inactive', severity: 'P3', enabled: false },
  ]);
  const [threshold, setThreshold] = useState(70);

  const testConn = (label: string) => {
    setTesting(label);
    window.setTimeout(() => {
      setTesting(null);
      logAudit('integration.tested', label);
      toast('success', `${label}: reachable`, 'p99 38ms · TLS OK');
    }, 800);
  };

  return (
    <AppShell breadcrumb="Settings">
      <div>
        <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">Configuration</span>
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">Platform Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Connections, secrets handling, alert rules, and AI tuning — all audited.</p>
      </div>

      <div className="flex items-center gap-1 border-b border-outline-variant/30" role="tablist" aria-label="Settings sections">
        {SECTIONS.map((s, i) => (
          <button key={s} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={cx('px-4 py-2.5 font-body-md text-body-md font-medium transition-colors border-b-2 -mb-px', tab === i ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface')}>{s}</button>
        ))}
      </div>

      {tab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INTEGRATIONS.map((it) => (
            <div key={it.label} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0" aria-hidden>
                  <span className="material-symbols-outlined text-[20px] text-tertiary">{it.icon}</span>
                </span>
                <div className="min-w-0">
                  <div className="font-body-md text-body-md text-on-surface font-semibold truncate">{it.label}</div>
                  <div className="font-mono-data-xs text-mono-data-xs text-outline truncate">{it.detail}</div>
                </div>
              </div>
              <button onClick={() => testConn(it.label)} disabled={testing !== null} className="btn-secondary shrink-0 disabled:opacity-50">
                {testing === it.label ? 'Testing…' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 1 && (
        <section className="card space-y-3" aria-label="Environment variables">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Environment variables</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Secrets are masked and never logged. Values read from the deployment environment.</p>
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/20">
            {ENV_VARS.map((e) => (
              <div key={e.key} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] gap-2 px-4 py-2.5 border-b border-outline-variant/10 items-center">
                <span className="font-mono-code-sm text-mono-code-sm text-primary break-all">{e.key}</span>
                <span className="font-mono-code-sm text-mono-code-sm text-outline truncate hidden sm:block">{e.val}</span>
                <button
                  className="btn-ghost text-[12px] px-2 py-1"
                  onClick={async () => { const ok = await copyToClipboard(e.key); toast(ok ? 'success' : 'error', ok ? `${e.key} key name copied` : 'Copy failed', e.masked ? 'Value stays masked' : undefined); }}
                >
                  Copy key
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 2 && (
        <section className="card space-y-3" aria-label="Alert rules">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Alert rules</h2>
            <button className="btn-primary" onClick={() => toast('info', 'Rule builder opened', 'PromQL + threshold + runbook link')}><span className="material-symbols-outlined text-[16px]" aria-hidden>add</span><span>New Rule</span></button>
          </div>
          {rules.map((r, i) => (
            <div key={r.name} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cx('font-label-caps text-label-caps px-1.5 py-0.5 rounded font-bold shrink-0', r.severity === 'P1' ? 'bg-error-container/40 text-error' : 'bg-secondary-container text-secondary')}>{r.severity}</span>
                <div className="min-w-0">
                  <div className="font-body-md text-body-md text-on-surface font-semibold truncate">{r.name}</div>
                  <div className="font-mono-data-xs text-mono-data-xs text-outline">{r.target} · {r.threshold} · {r.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  role="switch" aria-checked={r.enabled} aria-label={`Enable ${r.name}`}
                  onClick={() => { const next = rules.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)); setRules(next); logAudit('alert.toggled', `${r.name} → ${!r.enabled ? 'on' : 'off'}`); }}
                  className={cx('w-10 h-5.5 h-6 rounded-full p-0.5 transition-colors', r.enabled ? 'bg-tertiary' : 'bg-surface-container-highest')}
                >
                  <span className={cx('block w-5 h-5 rounded-full bg-white transition-transform', r.enabled ? 'translate-x-4' : 'translate-x-0')} aria-hidden />
                </button>
                <button className="btn-ghost text-[12px] px-2 py-1" onClick={() => toast('info', `Editing ${r.name}`)}>Edit</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 3 && (
        <section className="card space-y-3" aria-label="AI engine">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">AI RCA engine tuning</h2>
          <label className="block max-w-md">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Minimum confidence to auto-page ({threshold}%) — below this goes to human review.</span>
            <input type="range" min={50} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full mt-2 accent-[#adc6ff]" aria-label="Minimum confidence threshold" />
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'Model', value: 'DeepRCA-70B-SRE' },
              { label: 'Lookback', value: '2 hours' },
              { label: 'Signals', value: '8 max' },
              { label: 'Timeout', value: '5s fallback' },
              { label: 'Auto-remediation', value: 'Advisory only' },
              { label: 'Threshold', value: `${threshold}%` },
            ].map((x) => (
              <div key={x.label} className="bg-surface-container-lowest p-3 rounded-lg">
                <div className="font-label-caps text-label-caps text-outline uppercase">{x.label}</div>
                <div className="font-mono-metric-md text-mono-metric-md text-secondary font-bold mt-1">{x.value}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { logAudit('ai.tuned', `threshold → ${threshold}%`); toast('success', 'AI config saved', `Threshold ${threshold}% · audited`); }}>Save AI config</button>
        </section>
      )}
    </AppShell>
  );
}
