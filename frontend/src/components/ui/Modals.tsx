'use client';
import React, { useState } from 'react';
import { useApp } from '@/lib/app-store';
import { SERVICES } from '@/lib/data';

/** Declare-incident modal with validation + audit + toast. */
export function DeclareIncidentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { declareIncident, toast } = useApp();
  const [title, setTitle] = useState('');
  const [service, setService] = useState('payment-service');
  const [sev, setSev] = useState<'P1' | 'P2' | 'P3'>('P2');
  const [impact, setImpact] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = () => {
    if (title.trim().length < 8) {
      setError('Title must be at least 8 characters — be specific (e.g. “Checkout 500s on /payments”).');
      return;
    }
    const rec = declareIncident({ title: title.trim(), service, sev, impact: impact.trim() });
    toast('success', `Incident ${rec.id} declared`, `${sev} · ${service}`);
    setTitle(''); setImpact(''); setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} role="presentation">
      <div
        role="dialog" aria-modal="true" aria-label="Declare incident"
        className="w-full max-w-lg bg-surface-container-low border border-outline-variant/40 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Declare incident</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Opens a Sev-tracked incident and pages the on-call.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface"><span className="material-symbols-outlined" aria-hidden>close</span></button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Title *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Checkout 500s on POST /payments" className="mt-1 w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Service</span>
              <select value={service} onChange={(e) => setService(e.target.value)} className="mt-1 w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary">
                {SERVICES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Severity</legend>
              <div className="mt-1 flex gap-1.5" role="radiogroup" aria-label="Severity">
                {(['P1', 'P2', 'P3'] as const).map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={sev === p} onClick={() => setSev(p)} className={`flex-1 py-2 rounded-lg font-mono-data-xs text-mono-data-xs font-bold border transition-colors ${sev === p ? 'bg-error-container/40 border-error/50 text-error' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:text-on-surface'}`}>{p}</button>
                ))}
              </div>
            </fieldset>
          </div>
          <label className="block">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Customer impact</span>
            <input value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="e.g. 12% checkout failing" className="mt-1 w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary" />
          </label>
          {error && <p role="alert" className="font-body-sm text-body-sm text-error bg-error-container/20 border border-error/30 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} className="btn-primary"><span className="material-symbols-outlined text-[16px]" aria-hidden>add_alert</span><span>Declare & page on-call</span></button>
        </div>
        <p className="font-mono-data-xs text-mono-data-xs text-outline">Tip: ⌘+Enter to submit.</p>
      </div>
    </div>
  );
}

/** War-room modal: assembles bridge, roles, timeline link. */
export function WarRoomModal({ open, onClose, incidentId = '#INC-8941' }: { open: boolean; onClose: () => void; incidentId?: string }) {
  const { toast, logAudit } = useApp();
  if (!open) return null;
  const link = `https://meet.incidentroot.ai/war/${incidentId.replace('#', '').toLowerCase()}`;
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Launch war room" className="w-full max-w-lg bg-surface-container-low border border-outline-variant/40 rounded-2xl shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">War room — {incidentId}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Bridge + roles + live timeline in one click.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface"><span className="material-symbols-outlined" aria-hidden>close</span></button>
        </div>
        <ul className="space-y-2 font-body-sm text-body-sm text-on-surface-variant">
          <li className="flex gap-2"><span className="material-symbols-outlined text-tertiary text-[18px]" aria-hidden>group</span> Commander: Alex M. · Comms: Priya S. · Scribe: auto-bot</li>
          <li className="flex gap-2"><span className="material-symbols-outlined text-primary text-[18px]" aria-hidden>video_call</span> <span className="font-mono-code-sm text-mono-code-sm text-primary break-all">{link}</span></li>
          <li className="flex gap-2"><span className="material-symbols-outlined text-secondary text-[18px]" aria-hidden>history</span> Timeline auto-attached · RCA graph pinned</li>
        </ul>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Later</button>
          <button
            onClick={() => { logAudit('warroom.opened', `${incidentId} bridge opened`); toast('success', 'War room launched', 'Bridge link copied to clipboard'); onClose(); }}
            className="btn-primary"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden>emergency</span><span>Launch bridge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
