'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/ui/AppShell';
import { useApp } from '@/lib/app-store';
import { FINDINGS, TIME_RANGES } from '@/lib/data';
import { SevBadge, LifecyclePill, ConfidenceMeter, StatusDot, Sparkline, LiveClock, EmptyState, Skeleton } from '@/components/ui/primitives';
import { DeclareIncidentModal, WarRoomModal } from '@/components/ui/Modals';
import { formatDuration, downloadFile, cx } from '@/lib/format';

type SevFilter = 'All' | 'P1' | 'P2' | 'P3';
type StatusFilter = 'All' | 'critical' | 'warning' | 'healthy';

export default function OverviewPage() {
  const { incidents, updateIncident, toast, logAudit, services, lastRefresh, refresh, setAssistantOpen, env } = useApp();
  const [activeRange, setActiveRange] = useState<string>('Last 1h');
  const [sevFilter, setSevFilter] = useState<SevFilter>('All');
  const [query, setQuery] = useState('');
  const [svcFilter, setSvcFilter] = useState<StatusFilter>('All');
  const [svcQuery, setSvcQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [warOpen, setWarOpen] = useState(false);
  const [warIncident, setWarIncident] = useState('#INC-8941');

  const doRefresh = () => {
    setLoading(true);
    refresh();
    window.setTimeout(() => setLoading(false), 600);
  };

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (sevFilter !== 'All' && i.sev !== sevFilter) return false;
      if (query && !`${i.id} ${i.title} ${i.service}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [incidents, sevFilter, query]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (svcFilter !== 'All' && s.status !== svcFilter) return false;
      if (svcQuery && !`${s.name} ${s.desc}`.toLowerCase().includes(svcQuery.toLowerCase())) return false;
      return true;
    });
  }, [services, svcFilter, svcQuery]);

  const openCount = incidents.filter((i) => i.status !== 'Resolved').length;
  const critCount = services.filter((s) => s.status === 'critical').length;

  const ack = (id: string) => {
    updateIncident(id, { acked: true, status: 'Analyzing' });
    logAudit('incident.acked', `${id} acknowledged`);
    toast('success', `${id} acknowledged`, 'On-call paged · timeline pinned');
  };
  const resolve = (id: string) => {
    updateIncident(id, { status: 'Resolved' });
    logAudit('incident.resolved', `${id} marked resolved`);
    toast('success', `${id} resolved`, 'Postmortem draft queued');
  };

  const exportDiagnostics = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      env,
      range: activeRange,
      incidents: filtered,
      services: filteredServices,
      findings: FINDINGS,
    };
    downloadFile(`diagnostics-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    toast('success', 'Diagnostics exported', 'JSON downloaded');
  };

  return (
    <AppShell breadcrumb="cluster-omega · Overview">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">Cockpit v2.18</span>
            <span className="w-1 h-1 rounded-full bg-outline" aria-hidden />
            <span className="font-mono-data-xs text-mono-data-xs text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" aria-hidden />
              Cluster telemetry live · {env}
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">Production Overview</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Real-time health, incident lifecycle, and AI root-cause synthesis.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-1.5 rounded-xl shadow-sm" role="toolbar" aria-label="Dashboard controls">
          <LiveClock />
          <button onClick={doRefresh} className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors" aria-label="Refresh dashboard">
            <span className={cx('material-symbols-outlined text-[15px] text-on-surface-variant', loading && 'animate-spin')} aria-hidden>refresh</span>
            <span className="font-medium">{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <div className="h-4 w-px bg-outline-variant/30 mx-1" aria-hidden />
          <div className="flex items-center gap-0.5 bg-surface-container-lowest p-0.5 rounded" role="group" aria-label="Time range">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                aria-pressed={activeRange === r}
                className={cx('px-2.5 py-1 rounded font-mono-data-xs text-mono-data-xs transition-colors', activeRange === r ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          <KpiCard label="Active Incidents" value={String(openCount)} delta="+1 in last hour" deltaColor="error" sparkPath="M0,24 L20,22 L40,25 L60,18 L80,19 L100,8 L120,4" sparkColor="text-error" />
          <KpiCard label="Critical Services" value={`${critCount} / 47`} delta="Degraded" deltaColor="secondary" custom={<div className="flex items-center gap-1.5 pt-2"><span className="w-1.5 h-1.5 rounded-full bg-error" aria-hidden /><span className="font-mono-data-xs text-mono-data-xs text-on-surface-variant truncate">payment, postgres degraded</span></div>} />
          <KpiCard label="Global Error Rate" value="2.84%" delta="↑ 1.2%" deltaColor="error" sparkColor="text-error" sparkPath="M0,26 L30,26 L55,24 L70,22 L85,27 L95,6 L108,12 L120,4" valueColor="text-error" />
          <KpiCard label="P99 Latency" value="842 ms" delta="+18% SLA" deltaColor="secondary" sparkColor="text-primary" sparkPath="M0,22 L25,20 L50,21 L75,15 L95,9 L120,7" />
          <KpiCard label="System SLA" value="99.94%" delta="Target: 99.99%" deltaColor="outline" valueColor="text-tertiary" custom={<div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden mt-3" role="progressbar" aria-valuenow={88} aria-valuemin={0} aria-valuemax={100} aria-label="SLA 99.94 percent"><div className="bg-tertiary h-full rounded-full" style={{ width: '88%' }} /></div>} />
          <div className="p-3 bg-gradient-to-br from-surface-container-low via-surface-container to-secondary-container/30 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]" aria-hidden>auto_awesome</span>AI RCA Conf.
              </span>
              <span className="font-mono-data-xs text-mono-data-xs px-1.5 rounded bg-secondary-container text-on-secondary-container font-semibold">Active</span>
            </div>
            <div className="my-1 flex items-baseline justify-between">
              <span className="font-mono-metric-lg text-mono-metric-lg text-secondary-fixed font-bold">91%</span>
              <span className="font-mono-data-xs text-mono-data-xs text-on-surface-variant">High precision</span>
            </div>
            <p className="font-mono-data-xs text-mono-data-xs text-on-surface-variant line-clamp-1 mt-1">Cross-incident confidence index</p>
          </div>
        </div>
      )}

      {/* Incidents + AI insights */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section aria-label="Active incidents" className="xl:col-span-8 bg-surface-container-low rounded-xl shadow-md p-4 lg:p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Active Incidents</h2>
              <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded font-mono-data-xs text-mono-data-xs" role="group" aria-label="Filter by severity">
                {(['All', 'P1', 'P2'] as SevFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSevFilter(s)}
                    aria-pressed={sevFilter === s}
                    className={cx('px-2 py-0.5 rounded transition-colors', sevFilter === s ? 'bg-surface-container-high text-on-surface font-medium' : 'text-on-surface-variant hover:text-on-surface')}
                  >
                    {s === 'All' ? `All: ${incidents.length}` : `${s}: ${incidents.filter((i) => i.sev === s).length}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter incidents…"
                aria-label="Filter incidents"
                className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary w-44"
              />
              <button onClick={() => setDeclareOpen(true)} className="btn-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden>add_alert</span>
                <span>Declare Incident</span>
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="check_circle" title="No incidents match" body="All clear for this filter. Widen severity or clear search." action={<button onClick={() => { setSevFilter('All'); setQuery(''); }} className="btn-ghost mt-1">Clear filters</button>} />
          ) : (
            <div className="w-full overflow-x-auto -mx-1 px-1">
              <table className="w-full text-left font-body-sm text-body-sm min-w-[760px]">
                <thead>
                  <tr className="bg-surface-container-lowest/70 text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                    <th scope="col" className="py-2.5 px-3 rounded-l">Sev</th>
                    <th scope="col" className="py-2.5 px-2">Incident</th>
                    <th scope="col" className="py-2.5 px-2">Service</th>
                    <th scope="col" className="py-2.5 px-2">Status</th>
                    <th scope="col" className="py-2.5 px-2">Duration</th>
                    <th scope="col" className="py-2.5 px-2">Impact</th>
                    <th scope="col" className="py-2.5 px-2">RCA Conf</th>
                    <th scope="col" className="py-2.5 px-3 text-right rounded-r"><span className="sr-only">Actions</span>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc, i) => (
                    <tr key={inc.id} className={cx('hover:bg-surface-container/60 transition-colors group', i % 2 !== 0 && 'bg-surface-container-low/40')}>
                      <td className="py-3 px-3"><SevBadge sev={inc.sev} /></td>
                      <td className="py-3 px-2 min-w-[220px]">
                        <Link href="/incidents/new" className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{inc.title}</Link>
                        <div className="font-mono-data-xs text-mono-data-xs text-outline flex items-center gap-2 mt-0.5">
                          <span>{inc.id}</span><span aria-hidden>•</span><span>{inc.acked ? `Assigned to ${inc.assignee}` : 'Opened by Automated Watcher'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2"><span className="font-mono-code-sm text-mono-code-sm px-2 py-1 rounded bg-surface-container-highest text-on-surface">{inc.service}</span></td>
                      <td className="py-3 px-2"><LifecyclePill status={inc.status} /></td>
                      <td className="py-3 px-2 font-mono-data-xs text-mono-data-xs text-on-surface-variant whitespace-nowrap">{formatDuration((lastRefresh - inc.startedAt) / 1000)}</td>
                      <td className={cx('py-3 px-2 font-mono-data-xs text-mono-data-xs font-medium whitespace-nowrap', inc.sev === 'P1' ? 'text-error' : 'text-secondary-fixed')}>{inc.impact}</td>
                      <td className="py-3 px-2"><ConfidenceMeter value={inc.conf} /></td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1.5">
                          {!inc.acked && inc.status !== 'Resolved' && (
                            <button onClick={() => ack(inc.id)} className="btn-secondary" title={`Acknowledge ${inc.id}`}>Ack</button>
                          )}
                          {inc.status !== 'Resolved' ? (
                            <button onClick={() => resolve(inc.id)} className="btn-secondary" title={`Resolve ${inc.id}`}>Resolve</button>
                          ) : (
                            <span className="font-mono-data-xs text-mono-data-xs text-tertiary font-semibold px-2 py-1">Resolved ✓</span>
                          )}
                          <Link href="/incidents/new" className="btn-secondary" aria-label={`Investigate ${inc.id}`}>
                            <span>Investigate</span>
                            <span className="material-symbols-outlined text-[14px]" aria-hidden>arrow_forward</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-3 mt-2 flex flex-wrap items-center justify-between gap-2 text-on-surface-variant font-mono-data-xs text-mono-data-xs border-t border-outline-variant/20">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-tertiary" aria-hidden>check_circle</span>
              {openCount} open · tracked by RootCause Auto-Pilot
            </span>
            <Link href="/incidents/new" className="text-primary hover:underline flex items-center gap-0.5">
              <span>View historical incidents (48)</span>
              <span className="material-symbols-outlined text-[14px]" aria-hidden>chevron_right</span>
            </Link>
          </div>
        </section>

        {/* AI insights */}
        <aside aria-label="AI insights" className="xl:col-span-4 bg-gradient-to-b from-surface-container to-surface-container-low rounded-xl shadow-md p-4 lg:p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden>psychology</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">AI Operations Insights</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Live Correlated Findings</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono-data-xs text-mono-data-xs font-semibold shrink-0">{FINDINGS.length} Active</span>
          </div>
          <div className="mt-3 p-2 rounded bg-surface-container-lowest/80 text-on-surface-variant font-mono-data-xs text-mono-data-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden>auto_awesome</span>
            <span>Auto-correlated across 4.2M telemetry events</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {FINDINGS.map((f, i) => (
              <article key={i} className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high/80 transition-colors space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary font-bold">Confidence: {f.conf}%</span>
                  <span className="font-mono-data-xs text-mono-data-xs text-outline">{f.signals}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface font-medium leading-relaxed">{f.text}</p>
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className={cx('font-mono-data-xs text-mono-data-xs font-medium', i === 0 ? 'text-error' : 'text-on-surface-variant')}>{f.label}</span>
                  <Link href={i === 1 ? '/deployments' : i === 2 ? '/telemetry' : '/incidents/new'} className="font-body-sm text-body-sm text-secondary hover:text-secondary-fixed flex items-center gap-0.5 font-semibold shrink-0">
                    <span>{f.action}</span>
                    <span className="material-symbols-outlined text-[14px]" aria-hidden>arrow_forward</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="pt-3 mt-2 flex items-center justify-between border-t border-outline-variant/20">
            <span className="font-mono-data-xs text-mono-data-xs text-outline">Synthesis: DeepRCA-70B</span>
            <button onClick={() => setAssistantOpen(true)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-secondary-container to-on-secondary text-on-surface font-body-sm text-body-sm font-semibold flex items-center gap-1 shadow-sm hover:brightness-110">
              <span className="material-symbols-outlined text-[16px]" aria-hidden>smart_toy</span>
              <span>Open AI Assistant</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Health matrix */}
      <section aria-label="System health">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">System Health Matrix</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Resource utilization across critical topology nodes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input value={svcQuery} onChange={(e) => setSvcQuery(e.target.value)} placeholder="Search services…" aria-label="Search services" className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary w-44" />
            <div className="flex items-center gap-1 font-mono-data-xs text-mono-data-xs bg-surface-container-low p-1 rounded-lg border border-outline-variant/20" role="group" aria-label="Filter services by status">
              {(['All', 'critical', 'warning', 'healthy'] as StatusFilter[]).map((s) => (
                <button key={s} onClick={() => setSvcFilter(s)} aria-pressed={svcFilter === s} className={cx('px-2 py-1 rounded capitalize transition-colors', svcFilter === s ? 'bg-surface-container-highest text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface')}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        {filteredServices.length === 0 ? (
          <EmptyState icon="dns" title="No services match" body="Adjust the status filter or search." action={<button onClick={() => { setSvcFilter('All'); setSvcQuery(''); }} className="btn-ghost mt-1">Reset</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {filteredServices.map((svc) => <ServiceCard key={svc.name} {...svc} />)}
          </div>
        )}
      </section>

      {/* Diagnostics */}
      <div className="p-4 rounded-xl bg-surface-container-low shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-on-surface-variant">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0" aria-hidden>
            <span className="material-symbols-outlined text-[24px]">hub</span>
          </div>
          <div>
            <div className="font-body-md text-body-md text-on-surface font-semibold">Correlated Root Cause Graph Engine</div>
            <div className="font-mono-data-xs text-mono-data-xs text-outline">Dependency propagation across 148 graph edges · {env}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportDiagnostics} className="btn-ghost">Export Diagnostics JSON</button>
          <button onClick={() => { setWarIncident(filtered[0]?.id ?? '#INC-8941'); setWarOpen(true); }} className="btn-primary">
            <span>Launch War Room</span>
            <span className="material-symbols-outlined text-[16px]" aria-hidden>emergency</span>
          </button>
        </div>
      </div>

      <DeclareIncidentModal open={declareOpen} onClose={() => setDeclareOpen(false)} />
      <WarRoomModal open={warOpen} onClose={() => setWarOpen(false)} incidentId={warIncident} />
    </AppShell>
  );
}

function KpiCard({ label, value, delta, deltaColor, sparkColor, sparkPath, valueColor = 'text-on-surface', custom }: {
  label: string; value: string; delta?: string; deltaColor?: string; sparkColor?: string; sparkPath?: string; valueColor?: string; custom?: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-surface-container-low rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold truncate">{label}</span>
        <span className={cx('w-2 h-2 rounded-full shrink-0', deltaColor === 'error' ? 'bg-error animate-pulse' : 'bg-outline')} aria-hidden />
      </div>
      <div className="my-1 flex items-baseline justify-between gap-2">
        <span className={cx('font-mono-metric-lg text-mono-metric-lg font-bold', valueColor)}>{value}</span>
        {delta && (
          <span className={cx('font-mono-data-xs text-mono-data-xs px-1.5 py-0.5 rounded font-medium leading-none whitespace-nowrap', deltaColor === 'error' ? 'bg-error-container/40 text-error' : deltaColor === 'secondary' ? 'bg-surface-container-highest text-secondary' : 'text-outline')}>{delta}</span>
        )}
      </div>
      {sparkColor && sparkPath ? <Sparkline id={label} path={sparkPath} color={sparkColor === 'text-error' ? '#ffb4ab' : '#adc6ff'} /> : custom}
    </div>
  );
}

function ServiceCard({ name, desc, status, cpu, mem, err, p99, pods, note }: { name: string; desc: string; status: 'critical' | 'warning' | 'healthy'; cpu: string; mem: string; err: string; p99: string; pods: string; note: string }) {
  const stripClass = status === 'critical' ? 'status-strip-critical' : status === 'warning' ? 'status-strip-warning' : 'status-strip-healthy';
  const badgeClass = status === 'critical' ? 'badge-critical' : status === 'warning' ? 'badge-warning' : 'badge-healthy';
  const statusLabel = status === 'critical' ? 'Critical' : status === 'warning' ? 'Warning' : 'Healthy';
  const noteColor = status === 'critical' ? 'text-error font-semibold' : status === 'warning' ? 'text-secondary font-medium' : 'text-tertiary font-medium';

  return (
    <article className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-md relative overflow-hidden flex flex-col justify-between" aria-label={`${name}, ${statusLabel}`}>
      <div className={stripClass} aria-hidden />
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-mono-code-sm text-mono-code-sm font-bold text-on-surface truncate">{name}</span>
          <span className={badgeClass}><StatusDot status={status} />{statusLabel}</span>
        </div>
        <div className="font-body-sm text-body-sm text-on-surface-variant truncate">{desc}</div>
      </div>
      <dl className="grid grid-cols-2 gap-2 my-3 bg-surface-container-lowest/60 p-2.5 rounded-lg">
        <MetricCell label="CPU" value={cpu} status={status} />
        <MetricCell label="Memory" value={mem} />
        <MetricCell label="Error Rate" value={err} status={status} />
        <MetricCell label="P99 Latency" value={p99} status={status} />
      </dl>
      <div className="flex items-center justify-between gap-2 font-mono-data-xs text-mono-data-xs text-on-surface-variant pt-1">
        <span className="truncate">{pods}</span>
        <span className={cx(noteColor, 'shrink-0')}>{note}</span>
      </div>
    </article>
  );
}

function MetricCell({ label, value, status }: { label: string; value: string; status?: string }) {
  const valueColor = status === 'critical' && (label === 'CPU' || label === 'Error Rate' || label === 'P99 Latency') ? 'text-error' : status === 'warning' ? 'text-secondary-fixed' : 'text-on-surface';
  return (
    <div>
      <dt className="font-label-caps text-label-caps text-outline uppercase">{label}</dt>
      <dd className={cx('font-mono-metric-md text-mono-metric-md font-semibold', valueColor)}>{value}</dd>
    </div>
  );
}
