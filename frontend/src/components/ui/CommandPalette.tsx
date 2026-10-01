'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-store';

interface Item {
  kind: 'page' | 'action' | 'incident' | 'service';
  label: string;
  hint?: string;
  icon: string;
  href?: string;
  run?: () => void;
}

/**
 * Enterprise ⌘K palette: navigate, act on incidents, toggle live, open assistant.
 * Fully keyboard accessible (↑↓ Enter Esc).
 */
export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen, incidents, services, setAssistantOpen, setLive, live, toast, refresh } = useApp();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (paletteOpen) {
      setQ('');
      setIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  const items: Item[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    const match = (s: string) => !query || s.toLowerCase().includes(query);
    const pages: Item[] = ([
      { kind: 'page', label: 'Go to Overview', icon: 'dashboard', href: '/' },
      { kind: 'page', label: 'Go to RCA Analysis', icon: 'psychology', href: '/incidents/new' },
      { kind: 'page', label: 'Go to Observability', icon: 'monitoring', href: '/telemetry' },
      { kind: 'page', label: 'Go to Service Topology', icon: 'hub', href: '/topology' },
      { kind: 'page', label: 'Go to Deployments', icon: 'rocket_launch', href: '/deployments' },
      { kind: 'page', label: 'Go to SLO & Burn', icon: 'speed', href: '/slo' },
      { kind: 'page', label: 'Go to On-Call', icon: 'support_agent', href: '/oncall' },
      { kind: 'page', label: 'Go to Settings', icon: 'settings', href: '/settings' },
    ] as Item[]).filter((i) => match(i.label));
    const inc: Item[] = incidents
      .filter((i) => match(`${i.id} ${i.title} ${i.service}`))
      .slice(0, 5)
      .map((i) => ({ kind: 'incident', label: `${i.id} — ${i.title}`, hint: `${i.sev} · ${i.service}`, icon: 'emergency', href: '/incidents/new' }));
    const svc: Item[] = services
      .filter((s) => match(`${s.name} ${s.desc}`))
      .slice(0, 4)
      .map((s) => ({ kind: 'service', label: s.name, hint: s.status, icon: 'dns', href: '/topology' }));
    const actions: Item[] = ([
      { kind: 'action', label: live ? 'Pause live updates' : 'Resume live updates', icon: 'sync', run: () => { setLive(!live); toast('info', live ? 'Live updates paused' : 'Live updates resumed'); } },
      { kind: 'action', label: 'Refresh telemetry now', icon: 'refresh', run: () => { refresh(); toast('success', 'Telemetry refreshed'); } },
      { kind: 'action', label: 'Open AI Assistant', icon: 'smart_toy', run: () => setAssistantOpen(true) },
    ] as Item[]).filter((i) => match(i.label));
    return [...actions, ...pages, ...inc, ...svc].slice(0, 14);
  }, [q, incidents, services, live, setLive, toast, refresh, setAssistantOpen]);

  useEffect(() => setIdx(0), [q]);

  if (!paletteOpen) return null;

  const go = (item: Item) => {
    setPaletteOpen(false);
    if (item.run) item.run();
    else if (item.href) router.push(item.href);
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setPaletteOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl bg-surface-container-low border border-outline-variant/40 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === 'Enter' && items[idx]) go(items[idx]);
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[20px]" aria-hidden>search</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command, incident, or service… (Esc to close)"
            className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
            aria-label="Search commands, incidents and services"
          />
          <kbd className="font-mono-data-xs text-mono-data-xs bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/40 text-on-surface-variant">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
          {items.length === 0 && (
            <li className="px-3 py-8 text-center font-body-sm text-body-sm text-outline">No matches — try “incident”, “topology”, or a service name.</li>
          )}
          {items.map((item, i) => (
            <li key={`${item.kind}-${item.label}-${i}`} role="option" aria-selected={i === idx}>
              <button
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${i === idx ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>{item.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-body-sm text-body-sm font-medium truncate">{item.label}</span>
                  {item.hint && <span className="block font-mono-data-xs text-mono-data-xs text-outline truncate">{item.hint}</span>}
                </span>
                <span className="font-mono-data-xs text-mono-data-xs text-outline capitalize">{item.kind}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-outline-variant/20 font-mono-data-xs text-mono-data-xs text-outline">
          <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
