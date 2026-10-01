'use client';
import React from 'react';
import AppShell from '@/components/ui/AppShell';
import { SLOS } from '@/lib/data';
import { useApp } from '@/lib/app-store';
import { cx } from '@/lib/format';

export default function SloPage() {
  const { toast } = useApp();
  return (
    <AppShell breadcrumb="SLOs · Error budgets">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">Reliability</span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">SLOs & Error Budgets</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Burn-rate alerts stop feature velocity before users feel it.</p>
        </div>
        <button className="btn-primary" onClick={() => toast('success', 'Burn-rate alert created', '2× in 1h → page · 1× in 6h → ticket')}>
          <span className="material-symbols-outlined text-[16px]" aria-hidden>add</span><span>New burn alert</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SLOS.map((s) => (
          <article key={s.name} className={cx('card border', s.status === 'breaching' ? 'border-error/40' : s.status === 'warning' ? 'border-secondary/30' : 'border-tertiary/20')} aria-label={`${s.name} SLO`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{s.name}</h2>
              <span className={cx('px-2 py-0.5 rounded-full font-mono-data-xs text-mono-data-xs font-bold uppercase', s.status === 'breaching' ? 'bg-error-container/40 text-error' : s.status === 'warning' ? 'bg-secondary-container/40 text-secondary' : 'bg-tertiary-container/30 text-tertiary')}>{s.status}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono-metric-lg text-mono-metric-lg font-bold text-on-surface">{s.current}</span>
              <span className="font-mono-data-xs text-mono-data-xs text-outline">target {s.target}</span>
              <span className="ml-auto font-mono-data-xs text-mono-data-xs text-on-surface-variant">burn ×{s.burn}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-container-lowest overflow-hidden" role="progressbar" aria-valuenow={Math.min(100, s.burn * 12)} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name} burn`}>
              <div className={cx('h-full rounded-full', s.status === 'breaching' ? 'bg-error' : s.status === 'warning' ? 'bg-secondary' : 'bg-tertiary')} style={{ width: `${Math.min(100, s.burn * 12)}%` }} />
            </div>
            <p className="mt-2 font-mono-data-xs text-mono-data-xs text-on-surface-variant">
              {s.status === 'breaching' ? 'Freeze deploys on the critical path until burn < 1× for 1h.' : s.status === 'warning' ? 'Watch: freeze risky migrations, keep canaries at 5%.' : 'Healthy: full velocity allowed.'}
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
