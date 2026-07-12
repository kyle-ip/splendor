import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import noblesData from '@/data/nobles.json';
import type { NobleRequirement } from '@/types';
import { gems, nobleSample } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { useGemLabels } from '@/i18n/useGemLabels';
import { hasAnyGem, readBonusParams } from '@/lib/toolQuery';

const nobles = noblesData as NobleRequirement[];
type DiscountKey = 'emerald' | 'sapphire' | 'ruby' | 'diamond' | 'onyx';

const EMPTY_DISCOUNTS: Record<DiscountKey, number> = {
  emerald: 0,
  sapphire: 0,
  ruby: 0,
  diamond: 0,
  onyx: 0,
};

export function NobleTracker() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const [searchParams] = useSearchParams();
  const seeded = useMemo(() => {
    const bonuses = readBonusParams(searchParams);
    if (!hasAnyGem(bonuses)) return { ...EMPTY_DISCOUNTS };
    return {
      emerald: bonuses.emerald,
      sapphire: bonuses.sapphire,
      ruby: bonuses.ruby,
      diamond: bonuses.diamond,
      onyx: bonuses.onyx,
    };
  }, [searchParams]);
  const [discounts, setDiscounts] =
    useState<Record<DiscountKey, number>>(seeded);
  const colors: DiscountKey[] = [
    'emerald',
    'sapphire',
    'ruby',
    'diamond',
    'onyx',
  ];

  const update = (key: DiscountKey, delta: number) => {
    setDiscounts((d) => ({
      ...d,
      [key]: Math.max(0, Math.min(10, d[key] + delta)),
    }));
  };

  const matching = nobles.filter((noble) =>
    colors.every((c) => discounts[c] >= noble.requirements[c]),
  );

  const close = nobles
    .filter((n) => !matching.includes(n))
    .map((noble) => {
      const gaps = colors
        .map((c) => Math.max(0, noble.requirements[c] - discounts[c]))
        .reduce((a, b) => a + b, 0);
      return { noble, gaps };
    })
    .filter((x) => x.gaps <= 3)
    .sort((a, b) => a.gaps - b.gaps);

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-splendor-muted text-sm font-serif">{t('noblesIntro')}</p>

      <div className="panel overflow-hidden mb-2">
        <img
          src={nobleSample}
          alt={t('nobleSampleAlt')}
          className="w-full max-h-48 object-contain bg-[#1a120e]"
        />
      </div>

      <div className="panel p-5">
        {colors.map((key) => (
          <div key={key} className="flex items-center gap-3 mb-2">
            <img src={gems[key]} alt={labels[key]} className="gem-img" />
            <span className="w-16 text-sm font-serif">{labels[key]}</span>
            <button
              type="button"
              onClick={() => update(key, -1)}
              className="w-10 h-10 border border-splendor-line bg-white"
            >
              −
            </button>
            <span className="w-8 text-center font-display">{discounts[key]}</span>
            <button
              type="button"
              onClick={() => update(key, 1)}
              className="w-10 h-10 border border-splendor-line bg-white"
            >
              +
            </button>
          </div>
        ))}
      </div>

      <section>
        <h3 className="font-serif text-lg text-splendor-velvet mb-3">
          {t('noblesReady', { count: matching.length })}
        </h3>
        {matching.length === 0 ? (
          <p className="text-splendor-muted text-sm font-serif">{t('noblesNone')}</p>
        ) : (
          <div className="grid gap-2">
            {matching.map((n) => (
              <NobleCard key={n.id} noble={n} status="ready" />
            ))}
          </div>
        )}
      </section>

      {close.length > 0 && (
        <section>
          <h3 className="font-serif text-lg text-splendor-ink mb-3">
            {t('noblesClose')}
          </h3>
          <div className="grid gap-2">
            {close.map(({ noble, gaps }) => (
              <NobleCard key={noble.id} noble={noble} status="close" gaps={gaps} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NobleCard({
  noble,
  status,
  gaps,
}: {
  noble: NobleRequirement;
  status: 'ready' | 'close';
  gaps?: number;
}) {
  const { t, locale } = useI18n();
  const colors = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

  return (
    <div
      className={`p-4 panel-soft ${
        status === 'ready' ? 'ring-1 ring-gem-emerald/40' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-serif text-splendor-ink">
          {noble.name[locale] ?? noble.name.en}
        </span>
        <span className="font-display text-sm text-splendor-accent">
          {t('prestigePlus3')}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map(
          (c) =>
            noble.requirements[c] > 0 && (
              <span
                key={c}
                className="text-xs px-2 py-1 border border-splendor-line bg-white flex items-center gap-1"
              >
                <img src={gems[c]} alt="" className="w-6 h-6 object-contain" />
                {noble.requirements[c]}
              </span>
            ),
        )}
      </div>
      {status === 'close' && gaps !== undefined && (
        <p className="text-xs text-splendor-muted mt-2 font-serif">
          {t('gapsLeft', { gaps })}
        </p>
      )}
    </div>
  );
}
