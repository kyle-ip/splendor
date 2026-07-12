import { useState } from 'react';
import { assetBase } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';

const PAGE_COUNT = 12;
const BASE_VISIBLE = 4;

const CAPTION_KEYS: MessageKey[] = [
  'rulebookCap1',
  'rulebookCap2',
  'rulebookCap3',
  'rulebookCap4',
  'rulebookCap5',
  'rulebookCap6',
  'rulebookCap7',
  'rulebookCap8',
  'rulebookCap9',
  'rulebookCap10',
  'rulebookCap11',
  'rulebookCap12',
];

const pages = Array.from({ length: PAGE_COUNT }, (_, i) => {
  const n = i + 1;
  return { n, src: `${assetBase}/rules/${n}.jpg`, captionKey: CAPTION_KEYS[i] };
});

/** Sequential gallery of scanned rulebook pages (base + Cities modules). */
export function RulebookPages() {
  const { t } = useI18n();
  const [showExpansion, setShowExpansion] = useState(false);

  const visible = showExpansion ? pages : pages.slice(0, BASE_VISIBLE);

  return (
    <section
      className="mt-12 pt-8 border-t border-splendor-line/70"
      aria-labelledby="rulebook-pages-heading"
    >
      <h2
        id="rulebook-pages-heading"
        className="font-display text-2xl text-splendor-velvet tracking-wide scroll-mt-24"
      >
        {t('rulebookPagesTitle')}
      </h2>
      <p className="mt-2 mb-6 font-serif text-sm text-splendor-muted leading-relaxed">
        {t('rulebookPagesIntro')}
      </p>
      <ol className="space-y-8 list-none p-0 m-0">
        {visible.map(({ n, src, captionKey }) => (
          <li key={n}>
            <p className="mb-1 font-serif text-[11px] tracking-[0.2em] uppercase text-splendor-muted">
              {t('rulebookPageLabel', { n })}
            </p>
            <p className="mb-2 font-serif text-sm text-splendor-ink">{t(captionKey)}</p>
            <img
              src={src}
              alt={`${t('rulebookPageLabel', { n })} — ${t(captionKey)}`}
              className="w-full h-auto border border-splendor-line shadow-soft bg-[#1a120e]"
              loading={n === 1 ? 'eager' : 'lazy'}
            />
          </li>
        ))}
      </ol>
      <div className="mt-8 text-center">
        <button
          type="button"
          className="btn-outline"
          aria-expanded={showExpansion}
          onClick={() => setShowExpansion((v) => !v)}
        >
          {showExpansion ? t('rulebookShowLess') : t('rulebookShowMore')}
        </button>
      </div>
    </section>
  );
}
