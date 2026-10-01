'use client';
import React, { useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { DEPLOYMENTS } from '@/lib/data';
import { useApp } from '@/lib/app-store';
import { cx } from '@/lib/format';

export default function DeploymentsPage() {
  const { toast, logAudit } = useApp();
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const rollback = (id: string, version: string) => {
    setRollingBack(id);
    window.setTimeout(() => {
      setRollingBack(null);
      logAudit('deploy.rollback', `${version} (${id}) rolled back via ArgoCD`);
      toast('success', `Rollback of ${version} started`, 'ArgoCD syncing · watch SLO burn');
    }, 1000);
  };

  return (
    <AppShell breadcrumb="Deployments · CI/CD correlation">
      <div>
        <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">CI/CD Correlation</span>
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">Deployments & Change Risk</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Every rollout joined to incidents, SLO burn, and error spikes. Suspect changes surface first.</p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="bg-surface-container-lowest/70 text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                <th scope="col" className="py-2.5 px-4">Deployment</th>
                <th scope="col" className="py-2.5 px-2">Service</th>
                <th scope="col" className="py-2.5 px-2">Risk</th>
                <th scope="col" className="py-2.5 px-2">Status</th>
                <th scope="col" className="py-2.5 px-2">When</th>
                <th scope="col" className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {DEPLOYMENTS.map((d) => (
                <tr key={d.id} className="border-t border-outline-variant/10 hover:bg-surface-container/50">
                  <td className="py-3 px-4">
                    <span className="font-mono-code-sm text-mono-code-sm text-primary font-bold">{d.version}</span>
                    <span className="block font-mono-data-xs text-mono-data-xs text-outline">{d.id} · {d.changes} files · {d.author}</span>
                  </td>
                  <td className="py-3 px-2 font-mono-code-sm text-mono-code-sm text-on-surface">{d.service}</td>
                  <td className="py-3 px-2">
                    <span className={cx('px-1.5 py-0.5 rounded font-mono-data-xs text-mono-data-xs font-bold uppercase', d.risk === 'high' ? 'bg-error-container/40 text-error' : d.risk === 'medium' ? 'bg-secondary-container/40 text-secondary' : 'bg-surface-container-highest text-tertiary')}>{d.risk}</span>
                  </td>
                  <td className="py-3 px-2 font-mono-data-xs text-mono-data-xs capitalize text-on-surface-variant">{d.status.replace('-', ' ')}</td>
                  <td className="py-3 px-2 font-mono-data-xs text-mono-data-xs text-on-surface-variant">{d.at}</td>
                  <td className="py-3 px-4 text-right">
                    {d.status === 'suspect' ? (
                      <button disabled={rollingBack !== null} onClick={() => rollback(d.id, d.version)} className="btn-primary disabled:opacity-50">
                        {rollingBack === d.id ? 'Rolling back…' : `Roll back ${d.version}`}
                      </button>
                    ) : (
                      <button onClick={() => toast('info', `${d.version} diff opened`, `${d.changes} files · no anomalies`)} className="btn-secondary">Inspect diff</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="card border border-secondary/30" aria-label="Change safety">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" aria-hidden>shield</span> Progressive delivery guardrails
        </h2>
        <ul className="mt-2 grid sm:grid-cols-3 gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <li className="bg-surface-container-lowest p-3 rounded-lg">Canary 5% → auto-promote only if error delta &lt; 0.5%</li>
          <li className="bg-surface-container-lowest p-3 rounded-lg">Auto-rollback on p99 regression &gt; 2× baseline</li>
          <li className="bg-surface-container-lowest p-3 rounded-lg">DB migration pre-check: pool headroom ≥ 30%</li>
        </ul>
      </section>
    </AppShell>
  );
}
