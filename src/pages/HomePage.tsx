import { Link } from 'react-router-dom';
import { getLessons, getLevelInfo } from '@/lib/lessons';
import { promo, gems } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { InkRule, WoodcutFrame } from '@/components/manuscript/WoodcutFrame';
import {
  TOOL_VISIBILITY,
  firstVisibleToolsPath,
} from '@/lib/toolVisibility';

const paths = [
  { level: 'intro' as const, roman: 'I' },
  { level: 'basics' as const, roman: 'II' },
  { level: 'intermediate' as const, roman: 'III' },
  { level: 'advanced' as const, roman: 'IV' },
  { level: 'duel' as const, roman: 'V' },
];

export function HomePage() {
  const { locale, t } = useI18n();
  const lessons = getLessons(locale);
  const levelInfo = getLevelInfo(locale, t);

  const gemLabels = {
    emerald: t('gemEmerald'),
    sapphire: t('gemSapphire'),
    ruby: t('gemRuby'),
    diamond: t('gemDiamond'),
    onyx: t('gemOnyx'),
    gold: t('gemGold'),
  } as const;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Title page */}
      <header className="mb-14 animate-fade-up text-center">
        <WoodcutFrame className="text-center">
          <p className="font-serif text-[11px] tracking-[0.28em] uppercase text-splendor-muted mb-4">
            {t('homeEyebrow')}
          </p>
          <img
            src={promo.logo}
            alt="Splendor"
            className="h-12 md:h-14 w-auto object-contain mx-auto mb-3"
          />
          <h1 className="font-display text-4xl md:text-[3.15rem] text-splendor-velvet leading-[1.12] tracking-woodcut">
            Splendor
          </h1>
          <InkRule className="my-5 mx-auto max-w-[12rem]" />
          <p className="font-body text-splendor-muted text-lg max-w-md mx-auto leading-relaxed">
            {t('homeTagline')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/learn/intro" className="btn-gilt">
              {t('startLearning')}
            </Link>
            <Link to={firstVisibleToolsPath()} className="btn-outline">
              {t('openTools')}
            </Link>
          </div>
        </WoodcutFrame>

        <figure className="mt-8 mx-auto max-w-[16rem]">
          <div className="plate-window p-3 md:p-4">
            <img
              src={promo.boxHero}
              alt="Splendor box"
              className="w-full h-auto object-contain mx-auto"
            />
          </div>
          <figcaption className="folio-caption mt-3 tracking-[0.12em] uppercase">
            Splendor
          </figcaption>
        </figure>
      </header>

      {/* Engraved plate */}
      <section className="mb-14 animate-fade-up stagger-1">
        <h2 className="section-title-folio mb-2">{t('componentsOverview')}</h2>
        <InkRule className="mx-auto mb-6 max-w-[10rem]" />
        <figure>
          <div className="plate-window p-2 md:p-3">
            <img
              src={promo.setup}
              alt="Splendor setup"
              className="w-full h-auto object-contain mx-auto"
            />
          </div>
          <figcaption className="folio-caption mt-3 px-2">
            {t('componentsCaption')}
          </figcaption>
        </figure>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 list-none p-0">
          {(Object.keys(gemLabels) as (keyof typeof gemLabels)[]).map((key) => (
            <li key={key} className="flex flex-col items-center gap-1">
              <img src={gems[key]} alt={gemLabels[key]} className="gem-img" />
              <span className="text-[10px] font-serif text-splendor-muted tracking-wide">
                {gemLabels[key]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Table of contents */}
      <section className="mb-14 animate-fade-up stagger-2">
        <h2 className="section-title-folio mb-2">{t('learningPath')}</h2>
        <InkRule className="mx-auto mb-6 max-w-[10rem]" />
        <nav aria-label={t('learningPath')} className="border-y border-splendor-line/35 py-1">
          {paths.map(({ level, roman }) => {
            const info = levelInfo[level];
            const levelLessons = lessons.filter((l) => l.level === level);

            return (
              <Link key={level} to={info.path} className="toc-row">
                <span className="toc-roman">{roman}</span>
                <span className="toc-title">{info.title}</span>
                <span className="toc-leader" aria-hidden />
                <span className="toc-meta">
                  {info.duration}
                  <span className="block opacity-70">
                    {t('chaptersCount', { count: levelLessons.length })}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      {/* Quick start — early, like a primer note */}
      <section className="mb-14 animate-fade-up stagger-2">
        <h2 className="section-title-folio mb-2">{t('quickStart')}</h2>
        <InkRule className="mx-auto mb-6 max-w-[10rem]" />
        <ol className="space-y-3 text-splendor-ink/90 font-body list-none pl-0">
          {[
            { to: '/learn/intro', label: t('navIntro'), external: false },
            { to: '/learn/basics', label: t('navBasics'), external: false },
            { to: '/learn/intermediate', label: t('pathAfterBasics'), external: false },
            { to: '/learn/advanced', label: t('navAdvanced'), external: false },
            { to: '/tools/solo', label: t('pathSoloOptional'), external: false },
            { to: '/learn/duel', label: t('pathDuelOptional'), external: false },
            { to: '/reference/rules', label: t('navRules'), external: false },
            {
              to: 'https://boardgamearena.com/gamepanel?game=splendor',
              label: 'Board Game Arena',
              external: true,
            },
          ].map((step, i) => (
            <li
              key={`${step.to}-${i}`}
              className="flex gap-3 items-baseline border-b border-splendor-line/15 pb-3 last:border-0"
            >
              <span className="font-display text-sm text-splendor-ink/55 tracking-woodcut w-6 shrink-0">
                {i + 1}.
              </span>
              {step.external ? (
                <a
                  href={step.to}
                  className="text-splendor-velvet underline decoration-splendor-ink/25 hover:decoration-splendor-velvet"
                  target="_blank"
                  rel="noreferrer"
                >
                  {step.label}
                </a>
              ) : (
                <Link
                  to={step.to}
                  className="text-splendor-velvet underline decoration-splendor-ink/25 hover:decoration-splendor-velvet"
                >
                  {step.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Tools index */}
      <section className="mb-14 animate-fade-up stagger-3">
        <h2 className="section-title-folio mb-2">{t('merchantTools')}</h2>
        <InkRule className="mx-auto mb-6 max-w-[10rem]" />
        <div className="border-y border-splendor-line/35 py-1">
          {(
            [
              TOOL_VISIBILITY.replay && {
                to: '/tools/replay',
                label: t('navReplay'),
                desc: t('toolReplayDesc'),
              },
              TOOL_VISIBILITY.solo && {
                to: '/tools/solo',
                label: t('navSoloPractice'),
                desc: t('toolSoloDesc'),
              },
              TOOL_VISIBILITY.standard && {
                to: '/tools/standard',
                label: t('navStandardPractice'),
                desc: t('toolStandardDesc'),
              },
            ] as (
              | { to: string; label: string; desc: string }
              | false
            )[]
          )
            .filter(
              (tool): tool is { to: string; label: string; desc: string } =>
                Boolean(tool),
            )
            .map((tool) => (
              <Link key={tool.to} to={tool.to} className="index-row">
                <span className="index-label">{tool.label}</span>
                <span className="toc-leader" aria-hidden />
                <span className="index-desc">{tool.desc}</span>
              </Link>
            ))}
        </div>
      </section>

      {/* Colophon-style BGA note */}
      <section className="animate-fade-up stagger-3 text-center">
        <h2 className="section-title-folio mb-2">{t('bgaResources')}</h2>
        <InkRule className="mx-auto mb-5 max-w-[10rem]" />
        <p className="text-sm text-splendor-muted font-body leading-relaxed mb-5 max-w-md mx-auto">
          {t('bgaNote')}
        </p>
        <a
          href="https://boardgamearena.com/gamepanel?game=splendor"
          target="_blank"
          rel="noreferrer"
          className="btn-gilt inline-flex"
        >
          {t('bgaPlay')}
        </a>
      </section>
    </div>
  );
}
