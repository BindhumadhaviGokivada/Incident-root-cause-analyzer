'use client';
import React from 'react';
import { useApp } from '@/lib/app-store';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import Toasts from './Toasts';
import AIAssistant from './AIAssistant';
import { cx } from '@/lib/format';

/**
 * Canonical page frame: sidebar offset + sticky TopBar + global overlays.
 * All pages render inside this — no per-page fixed headers.
 */
export default function AppShell({ breadcrumb, children }: { breadcrumb: string; children: React.ReactNode }) {
  const { sidebarCollapsed, mobileNavOpen } = useApp();
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className={cx('transition-[padding] duration-200', sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        <TopBar breadcrumb={breadcrumb} />
        <main id="main" className="w-full p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto" tabIndex={-1}>
          {children}
        </main>
        <footer className="px-4 lg:px-6 pb-8 max-w-[1400px] mx-auto font-mono-data-xs text-mono-data-xs text-outline flex flex-wrap gap-2 items-center justify-between">
          <span>IncidentRootAI · cluster-omega · {breadcrumb}</span>
          <span>v2.18.4-rca · SOC2 · status: degraded (2 nodes)</span>
        </footer>
      </div>
      <CommandPalette />
      <Toasts />
      <AIAssistant />
    </div>
  );
}
