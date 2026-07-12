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
        <p className="font-serif text-splendor-muted leading-relaxed max-w-2xl">
          {t('soloHubIntro')}
        </p>
        <Link
          to="/reference/solo"
          className="inline-block mt-4 text-sm font-serif text-splendor-velvet hover:underline"
        >
          {t('soloHubRulesLink')} →
        </Link>
      </header>

      <div className="border-y border-splendor-line/35 py-1">
        <Link to="/tools/solo/fixed" className="index-row !items-start py-4">
          <span className="index-label text-lg">{t('soloFixedTitle')}</span>
          <span className="toc-leader mt-3" aria-hidden />
          <span className="index-desc max-w-[14rem] leading-relaxed">
            {t('soloFixedDesc')}
          </span>
        </Link>
        <Link to="/tools/solo/dice" className="index-row !items-start py-4">
          <span className="index-label text-lg">{t('soloDiceTitle')}</span>
          <span className="toc-leader mt-3" aria-hidden />
          <span className="index-desc max-w-[14rem] leading-relaxed">
            {t('soloDiceDesc')}
          </span>
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
