'use client';
import React, { useEffect } from 'react';
import { useApp, ToastKind } from '@/lib/app-store';
import { cx } from '@/lib/format';

const ICONS: Record<ToastKind, string> = {
  success: 'check_circle',
  info: 'info',
  warning: 'warning',
  error: 'error',
};

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)]"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} {...t} onClose={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ id, kind, title, body, onClose }: { id: string; kind: ToastKind; title: string; body?: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2.5 p-3 rounded-xl border shadow-xl backdrop-blur-md',
        'bg-surface-container-low/95 border-outline-variant/30 animate-[slideIn_.2s_ease-out]',
        kind === 'error' && 'border-error/40',
        kind === 'success' && 'border-tertiary/40'
      )}
    >
      <span
        className={cx(
          'material-symbols-outlined text-[20px]',
          kind === 'error' && 'text-error',
          kind === 'success' && 'text-tertiary',
          kind === 'warning' && 'text-secondary',
          kind === 'info' && 'text-primary'
        )}
        aria-hidden
      >
        {ICONS[kind]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-body-sm text-body-sm text-on-surface font-semibold leading-tight">{title}</div>
        {body && <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 break-words">{body}</div>}
      </div>
      <button
        onClick={onClose}
        aria-label={`Dismiss notification: ${title}`}
        className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden>close</span>
      </button>
    </div>
  );
}
