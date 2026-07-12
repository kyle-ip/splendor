import { NavLink, Outlet } from 'react-router-dom';
import { useMemo } from 'react';
import { getLevelInfo } from '@/lib/lessons';
import { promo, gems } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ScrollProgress } from '@/components/PageTransition';
import { PageEnter } from '@/components/PageEnter';
import type { LessonLevel } from '@/types';

export function Layout() {
  const { t } = useI18n();

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative z-0">
      <ScrollProgress />

      <aside className="sidebar-ledger md:w-[17rem] md:fixed md:h-full flex-shrink-0 z-20 border-b md:border-b-0">
        <div className="p-5 border-b border-splendor-line/70">
          <NavLink to="/" className="block group">
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
        </div>

        <nav className="p-3 overflow-y-auto max-h-56 md:max-h-[calc(100vh-12rem)]">
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
