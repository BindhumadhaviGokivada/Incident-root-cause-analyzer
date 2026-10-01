'use client';
import React, { useRef, useState } from 'react';
import { useApp } from '@/lib/app-store';
import { FINDINGS } from '@/lib/data';

/**
 * AI Assistant drawer — heuristic SRE copilot (works offline, streams ready for LLM).
 * Answers from correlated findings + runbook knowledge.
 */
export default function AIAssistant() {
  const { assistantOpen, setAssistantOpen, incidents, toast } = useApp();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'I’m your RCA copilot. Ask about #INC-8941, pool exhaustion, blast radius, or “what should I do next?”.' },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  if (!assistantOpen) return null;

  const answer = (q: string): string => {
    const s = q.toLowerCase();
    const p1 = incidents.find((i) => i.sev === 'P1');
    if (s.includes('next') || s.includes('do') || s.includes('playbook'))
      return `Next for ${p1?.id ?? '#INC-8941'}: 1) Roll back v2.8.1 via ArgoCD (~90s). 2) If rollback is blocked, hot-patch pool max 100→250 + kill idle conns. 3) Route reads to replica. Confidence ${p1?.conf ?? 91}% — pool saturation is the primary fault.`;
    if (s.includes('blast') || s.includes('impact'))
      return `Blast radius: payment-service (14.2% errors) → api-gateway (3.1%) → auth (slow lookups). postgres-primary at 98% conns is the root; 2 critical + 2 warning nodes, 43/47 healthy.`;
    if (s.includes('deploy') || s.includes('commit') || s.includes('v2.8'))
      return `Trigger: v2.8.1 by @dev-lead, 7m before spike. Commit #a7f82c9 changed isolation without pool sizing. 4 commit diffs, temporal alignment 98%. Safest fix is rollback to v2.8.0.`;
    if (s.includes('pool') || s.includes('postgres') || s.includes('db'))
      return `postgres-primary: 98% conns, 94% CPU, pool 2,000/2,000. 1,842 “pool exhausted” logs + 27 spans stuck in acquire_connection (99.4% of 30s trace). Kill idle >5m, raise max, add >90% alert.`;
    if (s.includes('timeline'))
      return `T+03m conns 61→98% · T+05m p99 45ms→1,840ms · T+07m 500s 0.02→14.2% · now: auto-pilot tracking. Full reconstruction is on the RCA page.`;
    return `Correlated across 4.2M events: ${FINDINGS[0].text} (91%). Try “what should I do next”, “blast radius”, or “deployment trigger”.`;
  };

  const send = () => {
    const q = input.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setThinking(true);
    window.setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', text: answer(q) }]);
      setThinking(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: 99999 }));
    }, 450);
  };

  return (
    <aside
      role="complementary"
      aria-label="AI assistant"
      className="fixed right-0 top-0 h-full w-[min(92vw,380px)] z-[70] bg-surface-container-low border-l border-outline-variant/40 shadow-2xl flex flex-col"
    >
      <div className="h-14 px-4 flex items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]" aria-hidden>smart_toy</span>
          <div>
            <div className="font-body-sm text-body-sm text-on-surface font-bold leading-none">RCA Copilot</div>
            <div className="font-mono-data-xs text-mono-data-xs text-tertiary mt-0.5">DeepRCA-70B · grounded in live signals</div>
          </div>
        </div>
        <button onClick={() => setAssistantOpen(false)} aria-label="Close assistant" className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface">
          <span className="material-symbols-outlined" aria-hidden>close</span>
        </button>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl font-body-sm text-body-sm leading-relaxed ${m.role === 'user' ? 'bg-primary-container/30 text-on-surface' : 'bg-surface-container text-on-surface-variant'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && <div className="font-mono-data-xs text-mono-data-xs text-outline animate-pulse">Synthesizing across logs · metrics · traces…</div>}
      </div>
      <div className="p-3 border-t border-outline-variant/30 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {['What should I do next?', 'Blast radius?', 'Deployment trigger?'].map((s) => (
            <button key={s} onClick={() => { setInput(s); }} className="px-2 py-1 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface font-mono-data-xs text-mono-data-xs border border-outline-variant/30">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Ask about the incident…"
            aria-label="Ask the AI assistant"
            className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
          />
          <button onClick={send} disabled={thinking || !input.trim()} className="btn-primary disabled:opacity-40" aria-label="Send">
            <span className="material-symbols-outlined text-[18px]" aria-hidden>send</span>
          </button>
        </div>
        <p className="font-mono-data-xs text-mono-data-xs text-outline">Grounded answers — always verify before remediation.</p>
      </div>
    </aside>
  );
}
