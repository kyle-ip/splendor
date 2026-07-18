import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getLevelInfo } from '@/lib/lessons';
import { promo } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ScrollProgress } from '@/components/PageTransition';
import { PageEnter } from '@/components/PageEnter';
import { DocumentTitle } from '@/components/DocumentTitle';
import { InkRule, Rubric, WoodcutMark } from '@/components/manuscript/WoodcutFrame';
import type { LessonLevel } from '@/types';
import { TOOL_VISIBILITY } from '@/lib/toolVisibility';

type NavItem = { to: string; label: string; roman?: string };

const SIDEBAR_COLLAPSED_KEY = 'splendor-sidebar-collapsed';

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function Layout() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);

  const toggleSidebar = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      queueMicrotask(() => {
        try {
          localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
        } catch {
          /* ignore */
        }
      });
      return next;
    });
  };

  const navGroups = useMemo(
    () => [
      {
        label: t('navTutorial'),
        items: [
          { to: '/', label: t('navHome') },
          { to: '/learn/intro', label: t('navIntro'), roman: 'I' },
          { to: '/learn/basics', label: t('navBasics'), roman: 'II' },
          { to: '/learn/intermediate', label: t('navIntermediate'), roman: 'III' },
          { to: '/learn/advanced', label: t('navAdvanced'), roman: 'IV' },
          { to: '/learn/duel', label: t('navDuel'), roman: 'V' },
        ] as NavItem[],
      },
      {
        label: t('navAppendix'),
        items: [
          { to: '/reference/glossary', label: t('navGlossary') },
          { to: '/reference/rules', label: t('navRules') },
          { to: '/reference/solo', label: t('navSolo') },
          { to: '/reference/expansions', label: t('navExpansions') },
        ] as NavItem[],
      },
      {
        label: t('navTools'),
        items: (
          [
            TOOL_VISIBILITY.replay && {
              to: '/tools/replay',
              label: t('navReplay'),
            },
            TOOL_VISIBILITY.solo && {
              to: '/tools/solo',
              label: t('navSoloPractice'),
            },
            TOOL_VISIBILITY.standard && {
              to: '/tools/standard',
              label: t('navStandardPractice'),
            },
          ] as (NavItem | false)[]
        ).filter((item): item is NavItem => Boolean(item)),
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const brandBlock = (opts?: { collapseControl?: boolean }) => (
    <>
      <div className="mb-1">
        <div
          className={`flex items-center gap-2 mb-2 ${
            opts?.collapseControl ? 'justify-between' : ''
          }`}
        >
          <NavLink
            to="/"
            className="group min-w-0"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src={promo.logo}
              alt="Splendor"
              className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </NavLink>
          {opts?.collapseControl && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="shrink-0 p-1 rounded-sm text-splendor-ink/70 hover:text-splendor-ink transition-colors"
              title={t('collapseSidebar')}
              aria-label={t('collapseSidebar')}
              aria-expanded
            >
              <WoodcutMark />
            </button>
          )}
        </div>
        <NavLink
          to="/"
          className="block group"
          onClick={() => setMenuOpen(false)}
        >
          <p className="text-[11px] text-splendor-muted tracking-[0.14em] uppercase font-serif group-hover:text-splendor-ink/80 transition-colors">
            {t('brandSubtitle')}
          </p>
        </NavLink>
      </div>

      <InkRule className="my-4 max-w-full" />

      <LanguageSwitch />
    </>
  );

  const navLinks = (
    <nav className="px-3 py-4 overflow-y-auto md:max-h-[calc(100vh-11rem)]">
      {navGroups.map((group, gi) => (
        <div
          key={group.label}
          className={
            gi > 0 ? 'mt-5 pt-4 border-t border-splendor-line/30' : 'mb-1'
          }
        >
          <div className="px-3 mb-2 text-center">
            <Rubric className="!mb-0">{group.label}</Rubric>
          </div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `nav-link-vintage ${isActive ? 'active' : ''}`
              }
            >
              {item.roman ? (
                <span className="inline-flex items-baseline gap-2 min-w-0">
                  <span className="font-display text-[11px] tracking-woodcut text-splendor-vermilion/80 w-4 shrink-0">
                    {item.roman}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
              ) : (
                item.label
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row relative z-0 ${
        sidebarCollapsed
          ? 'layout-shell--sidebar-collapsed'
          : 'layout-shell--sidebar-open'
      }`}
    >
      <DocumentTitle />
      <ScrollProgress />

      <header className="md:hidden sticky top-0 z-30 sidebar-ledger border-b-2 border-splendor-line/80 px-4 py-3 flex items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-2 min-w-0">
          <WoodcutMark className="text-splendor-ink/70 shrink-0" />
          <img
            src={promo.logo}
            alt="Splendor"
            className="h-8 w-auto object-contain"
          />
          <span className="font-display text-sm text-splendor-velvet tracking-woodcut truncate">
            Splendor
          </span>
        </NavLink>
        <button
          type="button"
          className="btn-outline !px-3 !py-1.5 text-xs"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? t('closeMenu') : t('openMenu')}
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          aria-label={t('closeMenu')}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Collapsed desktop rail — always mounted; opacity only (no layout thrash) */}
      <aside
        className={`sidebar-ledger layout-sidebar-rail hidden md:flex md:fixed md:inset-y-0 md:left-0 md:h-full md:w-11 z-40 flex-col items-center border-b-0 py-4 ${
          sidebarCollapsed
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!sidebarCollapsed}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 text-splendor-ink/70 hover:text-splendor-ink transition-colors"
          title={t('expandSidebar')}
          aria-label={t('expandSidebar')}
          aria-expanded={false}
          tabIndex={sidebarCollapsed ? 0 : -1}
        >
          <WoodcutMark />
        </button>
      </aside>

      {/* Full sidebar — slide with transform on desktop (compositor-friendly) */}
      <aside
        id="mobile-nav"
        className={`sidebar-ledger layout-sidebar-panel z-40 border-b md:border-b-0
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[15.5rem]
          max-md:transition-transform max-md:duration-200 max-md:ease-out
          md:fixed md:inset-y-0 md:left-0 md:h-full md:w-[15.5rem]
          md:transition-transform md:duration-200 md:ease-out
          ${menuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
          ${
            sidebarCollapsed
              ? 'md:-translate-x-full md:pointer-events-none'
              : 'md:translate-x-0'
          }`}
      >
        <div className="p-5 border-b border-splendor-line/50 hidden md:block">
          {brandBlock({ collapseControl: true })}
        </div>
        <div className="p-5 border-b border-splendor-line/50 md:hidden">
          {brandBlock()}
        </div>
        {navLinks}
      </aside>

      <main className="layout-main flex-1 relative z-0 min-w-0">
        <div className="px-2 md:px-4 py-5 md:py-8 practice-focus-main">
          <div className="ledger-sheet mx-auto px-4 md:px-8 py-6 md:py-10 practice-focus-sheet max-w-6xl xl:max-w-7xl">
            <PageEnter>
              <Outlet />
            </PageEnter>
          </div>
        </div>
        <footer className="mx-auto px-4 md:px-8 pb-10 text-center practice-focus-footer max-w-6xl xl:max-w-7xl">
          <InkRule className="mb-6 mx-auto max-w-xs" />
          <div className="text-[11px] text-splendor-muted/80 font-serif leading-relaxed space-y-2">
            <p>{t('footerArt')}</p>
            <p>
              <a
                href="https://boardgamearena.com/gamepanel?game=splendor"
                target="_blank"
                rel="noreferrer"
                className="text-splendor-velvet underline decoration-splendor-ink/30 hover:decoration-splendor-velvet transition-colors"
              >
                {t('bgaPlay')}
              </a>
              {' · '}
              {t('bgaNote')}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export function LevelHeader({ level }: { level: LessonLevel }) {
  const { locale, t } = useI18n();
  const info = getLevelInfo(locale, t)[level];
  return (
    <header className="mb-10 text-center md:text-left">
      <Rubric className="md:text-left">{t('chapterIndex')}</Rubric>
      <h1 className="page-title">{info.title}</h1>
      <InkRule className="my-5 md:mx-0 mx-auto" double knot="leaf" />
      <p className="font-serif text-lg text-splendor-muted leading-relaxed">
        {info.description}
      </p>
      <p className="text-sm text-splendor-muted/70 mt-2 font-serif">
        {t('estimated')} {info.duration}
      </p>
    </header>
  );
}
