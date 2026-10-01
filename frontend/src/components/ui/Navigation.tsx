'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp, Env } from '@/lib/app-store';
import { cx } from '@/lib/format';

const CORE: { href: string; icon: string; label: string; match: (p: string) => boolean; badge?: string }[] = [
  { href: '/', icon: 'dashboard', label: 'Overview', match: (p) => p === '/' },
  { href: '/incidents/new', icon: 'emergency_home', label: 'Incidents', match: (p) => p.startsWith('/incidents'), badge: '3' },
  { href: '/telemetry', icon: 'monitoring', label: 'Observability', match: (p) => p === '/telemetry' },
  { href: '/topology', icon: 'hub', label: 'Service Topology', match: (p) => p === '/topology' },
  { href: '/deployments', icon: 'rocket_launch', label: 'Deployments', match: (p) => p === '/deployments' },
  { href: '/slo', icon: 'speed', label: 'SLO & Burn', match: (p) => p === '/slo' },
  { href: '/oncall', icon: 'support_agent', label: 'On-Call', match: (p) => p === '/oncall' },
  { href: '/settings', icon: 'settings', label: 'Settings', match: (p) => p === '/settings' },
  { href: '/auth', icon: 'person', label: 'Auth & Access', match: (p) => p === '/auth' },
];

const AI: { icon: string; label: string; meta?: string }[] = [
  { icon: 'psychology', label: 'RCA Analysis', meta: 'AI' },
  { icon: 'smart_toy', label: 'AI Assistant', meta: '●' },
];

export default function Navigation() {
  const pathname = usePathname() || '/';
  const {
    env, setEnv, sidebarCollapsed, setSidebarCollapsed,
    mobileNavOpen, setMobileNavOpen, setPaletteOpen, setAssistantOpen, incidents,
  } = useApp();

  const openCount = incidents.filter((i) => i.status !== 'Resolved').length;

  const sidebar = (isMobile: boolean) => (
    <div className={cx('flex flex-col h-full', sidebarCollapsed && !isMobile && 'items-center')}>
      {/* Brand */}
      <div className={cx('h-14 px-3 flex items-center gap-2.5 border-b border-outline-variant/20 w-full', sidebarCollapsed && !isMobile && 'justify-center px-0')}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-container/30 border border-primary/20 shrink-0" aria-hidden>
          <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
        </div>
        {(!sidebarCollapsed || isMobile) && (
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate leading-none">IncidentRootAI</span>
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider mt-1 leading-none">AI-Powered RCA</span>
          </div>
        )}
      </div>

      {/* Collapse (desktop) */}
      {!isMobile && (
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="mx-2 mt-2 p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface self-end"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>{sidebarCollapsed ? 'chevron_right' : 'chevron_left'}</span>
        </button>
      )}

      {/* Env switcher */}
      {(!sidebarCollapsed || isMobile) ? (
        <div className="p-1 mx-2 mt-1 bg-surface-container-lowest/60 rounded-lg flex items-center gap-1" role="group" aria-label="Environment">
          {(['Prod', 'Staging', 'Dev'] as Env[]).map((e) => (
            <button
              key={e}
              onClick={() => setEnv(e)}
              aria-pressed={env === e}
              className={cx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-mono-data-xs text-mono-data-xs transition-colors',
                env === e ? 'bg-surface-container text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              {e === 'Prod' && env === 'Prod' && <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" aria-hidden />}
              {e}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2 w-2 h-2 rounded-full bg-tertiary animate-pulse" title={`Env: ${env}`} aria-label={`Environment ${env}`} />
      )}

      {/* Nav */}
      <nav aria-label="Primary" className={cx('flex-1 overflow-y-auto px-2 py-2 space-y-0.5 w-full', sidebarCollapsed && !isMobile && 'px-1')}>
        {(!sidebarCollapsed || isMobile) && (
          <span className="px-2 py-1 font-label-caps text-label-caps text-outline uppercase tracking-wider block">Command Core</span>
        )}
        {CORE.map((n) => {
          const active = n.match(pathname);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              onClick={() => setMobileNavOpen(false)}
              title={sidebarCollapsed && !isMobile ? n.label : undefined}
              className={cx(active ? 'nav-link-active' : 'nav-link', sidebarCollapsed && !isMobile && 'justify-center')}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={cx('material-symbols-outlined text-[18px]', active && 'text-primary')} aria-hidden>{n.icon}</span>
                {(!sidebarCollapsed || isMobile) && <span className="font-body-sm text-body-sm truncate">{n.label}</span>}
              </span>
              {(!sidebarCollapsed || isMobile) && n.badge && (
                <span className="bg-error-container/40 text-error border border-error/30 font-mono-data-xs text-mono-data-xs px-1.5 py-0.5 rounded-full leading-none" aria-label={`${openCount} open incidents`}>{openCount}</span>
              )}
            </Link>
          );
        })}

        {(!sidebarCollapsed || isMobile) && (
          <div className="pt-2">
            <span className="px-2 py-1 font-label-caps text-label-caps text-outline uppercase tracking-wider block">AI Engine</span>
            <button onClick={() => { setAssistantOpen(true); setMobileNavOpen(false); }} className="nav-link w-full text-left">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden>smart_toy</span>
                <span className="font-body-sm text-body-sm">AI Assistant</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#d0bcff]" aria-hidden />
            </button>
            <button onClick={() => { setPaletteOpen(true); setMobileNavOpen(false); }} className="nav-link w-full text-left">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden>keyboard_command_key</span>
                <span className="font-body-sm text-body-sm">Command (⌘K)</span>
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-2 border-t border-outline-variant/20 space-y-1.5">
          <div className="p-2 bg-surface-container-lowest/80 border border-outline-variant/30 rounded-lg flex items-center justify-between" role="status">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-tertiary" aria-hidden />
              <span className="font-mono-data-xs text-mono-data-xs text-on-surface truncate">Core Cluster: OK</span>
            </span>
            <span className="font-mono-data-xs text-mono-data-xs text-tertiary">99.94%</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center border border-outline-variant/50 shrink-0" aria-hidden>
              <span className="material-symbols-outlined text-[16px] text-on-secondary-container">support_agent</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate leading-none">Alex Morgan</span>
              <span className="font-mono-data-xs text-mono-data-xs text-on-surface-variant truncate mt-1 leading-none">Staff SRE / On-Call</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label="Sidebar"
        className={cx(
          'hidden lg:flex fixed left-0 top-0 h-full bg-surface-container-low border-r border-outline-variant/30 z-50 flex-col justify-between select-none transition-[width] duration-200',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebar(false)}
      </aside>

      {/* Mobile top strip */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 z-50 bg-surface-container-low/95 backdrop-blur border-b border-outline-variant/30 flex items-center justify-between px-3">
        <button onClick={() => setMobileNavOpen(true)} aria-label="Open navigation" className="p-2 rounded-lg hover:bg-surface-container text-on-surface">
          <span className="material-symbols-outlined" aria-hidden>menu</span>
        </button>
        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">IncidentRootAI</span>
        <button onClick={() => setPaletteOpen(true)} aria-label="Open search" className="p-2 rounded-lg hover:bg-surface-container text-on-surface">
          <span className="material-symbols-outlined" aria-hidden>search</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} aria-hidden />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface-container-low border-r border-outline-variant/40 shadow-2xl">
            <button onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" className="absolute right-2 top-3 p-1.5 rounded-lg hover:bg-surface-container text-outline">
              <span className="material-symbols-outlined" aria-hidden>close</span>
            </button>
            {sidebar(true)}
          </aside>
        </div>
      )}
      {/* Spacer so AppShell offset works on mobile (top strip) */}
      <div className="lg:hidden h-12" aria-hidden />
    </>
  );
}
