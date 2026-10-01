'use client';
import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-store';

/**
 * Enterprise top bar — ONE canonical header used by every page via AppShell.
 * Replaces the 5+ duplicated fixed headers.
 */
export default function TopBar({ breadcrumb = 'Overview' }: { breadcrumb?: string }) {
  const { env, setPaletteOpen, live, setLive, assistantOpen, setAssistantOpen, lastRefresh, toast } = useApp();
  const degraded = true;

  useEffect(() => {
    document.title = `IncidentRootAI · ${breadcrumb}`;
  }, [breadcrumb]);

  return (
    <header className="sticky top-0 z-40 h-14 bg-surface-container-low/90 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between gap-3 px-4 lg:px-6">
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 font-mono-data-xs text-mono-data-xs text-on-surface-variant min-w-0">
        <span className="hover:text-on-surface cursor-pointer">prod</span>
        <span className="text-outline" aria-hidden>/</span>
        <span className="hover:text-on-surface cursor-pointer">us-east-1</span>
        <span className="text-outline" aria-hidden>/</span>
        <span className="text-primary font-semibold truncate">{breadcrumb}</span>
        <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 text-outline uppercase tracking-wider" title={`Environment: ${env}`}>{env}</span>
      </nav>

      <div className="flex-1 max-w-xl">
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-8 pr-14 py-1.5 font-body-sm text-body-sm text-outline hover:border-primary hover:text-on-surface-variant transition-colors relative text-left"
          aria-label="Open command palette (Control K)"
        >
          <span className="material-symbols-outlined absolute left-2 text-[16px] pointer-events-none" aria-hidden>search</span>
          <span className="truncate">Search traces, incidents, services…</span>
          <span className="absolute right-2 hidden sm:flex items-center gap-1" aria-hidden>
            <kbd className="font-mono-data-xs text-mono-data-xs bg-surface-container px-1 rounded border border-outline-variant/40 text-on-surface-variant">⌘</kbd>
            <kbd className="font-mono-data-xs text-mono-data-xs bg-surface-container px-1 rounded border border-outline-variant/40 text-on-surface-variant">K</kbd>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {degraded && (
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-error-container/30 border border-error/30 rounded-lg" role="status">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" aria-hidden />
            <span className="font-mono-data-xs text-mono-data-xs text-error font-semibold">DEGRADED</span>
          </span>
        )}
        <button
          onClick={() => { setLive(!live); toast('info', live ? 'Live updates paused' : 'Live updates resumed'); }}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/40 rounded-lg font-mono-data-xs text-mono-data-xs text-on-surface hover:border-tertiary transition-colors"
          aria-pressed={live}
          title={live ? 'Pause live updates' : 'Resume live updates'}
        >
          <span className={`material-symbols-outlined text-[14px] text-tertiary ${live ? 'animate-spin' : ''}`} aria-hidden>sync</span>
          <span className="hidden lg:inline">{live ? 'Live (10s)' : 'Paused'}</span>
        </button>
        <button
          onClick={() => setAssistantOpen(!assistantOpen)}
          className={`p-1.5 rounded-lg border transition-colors ${assistantOpen ? 'bg-secondary-container text-on-secondary-container border-secondary/40' : 'text-on-surface-variant hover:text-on-surface border-transparent hover:bg-surface-container'}`}
          aria-label="Toggle AI assistant"
          aria-pressed={assistantOpen}
          title="AI Assistant"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden>smart_toy</span>
        </button>
        <button
          className="relative p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
          aria-label="4 unread notifications"
          onClick={() => toast('info', '4 notifications', '2 firing alerts · 1 deployment · 1 mention')}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden>notifications</span>
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-error text-on-error rounded-full flex items-center justify-center text-[10px] font-bold leading-none" aria-hidden>4</span>
        </button>
      </div>
    </header>
  );
}
