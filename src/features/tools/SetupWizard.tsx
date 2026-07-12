import { useState } from 'react';
import setupTable from '@/data/setup-table.json';
import type { SetupConfig } from '@/types';
import { gems } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';

const configs = setupTable as SetupConfig[];

export function SetupWizard() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [players, setPlayers] = useState(2);
  const config = configs.find((c) => c.players === players)!;

  const steps = [
    t('setupStepPlayers'),
    t('setupStepGems'),
    t('setupStepLayout'),
  ];

  return (
    <div className="panel p-5">
      <div className="flex gap-2 mb-5">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 py-2 text-xs font-serif tracking-wide border transition-colors ${
              step === i
                ? 'bg-splendor-velvet text-white border-splendor-velvet'
                : 'bg-white text-splendor-muted border-splendor-line'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-splendor-ink/80 font-serif">
            {t('setupChoosePlayers')}
          </p>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setPlayers(n);
                  setStep(1);
                }}
                className={`flex-1 py-4 font-display text-lg border transition-colors ${
                  players === n
                    ? 'bg-splendor-velvet text-white border-splendor-velvet'
                    : 'bg-white text-splendor-ink border-splendor-line hover:border-splendor-accent'
                }`}
              >
                {t('playersButton', { n })}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-splendor-ink/80 font-serif">
            {t('setupForPlayers', { n: players })}
          </p>
          <table className="w-full text-sm font-body text-splendor-ink">
            <tbody>
              <tr className="border-b border-splendor-line">
                <td className="py-2 text-splendor-muted">{t('gemsPerColor')}</td>
                <td className="py-2 text-right font-display">
                  {t('gemsEach', { n: config.gemsPerColor })}
                </td>
              </tr>
              <tr className="border-b border-splendor-line">
                <td className="py-2 text-splendor-muted">{t('noblesCount')}</td>
                <td className="py-2 text-right font-display">
                  {t('noblesCountValue', { n: config.nobles })}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-splendor-muted">{t('goldJokers')}</td>
                <td className="py-2 text-right font-display">
                  {t('goldCount', { n: config.gold })}
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" onClick={() => setStep(2)} className="btn-gilt w-full">
            {t('nextLayout')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center p-4 border border-dashed border-splendor-line bg-splendor-bg/50">
            <p className="text-xs text-splendor-muted mb-3 font-serif tracking-wide">
              {t('bankCenter')}
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {(Object.keys(gems) as (keyof typeof gems)[]).map((key) => (
                <img key={key} src={gems[key]} alt={key} className="w-14 h-14 object-contain" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {['Level 1', 'Level 2', 'Level 3'].map((level) => (
              <div key={level} className="p-2 border border-splendor-line bg-white">
                <p className="text-splendor-muted mb-1 font-serif">{level}</p>
                <div className="grid grid-cols-2 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-6 border border-splendor-line bg-splendor-bg"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center p-2 border border-splendor-line bg-white">
            <p className="text-xs text-splendor-muted font-serif">
              {t('noblesTiles', { n: config.nobles })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
