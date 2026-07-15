import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  readSoloPracticeTier,
  writeSoloPracticeTier,
  type SoloPracticeTier,
} from './practiceTier';

export function SoloPracticeTierPicker({
  value,
  onChange,
}: {
  value: SoloPracticeTier;
  onChange: (tier: SoloPracticeTier) => void;
}) {
  const { t } = useI18n();
  const tiers: SoloPracticeTier[] = ['easy', 'normal', 'hard'];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-serif text-splendor-muted tracking-wide uppercase">
        {t('soloPracticeTier')}
      </span>
      {tiers.map((tier) => (
        <button
          key={tier}
          type="button"
          onClick={() => onChange(tier)}
          className={`btn-outline text-sm ${
            value === tier
              ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
              : ''
          }`}
        >
          {t(
            tier === 'easy'
              ? 'soloTier_easy'
              : tier === 'hard'
                ? 'soloTier_hard'
                : 'soloTier_normal',
          )}
        </button>
      ))}
    </div>
  );
}

/** Persist practice tier; restart games when caller reacts to `tier` change. */
export function useSoloPracticeTier(): {
  tier: SoloPracticeTier;
  setTier: (t: SoloPracticeTier) => void;
} {
  const [tier, setTierState] = useState<SoloPracticeTier>(() =>
    typeof window !== 'undefined' ? readSoloPracticeTier() : 'normal',
  );

  useEffect(() => {
    writeSoloPracticeTier(tier);
  }, [tier]);

  return {
    tier,
    setTier: setTierState,
  };
}
