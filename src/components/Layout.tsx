import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getLevelInfo } from '@/lib/lessons';
import { promo, gems } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ScrollProgress } from '@/components/PageTransition';
import { PageEnter } from '@/components/PageEnter';
import type { LessonLevel } from '@/types';

export function Layout() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const navGroups = useMemo(
    () => [
      {
        label: t('navTutorial'),
        items: [
          { to: '/', label: t('navHome') },
          { to: '/learn/intro', label: t('navIntro') },
          { to: '/learn/basics', label: t('navBasics') },
          { to: '/learn/intermediate', label: t('navIntermediate') },
          { to: '/learn/advanced', label: t('navAdvanced') },
        ],
      },
      {
        label: t('navTools'),
        items: [
          { to: '/tools/calculator', label: t('navCalculator') },
          { to: '/tools/nobles', label: t('navNobles') },
          { to: '/tools/card-value', label: t('navCardValue') },
          { to: '/tools/replay', label: t('navReplay') },
          { to: '/tools/solo', label: t('navSoloPractice') },
        ],
      },
      {
        label: t('navAppendix'),
        items: [
          { to: '/reference/rules', label: t('navRules') },
          { to: '/reference/solo', label: t('navSolo') },
          { to: '/reference/expansions', label: t('navExpansions') },
        ],
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
      <NavLink to="/" className="block group" onClick={() => setMenuOpen(false)}>
        <img
          src={promo.logo}
          alt="Splendor"
          className="h-10 w-auto object-contain mb-2.5 group-hover:opacity-90 transition-opacity"
        />
        <p className="font-display text-base text-splendor-velvet tracking-[0.06em]">
          Splendor
        </p>
        <p className="text-[11px] text-splendor-muted mt-1 tracking-wide font-serif">
          {t('brandSubtitle')}
        </p>
      </NavLink>

      <div className="mt-4">
        <LanguageSwitch />
      </div>

      <div className="mt-4 flex gap-1 justify-center opacity-85">
        {(Object.keys(gems) as (keyof typeof gems)[]).map((key) => (
          <img
            key={key}
            src={gems[key]}
            alt=""
            className="w-7 h-7 object-contain"
          />
        ))}
      </div>
    </>
  );

  const navLinks = (
    <nav className="p-3 overflow-y-auto md:max-h-[calc(100vh-12rem)]">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 mb-1 text-[10px] tracking-[0.22em] uppercase text-splendor-muted/80 font-serif">
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
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative z-0">
      <ScrollProgress />

      <header className="md:hidden sticky top-0 z-30 sidebar-ledger border-b border-splendor-line/70 px-4 py-3 flex items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-2 min-w-0">
          <img
            src={promo.logo}
            alt="Splendor"
            className="h-8 w-auto object-contain"
          />
          <span className="font-display text-sm text-splendor-velvet truncate">
            Splendor
          </span>
        </NavLink>
        <button
          type="button"
          className="px-3 py-1.5 border border-splendor-line bg-white/70 font-serif text-xs tracking-wide text-splendor-ink"
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
          className="md:hidden fixed inset-0 z-30 bg-black/35"
          aria-label={t('closeMenu')}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        id="mobile-nav"
        className={`sidebar-ledger md:w-[17rem] md:fixed md:h-full flex-shrink-0 z-40 border-b md:border-b-0
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[17rem] max-md:shadow-xl
          max-md:transition-transform max-md:duration-200
          ${menuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
          md:translate-x-0`}
      >
        <div className="p-5 border-b border-splendor-line/70 hidden md:block">
          {brandBlock}
        </div>
        <div className="p-5 border-b border-splendor-line/70 md:hidden">
          {brandBlock}
        </div>
        {navLinks}
      </aside>

      <main className="flex-1 md:ml-[17rem] relative z-0">
        <div className="max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <PageEnter>
            <Outlet />
          </PageEnter>
        </div>
        <footer className="max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 pb-12">
          <div className="ornament-line mb-6" />
          <div className="text-[11px] text-splendor-muted/80 font-serif leading-relaxed space-y-2">
            <p>{t('footerArt')}</p>
            <p>
              <a
                href="https://boardgamearena.com/gamepanel?game=splendor"
                target="_blank"
                rel="noreferrer"
                className="text-splendor-velvet underline decoration-splendor-gold/50 hover:decoration-splendor-velvet transition-colors"
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
    <header className="mb-10">
      <p className="text-[11px] tracking-[0.28em] uppercase text-splendor-muted font-serif mb-2">
        {t('chapterIndex')}
      </p>
      <h1 className="page-title">{info.title}</h1>
      <div className="ornament-line my-5" />
      <p className="font-serif text-lg text-splendor-muted leading-relaxed">
        {info.description}
      </p>
      <p className="text-sm text-splendor-muted/70 mt-2 font-serif">
        {t('estimated')} {info.duration}
      </p>
    </header>
  );
}
