'use client';

/**
 * Enterprise app store: environment, sidebar, toasts, command palette,
 * AI assistant drawer, incident lifecycle with persistence + backend sync.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type Env = 'Prod' | 'Staging' | 'Dev';
export type ToastKind = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
}

export type IncidentLifecycle = 'Investigating' | 'Analyzing' | 'Monitoring' | 'Mitigating' | 'Resolved';

export interface ManagedIncident {
  id: string;
  sev: 'P1' | 'P2' | 'P3';
  title: string;
  service: string;
  status: IncidentLifecycle;
  startedAt: number; // epoch ms
  impact: string;
  conf: number;
  assignee: string;
  acked: boolean;
}

const SEED: ManagedIncident[] = [
  { id: '#INC-8941', sev: 'P1', title: 'Payment API failures & timeout cascades', service: 'payment-service', status: 'Investigating', startedAt: Date.now() - 18 * 60 * 1000 - 42000, impact: '32% requests failing', conf: 91, assignee: 'Alex M.', acked: false },
  { id: '#INC-8938', sev: 'P2', title: 'Elevated API Gateway p99 latency', service: 'api-gateway', status: 'Analyzing', startedAt: Date.now() - 42 * 60 * 1000 - 10000, impact: '8% requests affected', conf: 76, assignee: 'Alex M.', acked: true },
  { id: '#INC-8935', sev: 'P2', title: 'Authentication token validation errors', service: 'auth-service', status: 'Monitoring', startedAt: Date.now() - 72 * 60 * 1000, impact: '4% requests affected', conf: 84, assignee: 'Priya S.', acked: true },
];

import { SERVICES } from './data';

export type ServiceHealth = {
  name: string;
  desc: string;
  status: 'critical' | 'warning' | 'healthy';
  cpu: string;
  mem: string;
  err: string;
  p99: string;
  pods: string;
  note: string;
};

interface AppState {
  env: Env;
  setEnv: (e: Env) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((p: boolean) => boolean)) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  assistantOpen: boolean;
  setAssistantOpen: (v: boolean) => void;
  toasts: Toast[];
  toast: (kind: ToastKind, title: string, body?: string) => void;
  dismissToast: (id: string) => void;
  incidents: ManagedIncident[];
  updateIncident: (id: string, patch: Partial<ManagedIncident>) => void;
  declareIncident: (input: { title: string; service: string; sev: 'P1' | 'P2' | 'P3'; impact: string }) => ManagedIncident;
  services: ServiceHealth[];
  live: boolean;
  setLive: (v: boolean) => void;
  lastRefresh: number;
  refresh: () => void;
  audit: { at: number; actor: string; action: string; detail: string }[];
  logAudit: (action: string, detail: string) => void;
}

const Ctx = createContext<AppState | null>(null);

const INC_KEY = 'ir-ai-incidents-v1';
const ENV_KEY = 'ir-ai-env';

function loadIncidents(): ManagedIncident[] {
  try {
    const raw = localStorage.getItem(INC_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as ManagedIncident[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED;
    return parsed;
  } catch {
    return SEED;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [env, setEnvState] = useState<Env>('Prod');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [incidents, setIncidents] = useState<ManagedIncident[]>(SEED);
  const [live, setLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [audit, setAudit] = useState<{ at: number; actor: string; action: string; detail: string }[]>([
    { at: Date.now() - 42 * 60000, actor: 'system', action: 'incident.declared', detail: '#INC-8941 opened by Automated Watcher' },
    { at: Date.now() - 35 * 60000, actor: 'alex.m', action: 'rca.started', detail: 'DeepRCA-70B synthesis for #INC-8941' },
    { at: Date.now() - 12 * 60000, actor: 'priya.s', action: 'incident.acked', detail: '#INC-8938 acknowledged' },
  ]);
  const idRef = useRef(0);

  useEffect(() => {
    try {
      const e = localStorage.getItem(ENV_KEY) as Env | null;
      if (e === 'Prod' || e === 'Staging' || e === 'Dev') setEnvState(e);
      setIncidents(loadIncidents());
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(INC_KEY, JSON.stringify(incidents));
    } catch { /* noop */ }
  }, [incidents]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, title: string, body?: string) => {
    const id = `t-${Date.now()}-${idRef.current++}`;
    setToasts((t) => [...t.slice(-3), { id, kind, title, body }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5200);
  }, [dismissToast]);

  const setEnv = useCallback((e: Env) => {
    setEnvState(e);
    try { localStorage.setItem(ENV_KEY, e); } catch { /* noop */ }
  }, []);

  const logAudit = useCallback((action: string, detail: string) => {
    setAudit((a) => [{ at: Date.now(), actor: 'alex.m', action, detail }, ...a].slice(0, 100));
  }, []);

  const updateIncident = useCallback((id: string, patch: Partial<ManagedIncident>) => {
    setIncidents((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const declareIncident = useCallback((input: { title: string; service: string; sev: 'P1' | 'P2' | 'P3'; impact: string }) => {
    const rec: ManagedIncident = {
      id: `#INC-${8900 + Math.floor(Math.random() * 90) + 50}`,
      sev: input.sev,
      title: input.title,
      service: input.service,
      status: 'Investigating',
      startedAt: Date.now(),
      impact: input.impact || 'Under assessment',
      conf: 60 + Math.floor(Math.random() * 25),
      assignee: 'Alex M.',
      acked: false,
    };
    setIncidents((l) => [rec, ...l]);
    setAudit((a) => [{ at: Date.now(), actor: 'alex.m', action: 'incident.declared', detail: `${rec.id} — ${rec.title}` }, ...a].slice(0, 100));
    return rec;
  }, []);

  const refresh = useCallback(() => setLastRefresh(Date.now()), []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setAssistantOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Live tick: single interval drives "last refresh" + polling hooks consume it.
  const [services] = useState<ServiceHealth[]>(SERVICES);
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setLastRefresh(Date.now()), 10000);
    return () => window.clearInterval(t);
  }, [live]);

  const value = useMemo<AppState>(
    () => ({
      env, setEnv, sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen,
      paletteOpen, setPaletteOpen, assistantOpen, setAssistantOpen,
      toasts, toast, dismissToast, incidents, updateIncident, declareIncident,
      services, live, setLive, lastRefresh, refresh, audit, logAudit,
    }),
    [env, sidebarCollapsed, mobileNavOpen, paletteOpen, assistantOpen, toasts, incidents, services, live, lastRefresh, audit, toast, dismissToast, setEnv, updateIncident, declareIncident, refresh, logAudit]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
