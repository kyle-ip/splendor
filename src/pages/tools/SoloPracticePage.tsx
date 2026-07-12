import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { FixedCapitalPractice } from '@/features/solo/FixedCapitalPractice';
import { DiceAutomaPractice } from '@/features/solo/DiceAutomaPractice';
import { DragFxProvider } from '@/features/solo/DragFx';

export function SoloPracticeHubPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <header>
        <p className="font-serif text-[11px] tracking-[0.22em] uppercase text-splendor-muted mb-2">
          {t('ledgerTool')}
        </p>
        <h1 className="page-title">{t('soloHubTitle')}</h1>
        <div className="ornament-line my-4" />
        <p className="font-serif text-splendor-muted leading-relaxed max-w-3xl">
          {t('soloHubIntro')}
        </p>
        <Link
          to="/reference/solo"
          className="inline-block mt-4 text-sm font-serif text-splendor-accent hover:underline"
        >
          {t('soloHubRulesLink')} →
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/tools/solo/fixed"
          className="panel p-5 hover:border-splendor-gold transition-colors block"
        >
          <h2 className="font-serif text-lg text-splendor-velvet">
            {t('soloFixedTitle')}
          </h2>
          <p className="text-sm font-serif text-splendor-muted mt-2 leading-relaxed">
            {t('soloFixedDesc')}
          </p>
        </Link>
        <Link
          to="/tools/solo/dice"
          className="panel p-5 hover:border-splendor-gold transition-colors block"
        >
          <h2 className="font-serif text-lg text-splendor-velvet">
            {t('soloDiceTitle')}
          </h2>
          <p className="text-sm font-serif text-splendor-muted mt-2 leading-relaxed">
            {t('soloDiceDesc')}
          </p>
        </Link>
      </div>
    </div>
  );
}

export function SoloFixedPage() {
  return (
    <DragFxProvider>
      <FixedCapitalPractice />
    </DragFxProvider>
  );
}

export function SoloDicePage() {
  return (
    <DragFxProvider>
      <DiceAutomaPractice />
    </DragFxProvider>
  );
}
