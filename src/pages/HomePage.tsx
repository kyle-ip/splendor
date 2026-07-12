import { Link } from 'react-router-dom';
import { getLessons, getLevelInfo } from '@/lib/lessons';
import { promo, gems } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';

const paths = [
  { level: 'intro' as const, gem: gems.emerald, roman: 'I' },
  { level: 'basics' as const, gem: gems.sapphire, roman: 'II' },
  { level: 'intermediate' as const, gem: gems.ruby, roman: 'III' },
  { level: 'advanced' as const, gem: gems.gold, roman: 'IV' },
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
    <div>
      <header className="relative mb-16 animate-fade-up">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div>
            <p className="font-serif text-[11px] tracking-[0.28em] uppercase text-splendor-muted mb-3">
              {t('homeEyebrow')}
            </p>
            <img
              src={promo.logo}
              alt="Splendor"
              className="h-11 md:h-12 w-auto object-contain mb-4"
            />
            <h1 className="font-display text-4xl md:text-[3rem] text-splendor-velvet leading-[1.15] mb-3">
              Splendor
            </h1>
            <div className="ornament-line my-6" />
            <p className="font-body text-splendor-muted text-lg max-w-md leading-relaxed">
              {t('homeTagline')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/learn/intro" className="btn-gilt">
                {t('startLearning')}
              </Link>
              <Link to="/tools/calculator" className="btn-outline">
                {t('openTools')}
              </Link>
            </div>
          </div>
          <div className="justify-self-center">
            <img
              src={promo.boxHero}
              alt="Splendor box"
              className="w-52 md:w-64 drop-shadow-lg"
            />
          </div>
        </div>
      </header>


      <section className="mb-12 animate-fade-up stagger-1">
        <h2 className="section-title mb-5">{t('componentsOverview')}</h2>
        <div className="panel overflow-hidden">
          <div className="bg-[#1a120e] p-3 md:p-4">
            <img
              src={promo.setup}
              alt="Splendor setup"
              className="w-full h-auto object-contain mx-auto"
            />
          </div>
          <p className="px-4 py-3 text-xs text-splendor-muted font-serif border-t border-splendor-line">
            {t('componentsCaption')}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {(Object.keys(gemLabels) as (keyof typeof gemLabels)[]).map((key) => (
            <div key={key} className="flex flex-col items-center gap-1 px-2 py-2">
              <img src={gems[key]} alt={gemLabels[key]} className="gem-img-lg" />
              <span className="text-[11px] font-serif text-splendor-muted">
                {gemLabels[key]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12 animate-fade-up stagger-2">
        <h2 className="section-title mb-5">{t('learningPath')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {paths.map(({ level, gem, roman }) => {
            const info = levelInfo[level];
            const levelLessons = lessons.filter((l) => l.level === level);

            return (
              <Link
                key={level}
                to={info.path}
                className="panel-soft group p-5 transition-all duration-300 hover:border-splendor-gold hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <img src={gem} alt="" className="gem-img-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-lg text-splendor-ink group-hover:text-splendor-velvet transition-colors">
                        {info.title}
                      </h3>
                      <span className="font-display text-xs text-splendor-accent">
                        {roman}
                      </span>
                    </div>
                    <p className="text-sm text-splendor-muted mt-1.5 leading-relaxed">
                      {info.description}
                    </p>
                    <p className="text-xs text-splendor-muted/70 mt-3 font-serif">
                      {info.duration} · {t('chaptersCount', { count: levelLessons.length })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-12 animate-fade-up stagger-2">
        <h2 className="section-title mb-5">{t('bgaResources')}</h2>
        <div className="panel-soft p-5 space-y-3">
          <p className="text-sm text-splendor-muted font-body leading-relaxed">
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
        </div>
      </section>

      <section className="mb-12 animate-fade-up stagger-3">
        <h2 className="section-title mb-5">{t('merchantTools')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { to: '/tools/calculator', label: t('navCalculator'), desc: t('toolCalcDesc') },
            { to: '/tools/nobles', label: t('navNobles'), desc: t('toolNoblesDesc') },
            { to: '/tools/card-value', label: t('navCardValue'), desc: t('toolCardDesc') },
            { to: '/tools/replay', label: t('navReplay'), desc: t('toolReplayDesc') },
            { to: '/tools/solo', label: t('navSoloPractice'), desc: t('toolSoloDesc') },
          ].map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="px-4 py-3 border border-splendor-line bg-white/70 hover:border-splendor-accent hover:bg-white transition-all"
            >
              <p className="font-serif text-splendor-velvet">{tool.label}</p>
              <p className="text-xs text-splendor-muted mt-1">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="animate-fade-up stagger-3 panel p-6 md:p-8">
        <h2 className="font-serif text-xl text-splendor-velvet mb-4 text-center tracking-wide">
          {t('quickStart')}
        </h2>
        <ol className="list-decimal list-inside space-y-2.5 text-splendor-ink/90 font-body">
          <li>
            <Link
              to="/learn/intro"
              className="text-splendor-velvet underline decoration-splendor-gold/50"
            >
              {t('navIntro')}
            </Link>
          </li>
          <li>
            <Link
              to="/learn/basics"
              className="text-splendor-velvet underline decoration-splendor-gold/50"
            >
              {t('navBasics')}
            </Link>
          </li>
          <li>
            <Link
              to="/reference/rules"
              className="text-splendor-velvet underline decoration-splendor-gold/50"
            >
              {t('navRules')}
            </Link>
          </li>
          <li>
            <a
              href="https://boardgamearena.com/gamepanel?game=splendor"
              className="text-splendor-velvet underline decoration-splendor-gold/50"
              target="_blank"
              rel="noreferrer"
            >
              Board Game Arena
            </a>
          </li>
        </ol>
      </section>
    </div>
  );
}
