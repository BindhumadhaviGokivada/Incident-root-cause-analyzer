'use client';
import React, { useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { useApp } from '@/lib/app-store';

const ROSTER = [
  { name: 'Alex Morgan', role: 'Primary · Staff SRE', shift: 'Now → 18:00 UTC', on: true },
  { name: 'Priya Sharma', role: 'Secondary · Backend', shift: '18:00 → 02:00 UTC', on: false },
  { name: 'Dev Lead', role: 'Escalation · Platform', shift: 'On-call fallback', on: false },
];

export default function OnCallPage() {
  const { toast, logAudit, audit } = useApp();
  const [overridden, setOverridden] = useState(false);

  return (
    <AppShell breadcrumb="On-Call · Schedules & handoff">
      <div>
        <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">Response</span>
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mt-1">On-Call & Escalation</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Who gets paged, in what order, with full audit trail.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <section className="card space-y-2" aria-label="Roster">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Current rotation — cluster-omega</h2>
          {ROSTER.map((p) => (
            <div key={p.name} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
              <span className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container" aria-hidden>{p.name[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-body-md text-body-md text-on-surface font-semibold truncate">{p.name} {p.on && <span className="ml-1 px-1.5 py-0.5 rounded bg-tertiary-container/40 text-tertiary font-mono-data-xs text-mono-data-xs font-bold">ON-CALL</span>}</div>
                <div className="font-mono-data-xs text-mono-data-xs text-on-surface-variant">{p.role} · {p.shift}</div>
              </div>
              <button className="btn-secondary" onClick={() => toast('info', `Paged ${p.name}`, 'Ack expected in < 5m')}>Page</button>
            </div>
          ))}
          <button
            className="btn-primary w-full justify-center"
            onClick={() => { setOverridden(!overridden); logAudit('oncall.override', overridden ? 'Override cleared' : 'Alex → Priya override 2h'); toast('success', overridden ? 'Override cleared' : 'Override active: Priya covers next 2h'); }}
          >
            {overridden ? 'Clear override' : 'Override for 2h'}
          </button>
        </section>

        <section className="card" aria-label="Audit trail">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" aria-hidden>history</span> Audit trail
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Every ack, rollback, silence, and override — exportable for compliance.</p>
          <ol className="space-y-1.5 max-h-80 overflow-y-auto">
            {audit.map((a, i) => (
              <li key={i} className="flex gap-2 p-2 bg-surface-container-lowest rounded-lg font-mono-data-xs text-mono-data-xs">
                <span className="text-outline shrink-0">{new Date(a.at).toISOString().slice(11, 19)}</span>
                <span className="text-primary shrink-0">{a.actor}</span>
                <span className="text-on-surface-variant truncate">{a.action} — {a.detail}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
