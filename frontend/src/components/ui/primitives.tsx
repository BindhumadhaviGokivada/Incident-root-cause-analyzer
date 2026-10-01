'use client';
import React, { useEffect, useState } from 'react';
import { cx, formatClock } from '@/lib/format';

/* ---------- Badges ---------- */
export function SevBadge({ sev }: { sev: string }) {
  if (sev === 'P1')
    return (
      <span className="badge-critical" role="status" aria-label="Severity P1 critical">
        <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" aria-hidden />{sev}
      </span>
    );
  if (sev === 'P2') return <span className="badge-warning">{sev}</span>;
  return <span className="badge-healthy">{sev}</span>;
}

export function StatusDot({ status }: { status: 'critical' | 'warning' | 'healthy' }) {
  return (
    <span
      aria-hidden
      className={cx(
        'w-1.5 h-1.5 rounded-full',
        status === 'critical' && 'bg-error animate-ping',
        status === 'warning' && 'bg-secondary',
        status === 'healthy' && 'bg-tertiary'
      )}
    />
  );
}

export function LifecyclePill({ status }: { status: string }) {
  const color =
    status === 'Investigating' ? 'text-primary'
    : status === 'Analyzing' ? 'text-secondary'
    : status === 'Resolved' ? 'text-tertiary'
    : 'text-on-surface-variant';
  const dot =
    status === 'Investigating' ? 'bg-primary animate-pulse'
    : status === 'Analyzing' ? 'bg-secondary'
    : status === 'Resolved' ? 'bg-tertiary'
    : 'bg-outline';
  return (
    <span className={cx('inline-flex items-center gap-1.5 font-mono-data-xs text-mono-data-xs font-medium', color)}>
      <span className={cx('w-2 h-2 rounded-full', dot)} aria-hidden />{status}
    </span>
  );
}

/* ---------- Confidence ---------- */
export function ConfidenceMeter({ value, showBar = true }: { value: number; showBar?: boolean }) {
  const tone = value >= 85 ? 'text-secondary' : value >= 70 ? 'text-primary' : 'text-secondary-fixed';
  return (
    <div className="flex items-center gap-1.5" title={`AI confidence ${value}%`} aria-label={`AI confidence ${value} percent`}>
      <span className={cx('font-mono-data-xs text-mono-data-xs font-bold', tone)}>{value}%</span>
      {showBar && (
        <div className="w-12 bg-surface-container-lowest h-1.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
          <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${value}%` }} />
        </div>
      )}
    </div>
  );
}

/* ---------- Loading / empty / error ---------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={cx('animate-pulse rounded bg-surface-container-highest/60', className)} />;
}

export function EmptyState({ icon, title, body, action }: { icon: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-2" role="status">
      <span className="material-symbols-outlined text-[40px] text-outline" aria-hidden>{icon}</span>
      <div className="font-headline-sm text-headline-sm text-on-surface">{title}</div>
      {body && <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">{body}</p>}
      {action}
    </div>
  );
}

export function SectionHeader({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        {kicker && (
          <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase font-bold tracking-widest">{kicker}</span>
        )}
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold mt-1">{title}</h1>
        {sub && <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- Charts (dependency-free SVG) ---------- */
export function Sparkline({ path, color = 'currentColor', className = '', id }: { path: string; color?: string; className?: string; id: string }) {
  return (
    <div className={cx('h-9 w-full', className)} aria-hidden>
      <svg className="w-full h-full" style={{ color }} fill="none" preserveAspectRatio="none" viewBox="0 0 120 30">
        <defs>
          <linearGradient id={`sp-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L120,30 L0,30 Z`} fill={`url(#sp-${id})`} />
        <path d={path} stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function AreaChart({ path, color, peak, label, id }: { path: string; color: string; peak: string; label: string; id: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="font-body-sm text-body-sm text-on-surface font-semibold">{label}</span>
        <span className="font-mono-metric-md text-mono-metric-md font-bold" style={{ color }}>{peak}</span>
      </div>
      <div className="h-24 w-full" role="img" aria-label={`${label} trend, peak ${peak}`}>
        <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 280 64">
          <defs>
            <linearGradient id={`ac-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L260,64 L0,64 Z`} fill={`url(#ac-${id})`} />
          <path d={path} stroke={color} strokeLinecap="round" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex items-center justify-between mt-2 font-mono-data-xs text-mono-data-xs text-outline" aria-hidden>
        <span>-1h</span><span>-30m</span><span>Now</span>
      </div>
    </div>
  );
}

/* ---------- Live clock ---------- */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function LiveClock() {
  const now = useNow(1000);
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest rounded font-mono-data-xs text-mono-data-xs text-on-surface-variant" title="Cluster time (UTC)">
      <span className="material-symbols-outlined text-[14px] text-tertiary" aria-hidden>schedule</span>
      <time dateTime={now.toISOString()}>{formatClock(now)}</time>
    </span>
  );
}
