import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getLevelInfo } from '@/lib/lessons';
import { promo } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ScrollProgress } from '@/components/PageTransition';
import { PageEnter } from '@/components/PageEnter';
import { DocumentTitle } from '@/components/DocumentTitle';
import { InkRule, WoodcutMark } from '@/components/manuscript/WoodcutFrame';
import type { LessonLevel } from '@/types';

type NavItem = { to: string; label: string; roman?: string };

export function Layout() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

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
        label: t('navTools'),
        items: [
          { to: '/tools/calculator', label: t('navCalculator') },
          { to: '/tools/nobles', label: t('navNobles') },
          { to: '/tools/card-value', label: t('navCardValue') },
          { to: '/tools/replay', label: t('navReplay') },
          { to: '/tools/solo', label: t('navSoloPractice') },
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

  const brandBlock = (
    <>
      <div className="flex items-start justify-between gap-2 mb-1">
        <WoodcutMark className="text-splendor-ink/70 mt-0.5 shrink-0" />
        <NavLink
          to="/"
          className="block group flex-1 min-w-0"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src={promo.logo}
            alt="Splendor"
            className="h-9 w-auto object-contain mb-2 group-hover:opacity-90 transition-opacity"
          />
          <p className="font-display text-base text-splendor-velvet tracking-woodcut">
            Splendor
          </p>
          <p className="text-[11px] text-splendor-muted mt-1 tracking-[0.14em] uppercase font-serif">
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
        <div key={group.label} className={gi > 0 ? 'mt-5 pt-4 border-t border-splendor-line/30' : 'mb-1'}>
          <p className="px-3 mb-2 text-[10px] tracking-[0.22em] uppercase text-splendor-muted/80 font-serif text-center">
            {group.label}
          </p>
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
                  <span className="font-display text-[11px] tracking-woodcut opacity-70 w-4 shrink-0">
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
    <div className="min-h-screen flex flex-col md:flex-row relative z-0">
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

      <aside
        id="mobile-nav"
        className={`sidebar-ledger md:w-[15.5rem] md:fixed md:h-full flex-shrink-0 z-40 border-b md:border-b-0
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[15.5rem]
          max-md:transition-transform max-md:duration-200
          ${menuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
          md:translate-x-0`}
      >
        <div className="p-5 border-b border-splendor-line/50 hidden md:block">
          {brandBlock}
        </div>
        <div className="p-5 border-b border-splendor-line/50 md:hidden">
          {brandBlock}
        </div>
        {navLinks}
      </aside>

      <main className="flex-1 md:ml-[15.5rem] relative z-0">
        <div className="px-2 md:px-4 py-5 md:py-8">
          <div className="ledger-sheet max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
            <PageEnter>
              <Outlet />
            </PageEnter>
          </div>
        </div>
        <footer className="max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-8 pb-10">
          <InkRule className="mb-6 max-w-xs" />
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
      <p className="text-[11px] tracking-[0.28em] uppercase text-splendor-muted font-serif mb-2">
        {t('chapterIndex')}
      </p>
      <h1 className="page-title">{info.title}</h1>
      <InkRule className="my-5 md:mx-0 mx-auto" />
      <p className="font-serif text-lg text-splendor-muted leading-relaxed">
        {info.description}
      </p>
      <p className="text-sm text-splendor-muted/70 mt-2 font-serif">
        {t('estimated')} {info.duration}
      </p>
    </header>
  );
}
