import { useState } from 'react';
import { cardExamples } from '@/data/cardExamples';
import { evaluateCard } from '@/lib/gems';
import { gems } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { useGemLabels } from '@/i18n/useGemLabels';
import type { MessageKey } from '@/i18n/messages';

export function CardEvaluator() {
  const { locale, t } = useI18n();
  const labels = useGemLabels();
  const [weights, setWeights] = useState({
    points: 1,
    bonus: 1.5,
    costEfficiency: 1,
    nobleFit: 2,
  });

  const [nobleNeeds, setNobleNeeds] = useState({
    emerald: 0,
    sapphire: 3,
    ruby: 0,
    diamond: 0,
    onyx: 0,
  });

  const colors = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

  const weightKeys: { key: keyof typeof weights; label: MessageKey }[] = [
    { key: 'points', label: 'weightPoints' },
    { key: 'bonus', label: 'weightBonus' },
    { key: 'costEfficiency', label: 'weightCost' },
    { key: 'nobleFit', label: 'weightNoble' },
  ];

  const scores = cardExamples.map((card) => ({
    card,
    score: evaluateCard(card, weights, nobleNeeds),
  }));

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-splendor-muted text-sm font-serif">{t('cardEvalIntro')}</p>

      <div className="panel p-5 space-y-4">
        <p className="text-sm font-serif text-splendor-ink tracking-wide">
          {t('weightSliders')}
        </p>
        {weightKeys.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-splendor-muted mb-1 font-serif">
              <span>{t(label)}</span>
              <span className="font-display">{weights[key].toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={weights[key]}
              onChange={(e) =>
                setWeights({ ...weights, [key]: Number(e.target.value) })
              }
              className="w-full accent-splendor-velvet"
            />
          </div>
        ))}
      </div>

      <div className="panel p-5">
        <p className="text-sm font-serif text-splendor-ink mb-3 tracking-wide">
          {t('nobleGaps')}
        </p>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <img src={gems[c]} alt={labels[c]} className="gem-img" />
              <input
                type="number"
                min={0}
                max={3}
                value={nobleNeeds[c]}
                onChange={(e) =>
                  setNobleNeeds({
                    ...nobleNeeds,
                    [c]: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-14 px-2 py-1 border border-splendor-line bg-white text-center text-sm font-display"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {scores
          .sort((a, b) => b.score - a.score)
          .map(({ card, score }) => (
            <div
              key={card.id}
              className="flex justify-between items-center p-4 panel-soft"
            >
              <div className="flex items-start gap-3">
                <img
                  src={gems[card.bonus]}
                  alt=""
                  className="gem-img shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-serif text-splendor-ink">{card.name[locale]}</p>
                  <p className="text-xs text-splendor-muted mt-1 font-body">
                    {t('pointsLabel', { n: card.points })} · +1 {labels[card.bonus]} ·{' '}
                    {t('costLabel')}{' '}
                    {Object.entries(card.cost)
                      .filter(([, v]) => v > 0)
                      .map(
                        ([k, v]) =>
                          `${labels[k as keyof typeof labels]}×${v}`,
                      )
                      .join(' ')}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-display text-splendor-velvet">
                {score}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
