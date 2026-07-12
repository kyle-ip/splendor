import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GemCounts } from '@/types';
import { canAffordCard, EMPTY_GEMS } from '@/lib/gems';
import { GemCounter } from '@/components/GemCounter';
import { gems } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { useGemLabels } from '@/i18n/useGemLabels';
import {
  hasAnyGem,
  readBonusParams,
  readCostParams,
  readHandParams,
} from '@/lib/toolQuery';

function initialFromQuery(params: URLSearchParams) {
  const bonuses = readBonusParams(params);
  const hand = readHandParams(params);
  const cost = readCostParams(params);
  return {
    discounts: hasAnyGem(bonuses) ? bonuses : { ...EMPTY_GEMS },
    hand: hasAnyGem(hand) ? hand : { ...EMPTY_GEMS },
    cost: hasAnyGem({ ...cost, gold: 0 })
      ? cost
      : { emerald: 0, sapphire: 0, ruby: 0, diamond: 0, onyx: 0 },
  };
}

export function CostCalculator() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const [searchParams] = useSearchParams();
  const seeded = useMemo(() => initialFromQuery(searchParams), [searchParams]);
  const [discounts, setDiscounts] = useState<GemCounts>(seeded.discounts);
  const [hand, setHand] = useState<GemCounts>(seeded.hand);
  const [cost, setCost] = useState(seeded.cost);
  const { canBuy, needed, shortfall } = canAffordCard(cost, discounts, hand);
  const costColors = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-splendor-muted text-sm font-serif leading-relaxed">
        {t('calcIntro')}
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="panel p-5">
          <GemCounter
            label={t('permanentDiscounts')}
            values={discounts}
            onChange={setDiscounts}
            showGold={false}
          />
        </div>
        <div className="panel p-5">
          <GemCounter label={t('gemsInHand')} values={hand} onChange={setHand} />
        </div>
      </div>

      <div className="panel p-5">
        <p className="text-sm font-serif text-splendor-ink/80 mb-3 tracking-wide">
          {t('targetCardCost')}
        </p>
        <div className="space-y-2">
          {costColors.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <img src={gems[key]} alt={labels[key]} className="gem-img" />
              <span className="w-16 text-sm font-serif">{labels[key]}</span>
              <input
                type="number"
                min={0}
                max={10}
                value={cost[key]}
                onChange={(e) =>
                  setCost({ ...cost, [key]: Math.max(0, Number(e.target.value)) })
                }
                className="w-20 px-2 py-1 border border-splendor-line bg-white text-center font-display"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className={`panel p-5 ${
          canBuy ? 'ring-2 ring-gem-emerald/40' : 'ring-2 ring-gem-ruby/40'
        }`}
      >
        <p className="font-display text-lg text-splendor-ink mb-2">
          {canBuy ? t('canBuy') : t('cannotBuy')}
        </p>
        <p className="text-sm text-splendor-ink/80 font-body">
          {t('afterDiscountPay')}
          {costColors.map((k) =>
            needed[k] > 0 ? (
              <span key={k} className="ml-2 inline-flex items-center gap-1">
                <img src={gems[k]} alt="" className="w-6 h-6 object-contain" />×
                {needed[k]}
              </span>
            ) : null,
          )}
          {needed.gold > 0 && (
            <span className="ml-2 inline-flex items-center gap-1">
              <img src={gems.gold} alt="" className="w-6 h-6 object-contain" />×
              {needed.gold}
              {t('goldToCover')}
            </span>
          )}
        </p>
        {!canBuy && (
          <p className="text-sm text-gem-ruby mt-2 font-serif">
            {t('shortfall')}
            {costColors
              .filter((k) => shortfall[k] > 0)
              .map((k) => `${labels[k]}×${shortfall[k]}`)
              .join(' · ')}
            {t('goldNotEnough')}
          </p>
        )}
      </div>
    </div>
  );
}
