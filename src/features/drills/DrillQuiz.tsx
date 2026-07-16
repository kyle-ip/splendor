import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { DrillItem, DrillSet } from './types';

function DrillCard({ item }: { item: DrillItem }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked !== null && picked === item.correctId;
  const wrong = picked !== null && picked !== item.correctId;

  return (
    <div className="border border-splendor-line/40 rounded-sm p-3 space-y-2">
      <p className="text-sm font-serif text-splendor-ink/90 leading-relaxed">
        {t(item.promptKey)}
      </p>
      <div className="flex flex-col gap-1.5">
        {item.choices.map((c) => {
          const selected = picked === c.id;
          const isAnswer = c.id === item.correctId;
          let cls =
            'text-left text-sm font-serif px-3 py-2 border border-splendor-line/50 hover:border-splendor-gold/50 transition-colors';
          if (picked) {
            if (isAnswer) cls += ' border-gem-emerald/60 bg-gem-emerald/10';
            else if (selected) cls += ' border-gem-ruby/50 bg-gem-ruby/5 opacity-80';
            else cls += ' opacity-50';
          }
          return (
            <button
              key={c.id}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(c.id)}
              className={cls}
            >
              {t(c.labelKey)}
            </button>
          );
        })}
      </div>
      {picked && (
        <p
          className={`text-sm font-serif leading-relaxed ${
            correct
              ? 'text-gem-emerald'
              : wrong
                ? 'text-splendor-ink/80'
                : 'text-splendor-muted'
          }`}
        >
          {correct ? t('drillCorrect') : t('drillIncorrect')} {t(item.explainKey)}
        </p>
      )}
    </div>
  );
}

export function DrillQuiz({ set }: { set: DrillSet }) {
  const { t } = useI18n();

  return (
    <section className="mt-8 border-t border-splendor-line/35 pt-6 space-y-4">
      <h2 className="font-display text-lg text-splendor-velvet tracking-woodcut">
        {t(set.titleKey)}
      </h2>
      <p className="text-sm font-serif text-splendor-muted">{t('drillIntro')}</p>
      <div className="space-y-3">
        {set.items.map((item) => (
          <DrillCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
