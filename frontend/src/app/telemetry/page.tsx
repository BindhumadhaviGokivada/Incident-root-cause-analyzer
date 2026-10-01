'use client';

import React, { useMemo, useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { LOGS, METRIC_SERIES, TRACE_SPANS } from '@/lib/data';
import { AreaChart, EmptyState } from '@/components/ui/primitives';
import { useApp } from '@/lib/app-store';
import { downloadFile, cx, copyToClipboard } from '@/lib/format';

const TABS = ['Logs', 'Metrics', 'Traces'] as const;
type Level = 'ALL' | 'ERROR' | 'WARN' | 'INFO';

export default function TelemetryPage() {
  const { toast } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [logFilter, setLogFilter] = useState('');
  const [level, setLevel] = useState<Level>('ALL');
  const [range, setRange] = useState('Last 1h');

  const filteredLogs = useMemo(
    () =>
      LOGS.filter((l) => {
        if (level !== 'ALL' && l.level !== level) return false;
        if (!logFilter) return true;
        const q = logFilter.toLowerCase();
        return l.msg.toLowerCase().includes(q) || l.service.toLowerCase().includes(q);
      }),
    [logFilter, level]
  );

  const exportLogs = () => {
    downloadFile(`logs-${Date.now()}.json`, JSON.stringify(filteredLogs, null, 2), 'application/json');
    toast('success', 'Logs exported', `${filteredLogs.length} entries downloaded`);
  };

  const copyTraceId = async () => {
    const ok = await copyToClipboard('a7f2e91c4d2b8f01');
    toast(ok ? 'success' : 'error', ok ? 'Trace ID copied' : 'Copy failed');
  };

  return (
    <AppShell breadcrumb="Observability Hub">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">Observability Hub</span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">Telemetry & Signal Explorer</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Live log stream, metric series, and trace waterfall — one window, {range.toLowerCase()}.</p>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30" role="group" aria-label="Time range">
          {['Last 15m', 'Last 1h', 'Last 6h'].map((r) => (
            <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={cx('px-2.5 py-1 rounded font-mono-data-xs text-mono-data-xs transition-colors', range === r ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface')}>{r}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-outline-variant/30" role="tablist" aria-label="Signal tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === i}
            onClick={() => setActiveTab(i)}
            className={cx('flex items-center gap-1.5 px-4 py-2.5 font-body-md text-body-md font-medium transition-colors border-b-2 -mb-px', activeTab === i ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface')}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden>{i === 0 ? 'subject' : i === 1 ? 'ssid_chart' : 'account_tree'}</span>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <section aria-label="Logs" className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden>subject</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Live Log Stream</h2>
              <span className="badge-critical"><span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" aria-hidden />LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1" role="group" aria-label="Log level">
                {(['ALL', 'ERROR', 'WARN', 'INFO'] as Level[]).map((l) => (
                  <button key={l} onClick={() => setLevel(l)} aria-pressed={level === l} className={cx('px-2 py-1 rounded font-mono-data-xs text-mono-data-xs', level === l ? 'bg-surface-container-highest text-on-surface font-bold' : 'text-outline hover:text-on-surface')}>{l}</button>
                ))}
              </div>
              <input value={logFilter} onChange={(e) => setLogFilter(e.target.value)} placeholder="Filter…" aria-label="Filter logs" className="w-40 bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary" />
              <button onClick={exportLogs} className="btn-ghost" title="Export filtered logs">Export</button>
            </div>
          </div>
          <p className="font-mono-data-xs text-mono-data-xs text-outline" role="status">{filteredLogs.length} entries · {level} · {range}</p>
          {filteredLogs.length === 0 ? (
            <EmptyState icon="search_off" title="No logs match" body="Widen the level filter or clear the search." action={<button className="btn-ghost mt-1" onClick={() => { setLogFilter(''); setLevel('ALL'); }}>Reset</button>} />
          ) : (
            <div className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/20 overflow-x-auto">
              <div className="grid grid-cols-[110px_70px_150px_1fr] gap-0 min-w-[640px] bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider px-4 py-2.5 border-b border-outline-variant/20" aria-hidden>
                <span>Timestamp</span><span>Level</span><span>Service</span><span>Message</span>
              </div>
              <div className="font-mono-code-sm text-mono-code-sm divide-y divide-outline-variant/10 min-w-[640px]">
                {filteredLogs.map((log, i) => (
                  <div key={i} className="grid grid-cols-[110px_70px_150px_1fr] gap-0 px-4 py-1.5 hover:bg-surface-container/40 transition-colors group">
                    <span className="text-outline">{log.time}</span>
                    <span className={log.level === 'ERROR' ? 'text-error font-bold' : log.level === 'WARN' ? 'text-secondary font-semibold' : 'text-tertiary'}>{log.level}</span>
                    <span className="text-primary truncate">{log.service}</span>
                    <span className="text-on-surface-variant truncate group-hover:text-on-surface">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 1 && (
        <section aria-label="Metrics" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {METRIC_SERIES.map((m, i) => <AreaChart key={m.label} id={`m${i}`} path={m.path} color={m.color} peak={m.peak} label={m.label} />)}
          </div>
          <div className="card flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error-container/30 flex items-center justify-center shrink-0" aria-hidden>
              <span className="material-symbols-outlined text-[20px] text-error">warning</span>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-body-md text-body-md text-on-surface font-semibold">5 statistical anomalies detected</div>
              <div className="font-mono-data-xs text-mono-data-xs text-outline">Z-score &gt; 3.8 on pg_stat_activity · Prometheus rule firing</div>
            </div>
            <span className="badge-critical">FIRING</span>
            <button className="btn-secondary" onClick={() => toast('info', 'Alert silenced for 30m', 'pg_stat_activity rule')}>Silence 30m</button>
          </div>
        </section>
      )}

      {activeTab === 2 && (
        <section aria-label="Traces" className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]" aria-hidden>account_tree</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Distributed Trace Waterfall</h2>
              <button onClick={copyTraceId} title="Copy trace ID" className="font-mono-data-xs text-mono-data-xs px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold hover:brightness-110">Trace ID: a7f2e91c… ⧉</button>
            </div>
            <span className="font-mono-data-xs text-mono-data-xs text-error font-bold">Total: 30,041ms</span>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(140px,200px)_1fr_80px] gap-2 font-label-caps text-label-caps uppercase tracking-wider text-outline text-[9px] px-2" aria-hidden>
              <span>Service / Operation</span><span>Timeline (30s window)</span><span className="text-right">Duration</span>
            </div>
            {TRACE_SPANS.map((span, i) => {
              const width = Math.max(2, (span.dur / 30041) * 100);
              const left = (span.offset / 30041) * 100;
              return (
                <div key={i} className="grid grid-cols-[minmax(140px,200px)_1fr_80px] gap-2 items-center px-2">
                  <div className="min-w-0">
                    <div className="font-mono-code-sm text-mono-code-sm text-primary truncate">{span.service}</div>
                    <div className="font-mono-data-xs text-mono-data-xs text-outline truncate">{span.op}</div>
                  </div>
                  <div className="relative h-6 bg-surface-container-lowest rounded overflow-hidden" role="img" aria-label={`${span.service} ${span.op} ${span.dur} milliseconds`}>
                    <div className={`absolute top-1 bottom-1 rounded ${span.color}`} style={{ left: `${left}%`, width: `${width}%`, minWidth: '2px' }} />
                  </div>
                  <div className="text-right font-mono-data-xs text-mono-data-xs">
                    <span className={span.dur > 1000 ? 'text-error font-bold' : 'text-on-surface-variant'}>{span.dur > 0 ? `${span.dur.toLocaleString()}ms` : '<1ms'}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[20px]" aria-hidden>error</span>
            <div>
              <div className="font-body-sm text-body-sm text-on-surface font-semibold">Critical bottleneck identified</div>
              <div className="font-mono-data-xs text-mono-data-xs text-on-surface-variant">postgres-primary → acquire_connection consumed 99.4% of total request time</div>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
