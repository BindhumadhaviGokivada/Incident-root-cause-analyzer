'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/ui/AppShell';
import { TOPOLOGY_NODES, TOPOLOGY_EDGES, TOPOLOGY_TIERS } from '@/lib/data';
import { useApp } from '@/lib/app-store';
import { cx } from '@/lib/format';

type NodeStatus = 'critical' | 'warning' | 'healthy';

const statusStyle: Record<NodeStatus, { border: string; bg: string; text: string; dot: string }> = {
  critical: { border: 'border-error/60', bg: 'bg-error-container/20', text: 'text-error', dot: 'bg-error animate-ping' },
  warning: { border: 'border-secondary/40', bg: 'bg-secondary-container/20', text: 'text-secondary', dot: 'bg-secondary' },
  healthy: { border: 'border-tertiary/30', bg: 'bg-surface-container-low', text: 'text-tertiary', dot: 'bg-tertiary' },
};

export default function TopologyPage() {
  const { toast, setAssistantOpen } = useApp();
  const [selected, setSelected] = useState<string | null>('payment-service');
  const [query, setQuery] = useState('');
  const nodeMap = useMemo(() => Object.fromEntries(TOPOLOGY_NODES.map((n) => [n.id, n])), []);
  const selectedNode = selected ? nodeMap[selected] : null;
  const connectedIds = useMemo(
    () => TOPOLOGY_EDGES.filter((e) => e.from === selected || e.to === selected).map((e) => (e.from === selected ? e.to : e.from)),
    [selected]
  );

  const visibleTiers = useMemo(() => {
    if (!query) return TOPOLOGY_TIERS;
    const q = query.toLowerCase();
    return TOPOLOGY_TIERS.map((tier) => tier.filter((id) => nodeMap[id]?.name.toLowerCase().includes(q) || id.includes(q)));
  }, [query, nodeMap]);

  return (
    <AppShell breadcrumb="Service Topology">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">Service Topology</span>
            <span className="font-mono-data-xs text-mono-data-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary" aria-hidden>auto_awesome</span>
              Blast radius highlighted · Root cause: postgres-primary
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Distributed Service Dependency Map</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">OpenTelemetry dependency graph with live health overlay. Click a node to inspect.</p>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find service…" aria-label="Find service in topology" className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary w-48" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section aria-label="Topology graph" className="xl:col-span-8 bg-surface-container-low rounded-xl p-4 lg:p-6 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#adc6ff 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden />
          <div className="absolute left-1/2 bottom-16 w-64 h-32 bg-error/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2" aria-hidden />
          {visibleTiers.map((tier, ti) => (
            <div key={ti} className="flex flex-wrap justify-center gap-3 lg:gap-6 mb-10 last:mb-0 relative">
              {ti < visibleTiers.length - 1 && <div className="absolute bottom-0 left-1/2 w-px h-10 bg-outline-variant/40 -translate-x-1/2 translate-y-full" aria-hidden />}
              {tier.map((nodeId) => {
                const node = nodeMap[nodeId];
                if (!node) return null;
                const isSelected = selected === nodeId;
                const isConnected = connectedIds.includes(nodeId);
                const s = statusStyle[node.status];
                return (
                  <button
                    key={nodeId}
                    onClick={() => setSelected(isSelected ? null : nodeId)}
                    aria-pressed={isSelected}
                    aria-label={`${node.name}, ${node.status}`}
                    className={cx('group flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 hover:scale-105 shadow-md min-w-[130px]', s.bg, isSelected || isConnected ? 'border-primary shadow-lg scale-105' : s.border)}
                  >
                    <span className={cx('w-10 h-10 rounded-lg flex items-center justify-center', node.status === 'critical' ? 'bg-error-container/30' : node.status === 'warning' ? 'bg-secondary-container/30' : 'bg-surface-container-highest')} aria-hidden>
                      <span className={cx('material-symbols-outlined text-[20px]', s.text)}>{node.icon}</span>
                    </span>
                    <span className="text-center">
                      <span className="block font-mono-code-sm text-mono-code-sm text-on-surface font-semibold truncate max-w-[120px]">{node.name}</span>
                      <span className="block font-label-caps text-label-caps text-outline uppercase">{node.type}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={cx('w-1.5 h-1.5 rounded-full', s.dot)} aria-hidden />
                      <span className={cx('font-mono-data-xs text-mono-data-xs font-semibold capitalize', s.text)}>{node.status}</span>
                    </span>
                  </button>
                );
              })}
              {tier.length === 0 && <span className="font-mono-data-xs text-mono-data-xs text-outline">No nodes in this tier match “{query}”.</span>}
            </div>
          ))}
          <p className="mt-2 font-mono-data-xs text-mono-data-xs text-outline">{TOPOLOGY_EDGES.length} dependency edges · snapshot just now · hover states keyboard accessible</p>
        </section>

        <div className="xl:col-span-4 space-y-3">
          {selectedNode ? (
            <>
              <article className={cx('card border relative overflow-hidden', statusStyle[selectedNode.status].border)} aria-label={`${selectedNode.name} details`}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <span className="font-label-caps text-label-caps text-outline uppercase">{selectedNode.type}</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{selectedNode.name}</h2>
                    {selectedNode.note && <span className={cx('font-mono-data-xs text-mono-data-xs font-semibold', statusStyle[selectedNode.status].text)}>{selectedNode.note}</span>}
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-container-high shrink-0">
                    <span className={cx('w-2 h-2 rounded-full', statusStyle[selectedNode.status].dot)} aria-hidden />
                    <span className={cx('font-mono-data-xs text-mono-data-xs font-semibold capitalize', statusStyle[selectedNode.status].text)}>{selectedNode.status}</span>
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-2">
                  {selectedNode.metrics.map((m) => (
                    <div key={m.label} className="bg-surface-container-lowest p-2.5 rounded-lg">
                      <dt className="font-label-caps text-label-caps text-outline uppercase">{m.label}</dt>
                      <dd className={cx('font-mono-metric-md text-mono-metric-md font-bold', selectedNode.status === 'critical' ? 'text-error' : 'text-on-surface')}>{m.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>

              <section className="card space-y-2" aria-label="Connected services">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden>hub</span>
                  Connected Services ({connectedIds.length})
                </h3>
                {connectedIds.map((id) => {
                  const n = nodeMap[id];
                  if (!n) return null;
                  return (
                    <button key={id} onClick={() => setSelected(id)} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-container transition-colors text-left">
                      <span className={cx('w-2 h-2 rounded-full shrink-0', statusStyle[n.status].dot)} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono-code-sm text-mono-code-sm text-on-surface truncate">{n.name}</span>
                        <span className="block font-mono-data-xs text-mono-data-xs text-outline">{n.type}</span>
                      </span>
                      <span className={cx('font-mono-data-xs text-mono-data-xs capitalize font-semibold', statusStyle[n.status].text)}>{n.status}</span>
                    </button>
                  );
                })}
              </section>

              {selectedNode.status === 'critical' && (
                <section className="card bg-error-container/20 border border-error/30 space-y-2" aria-label="Blast radius">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-error text-[18px]" aria-hidden>bolt</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Blast Radius Impact</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Failure is propagating to <span className="text-error font-semibold">{connectedIds.length} dependent services</span>. Root cause identified at 91% confidence.</p>
                  <div className="flex gap-2">
                    <Link href="/incidents/new" className="btn-primary flex-1 justify-center"><span className="material-symbols-outlined text-[16px]" aria-hidden>psychology</span><span>Open RCA</span></Link>
                    <button className="btn-secondary" onClick={() => { setAssistantOpen(true); toast('info', 'Copilot briefed on ' + selectedNode.name); }}>Ask AI</button>
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center space-y-2">
              <span className="material-symbols-outlined text-[48px] text-outline" aria-hidden>hub</span>
              <div className="font-headline-sm text-headline-sm text-on-surface-variant">Select a node to inspect</div>
              <div className="font-body-sm text-body-sm text-outline mt-1">Click any service in the graph</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'dns', label: 'Total Services', value: '47', sub: 'Across 3 regions', color: 'text-primary' },
          { icon: 'hub', label: 'Dependency Edges', value: String(TOPOLOGY_EDGES.length + 138), sub: 'Real-time graph edges', color: 'text-secondary' },
          { icon: 'error', label: 'Critical Nodes', value: '2', sub: 'payment + postgres', color: 'text-error' },
          { icon: 'check_circle', label: 'Healthy Nodes', value: '43 / 47', sub: '91.5% nominal', color: 'text-tertiary' },
        ].map((item) => (
          <div key={item.label} className="card-sm flex items-center gap-3">
            <span className={cx('material-symbols-outlined text-[28px]', item.color)} aria-hidden>{item.icon}</span>
            <div>
              <div className="font-label-caps text-label-caps text-outline uppercase">{item.label}</div>
              <div className={cx('font-mono-metric-md text-mono-metric-md font-bold', item.color)}>{item.value}</div>
              <div className="font-mono-data-xs text-mono-data-xs text-on-surface-variant">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
