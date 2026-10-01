'use client';

import React, { useMemo, useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { useApp } from '@/lib/app-store';
import { CAUSAL_STEPS, CONFIDENCE_VECTORS, EVIDENCE_SOURCES } from '@/lib/data';
import { downloadFile, copyToClipboard, cx } from '@/lib/format';

const MODES = [
  { icon: 'psychology', label: 'Automated Synthesis' },
  { icon: 'hub', label: 'Evidence Correlator' },
  { icon: 'science', label: 'Hypothesis Testing' },
  { icon: 'history_toggle_off', label: 'Timeline Reconstruction' },
];

const HYPOTHESES = [
  { name: 'Pool exhaustion (primary)', conf: 91, status: 'supported', detail: '12 converging signals · temporal + error + trace agree' },
  { name: 'Bad deploy v2.8.1 trigger', conf: 88, status: 'supported', detail: '7m lead time · commit #a7f82c9 touched isolation' },
  { name: 'Downstream Kafka lag cascade', conf: 22, status: 'rejected', detail: 'Lag 124 msgs is nominal (<500) — excluded' },
  { name: 'Cache stampede via Redis', conf: 11, status: 'rejected', detail: '99.2% hit rate — excluded' },
];

const TIMELINE = [
  { t: '13:58', src: 'Git / CI-CD', text: 'v2.8.1 merged by @dev-lead (#a7f82c9)', impact: 'Trigger' },
  { t: '14:05', src: 'Prometheus', text: 'pg_stat_activity 61% → 82% in 120s', impact: 'Early warning' },
  { t: '14:08', src: 'PostgreSQL', text: 'Connections hit 98% — pool saturated', impact: 'Root cause' },
  { t: '14:10', src: 'OpenTelemetry', text: 'acquire_connection dominates 94% of spans', impact: 'Bottleneck' },
  { t: '14:12', src: 'Elasticsearch', text: '1,842 pool-exhausted errors indexed', impact: 'Customer impact' },
  { t: '14:15', src: 'AI Engine', text: 'DeepRCA synthesis: 91% pool exhaustion', impact: 'Diagnosis' },
];

export default function RCAAnalysisPage() {
  const { toast, logAudit, incidents, updateIncident } = useApp();
  const [activeMode, setActiveMode] = useState(0);
  const [activeInc, setActiveInc] = useState('INC-1042');
  const [testing, setTesting] = useState<string | null>(null);
  const [remediating, setRemediating] = useState<string | null>(null);

  const postmortem = useMemo(
    () => `# Postmortem: Payment API 500 Outage (${activeInc})\n\n**Severity:** P1 · **Duration:** 18m 42s · **Confidence:** 91%\n\n## Root cause\nPostgreSQL connection pool exhaustion (61% → 98%) after v2.8.1 (#a7f82c9).\n\n## Timeline\n${TIMELINE.map((e) => `- **${e.t}** [${e.src}] ${e.text}`).join('\n')}\n\n## Actions\n1. Roll back v2.8.1 via ArgoCD (~90s).\n2. Hot-patch pool max 100 → 250 + kill idle.\n3. Route reads to replica.\n4. Add >90% saturation alert.\n`,
    [activeInc]
  );

  const runRemediation = (label: string) => {
    setRemediating(label);
    window.setTimeout(() => {
      setRemediating(null);
      logAudit('remediation.executed', `${label} for ${activeInc}`);
      toast('success', `${label} initiated`, 'Track progress in Deployments');
    }, 900);
  };

  const exportMD = () => {
    downloadFile(`postmortem-${activeInc.toLowerCase()}.md`, postmortem);
    toast('success', 'Postmortem exported', 'Markdown downloaded · use Print for PDF');
  };

  return (
    <AppShell breadcrumb={`RCA Analysis · ${activeInc}`}>
      {/* Command bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 p-3 bg-surface-container rounded-xl shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-mono-data-xs text-mono-data-xs text-on-surface-variant">
            <span>IncidentRootAI</span><span className="text-outline">/</span><span>RCA Analysis</span><span className="text-outline">/</span>
            <span className="text-secondary font-semibold">{activeInc}</span>
          </nav>
          <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg" role="group" aria-label="Switch incident">
            {[{ id: 'INC-1042', sev: 'P1' }, { id: 'INC-1039', sev: 'P2' }, { id: 'INC-1035', sev: 'P3' }].map((inc) => (
              <button key={inc.id} onClick={() => setActiveInc(inc.id)} aria-pressed={activeInc === inc.id} className={cx('flex items-center gap-1 px-2.5 py-1 rounded font-mono-metric-md text-mono-metric-md transition-colors', activeInc === inc.id ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}>
                {activeInc === inc.id && <span className="w-2 h-2 rounded-full bg-error animate-ping" aria-hidden />}
                <span>{inc.id}</span>
                <span className={cx('font-label-caps text-label-caps px-1 rounded', activeInc === inc.id ? 'bg-error-container text-on-error-container' : 'bg-surface-container-highest text-on-surface-variant')}>{inc.sev}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg overflow-x-auto" role="tablist" aria-label="Analysis mode">
          {MODES.map((tab, i) => (
            <button key={tab.label} role="tab" aria-selected={activeMode === i} onClick={() => setActiveMode(i)} className={cx('flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body-sm text-body-sm transition-colors whitespace-nowrap', activeMode === i ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}>
              <span className="material-symbols-outlined text-[16px]" aria-hidden>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: context */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <section className="relative overflow-hidden bg-surface-container-low rounded-xl p-4 shadow-md" aria-label="Incident summary">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-error/10 rounded-full blur-2xl pointer-events-none" aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-metric-md text-mono-metric-md text-error font-bold">{activeInc}</span>
                  <span className="px-2 py-0.5 rounded font-label-caps text-label-caps bg-error-container text-on-error-container uppercase">Critical Severity</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-1">Payment API 500 Outage</h2>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono-data-xs text-mono-data-xs text-outline uppercase tracking-wider">Duration</span>
                <span className="font-mono-metric-md text-mono-metric-md text-error font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden>timer</span> 18m 42s
                </span>
              </div>
            </div>
            <div className="mt-3 bg-surface-container p-2.5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-label-caps uppercase text-outline tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-error" aria-hidden>query_stats</span> HTTP 500 Spike Curve
                </span>
                <span className="font-mono-data-xs text-mono-data-xs text-error font-semibold">+14.2% failure</span>
              </div>
              <div className="mt-2 space-y-1.5 font-mono-data-xs text-mono-data-xs">
                {[['PostgreSQL Conn', '61%', '98% (Saturated)'], ['Payment Latency', '45ms', '1,840ms (+40.8x)'], ['HTTP 500 Ratio', '0.02%', '14.2%']].map(([label, from, to]) => (
                  <div key={label} className="flex items-center justify-between p-1.5 rounded bg-surface-container-low">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className="flex items-center gap-2"><span className="text-outline">{from}</span><span className="material-symbols-outlined text-[12px] text-error" aria-hidden>arrow_forward</span><span className="text-error font-bold">{to}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-surface-container-low rounded-xl p-4 shadow-md space-y-2" aria-label="Evidence feeds">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]" aria-hidden>verified</span> Correlated Evidence Feeds
              </h3>
              <span className="font-mono-data-xs text-mono-data-xs text-secondary-fixed bg-surface-container-highest px-2 py-0.5 rounded-full font-semibold">4 Converging</span>
            </div>
            {EVIDENCE_SOURCES.map((ev) => (
              <div key={ev.name} className="bg-surface-container p-2.5 rounded-lg hover:bg-surface-container-high transition-colors group cursor-pointer">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-primary text-[16px]" aria-hidden>{ev.icon}</span>
                    <span className="font-body-md text-body-md text-on-surface font-semibold truncate">{ev.name}</span>
                  </span>
                  <span className="font-mono-data-xs text-mono-data-xs text-error font-semibold shrink-0">{ev.count}</span>
                </div>
                <p className="font-mono-code-sm text-mono-code-sm text-on-surface-variant text-[11px] truncate">{ev.desc}</p>
              </div>
            ))}
          </section>
        </div>

        {/* Right: mode content */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {activeMode === 0 && (
            <>
              <section className="relative overflow-hidden bg-surface-container rounded-xl p-5 shadow-xl" aria-label="Root cause">
                <div className="absolute right-0 top-0 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" aria-hidden />
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 font-label-caps text-label-caps uppercase bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-bold">
                        <span className="material-symbols-outlined text-[12px]" aria-hidden>auto_awesome</span> Primary Root Cause Identified
                      </span>
                      <span className="font-mono-data-xs text-mono-data-xs text-outline">Synthesized in 1.4s</span>
                    </div>
                    <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Database connection pool exhaustion</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 leading-relaxed">
                      PostgreSQL connections saturated (<span className="font-mono-code-sm text-error font-semibold">max_conn=100</span>) after release <span className="font-mono-code-sm text-primary font-semibold">v2.8.1</span>.
                    </p>
                  </div>
                  <div className="bg-surface-container-highest/80 backdrop-blur-md p-3 rounded-xl flex flex-col items-center justify-center min-w-[140px] text-center shadow-md">
                    <span className="font-mono-metric-lg text-mono-metric-lg text-secondary font-bold leading-none">91%</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">AI Confidence</span>
                    <span className="font-mono-data-xs text-mono-data-xs text-tertiary mt-0.5">High Certainty</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 bg-surface-container-lowest/60 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className="font-label-caps text-label-caps uppercase text-outline tracking-wider">Multi-Signal Convergence Vector</span>
                    <span className="font-mono-data-xs text-mono-data-xs text-on-surface-variant">4 systems validated</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono-data-xs text-mono-data-xs">
                    {CONFIDENCE_VECTORS.map((cv) => (
                      <div key={cv.label} className="bg-surface-container p-2 rounded flex flex-col">
                        <div className="flex justify-between items-center text-on-surface-variant mb-1 gap-1"><span className="truncate">{cv.label}</span><span className="text-secondary font-bold">{cv.val}%</span></div>
                        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={cv.val} aria-valuemin={0} aria-valuemax={100} aria-label={cv.label}>
                          <div className="bg-secondary h-full rounded-full" style={{ width: `${cv.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-low rounded-xl p-4 shadow-md space-y-3" aria-label="Causal chain">
                <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden>account_tree</span> Why the AI Believes This — Causal Chain
                </h3>
                <ol className="space-y-1.5">
                  {CAUSAL_STEPS.map((step) => (
                    <li key={step.num} className="flex items-start gap-3 p-3 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors">
                      <span className="font-mono-metric-md text-mono-metric-md text-primary font-bold bg-surface-container-lowest px-2 py-1 rounded shrink-0">{step.num}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{step.title}</span>
                          <span className="font-mono-data-xs text-mono-data-xs text-outline">{step.time}</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}

          {activeMode === 1 && (
            <section className="bg-surface-container-low rounded-xl p-4 shadow-md space-y-2" aria-label="Evidence correlator">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Evidence Correlator — cross-signal join</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Each row is one independent system agreeing on the same 7-minute window.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EVIDENCE_SOURCES.map((e) => (
                  <div key={e.name} className="bg-surface-container p-3 rounded-xl">
                    <div className="font-body-md text-body-md text-on-surface font-bold">{e.name} · <span className="text-error font-mono-data-xs">{e.count}</span></div>
                    <div className="font-mono-code-sm text-mono-code-sm text-on-surface-variant mt-1">{e.desc}</div>
                    <div className="mt-2 font-mono-data-xs text-mono-data-xs text-tertiary">✓ temporally aligned · ✓ service-scoped</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeMode === 2 && (
            <section className="bg-surface-container-low rounded-xl p-4 shadow-md space-y-2" aria-label="Hypothesis testing">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Hypothesis Testing — falsifiable alternatives</h3>
              {HYPOTHESES.map((h) => (
                <div key={h.name} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container rounded-lg">
                  <div className="min-w-0">
                    <div className="font-body-md text-body-md text-on-surface font-semibold">{h.name} <span className={cx('ml-1 px-1.5 py-0.5 rounded font-mono-data-xs text-mono-data-xs font-bold', h.status === 'supported' ? 'bg-tertiary-container/40 text-tertiary' : 'bg-surface-container-highest text-outline')}>{h.status.toUpperCase()} · {h.conf}%</span></div>
                    <div className="font-mono-data-xs text-mono-data-xs text-on-surface-variant mt-0.5">{h.detail}</div>
                  </div>
                  <button
                    disabled={testing !== null}
                    onClick={() => { setTesting(h.name); window.setTimeout(() => { setTesting(null); toast('info', `Re-ran test: ${h.name}`, h.status === 'supported' ? 'Still supported' : 'Still rejected'); }, 800); }}
                    className="btn-secondary disabled:opacity-50"
                  >
                    {testing === h.name ? 'Testing…' : 'Re-run test'}
                  </button>
                </div>
              ))}
            </section>
          )}

          {activeMode === 3 && (
            <section className="bg-surface-container-low rounded-xl p-4 shadow-md" aria-label="Timeline reconstruction">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Timeline Reconstruction — minute by minute</h3>
              <ol className="relative ml-2 border-l border-outline-variant/40 space-y-4">
                {TIMELINE.map((e) => (
                  <li key={e.t} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-surface-container-low" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-data-xs text-mono-data-xs text-primary font-bold">{e.t}</span>
                      <span className="font-mono-data-xs text-mono-data-xs px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">{e.src}</span>
                      <span className="font-mono-data-xs text-mono-data-xs text-secondary">{e.impact}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface mt-0.5">{e.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Playbook */}
          <section className="bg-surface-container-low rounded-xl p-4 shadow-md space-y-3" aria-label="Action playbook">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]" aria-hidden>bolt</span> Recommended Action Playbook
              </h3>
              <span className="font-label-caps text-label-caps uppercase text-secondary bg-surface-container-highest px-2 py-0.5 rounded font-bold">Automated Remediation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { t: 'Rollback Deployment v2.8.1', d: 'Restores pool stability to v2.8.0 baseline.', tag: 'Priority 1', eta: '~90s recovery' },
                { t: 'Hot-patch Connection Pool', d: 'Raise max 100 → 250 while staying on v2.8.1.', tag: 'Alternative', eta: '~45s apply' },
                { t: 'Enable Read-Replica Routing', d: 'Shed reads off master immediately.', tag: 'Load Shedding', eta: 'Zero downtime' },
                { t: 'Saturation Alert >90%', d: 'Sev-2 at 85%, autoscale at 90%.', tag: 'Post-Incident', eta: 'Prevention' },
              ].map((a) => (
                <div key={a.t} className="p-3 bg-surface-container rounded-xl flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="font-label-caps text-label-caps px-2 py-0.5 rounded uppercase font-bold bg-surface-container-highest text-on-surface-variant">{a.tag}</span>
                      <span className="font-mono-data-xs text-mono-data-xs text-tertiary">{a.eta}</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{a.t}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{a.d}</p>
                  </div>
                  <button disabled={remediating !== null} onClick={() => runRemediation(a.t)} className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-semibold rounded transition-colors disabled:opacity-50">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>{remediating === a.t ? 'progress_activity' : 'play_arrow'}</span>
                    <span>{remediating === a.t ? 'Executing…' : `Execute: ${a.t}`}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="p-3 bg-surface-container-low rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono-data-xs text-mono-data-xs text-outline px-1">Evidence: 1,842 logs · 27 traces · 5 anomalies · 4 diffs</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={async () => { const ok = await copyToClipboard(postmortem); toast(ok ? 'success' : 'error', ok ? 'Postmortem copied' : 'Copy failed'); }} className="btn-ghost">Copy Postmortem MD</button>
          <button onClick={exportMD} className="flex items-center gap-2 px-3 py-2 bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container rounded font-body-sm text-body-sm font-semibold transition-colors shadow-md">
            <span className="material-symbols-outlined text-[16px]" aria-hidden>picture_as_pdf</span>
            <span>Export Postmortem (MD / Print→PDF)</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
