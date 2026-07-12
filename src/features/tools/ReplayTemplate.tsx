import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';

const MISTAKE_KEYS: MessageKey[] = [
  'mistakeSlowEngine',
  'mistakeMissedNoble',
  'mistakeEndgameMath',
  'mistakeOverDenial',
  'mistakeHandLimit',
  'mistakeLatePivot',
  'mistakeOther',
];

export function ReplayTemplate() {
  const { locale } = useI18n();
  return <ReplayTemplateInner key={locale} />;
}

function ReplayTemplateInner() {
  const { t, locale } = useI18n();
  const mistakeOptions = useMemo(
    () => MISTAKE_KEYS.map((key) => ({ key, label: t(key) })),
    [t],
  );
  const storageKey = `splendor-replays-${locale}`;

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    players: 2,
    nobles: '',
    opening: '',
    turningPoint: '',
    mistakeKey: MISTAKE_KEYS[0],
    lesson: '',
  });

  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleSave = () => {
    const entry = t('replayEntry', {
      date: form.date,
      players: form.players,
      nobles: form.nobles || '—',
      opening: form.opening || '—',
      turning: form.turningPoint || '—',
      mistake: t(form.mistakeKey),
      lesson: form.lesson || '—',
    });
    const next = [entry, ...saved].slice(0, 20);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(next);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-splendor-muted text-sm font-serif">{t('replayIntro')}</p>

      <div className="panel p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-splendor-muted font-serif">{t('date')}</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-vintage mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-splendor-ink/60 font-serif">
              {t('players')}
            </span>
            <select
              value={form.players}
              onChange={(e) =>
                setForm({ ...form, players: Number(e.target.value) })
              }
              className="input-vintage mt-1"
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {t('playersN', { n })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-splendor-ink/60 font-serif">
            {t('openingNobles')}
          </span>
          <input
            type="text"
            placeholder={t('openingNoblesPh')}
            value={form.nobles}
            onChange={(e) => setForm({ ...form, nobles: e.target.value })}
            className="input-vintage mt-1"
          />
        </label>

        <label className="block">
          <span className="text-xs text-splendor-ink/60 font-serif">
            {t('chosenRoute')}
          </span>
          <input
            type="text"
            placeholder={t('chosenRoutePh')}
            value={form.opening}
            onChange={(e) => setForm({ ...form, opening: e.target.value })}
            className="input-vintage mt-1"
          />
        </label>

        <label className="block">
          <span className="text-xs text-splendor-ink/60 font-serif">
            {t('turningPoint')}
          </span>
          <textarea
            rows={2}
            placeholder={t('turningPointPh')}
            value={form.turningPoint}
            onChange={(e) => setForm({ ...form, turningPoint: e.target.value })}
            className="input-vintage mt-1"
          />
        </label>

        <label className="block">
          <span className="text-xs text-splendor-ink/60 font-serif">
            {t('mistakeType')}
          </span>
          <select
            value={form.mistakeKey}
            onChange={(e) =>
              setForm({ ...form, mistakeKey: e.target.value as MessageKey })
            }
            className="input-vintage mt-1"
          >
            {mistakeOptions.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-splendor-ink/60 font-serif">
            {t('lessonLearned')}
          </span>
          <textarea
            rows={2}
            placeholder={t('lessonPh')}
            value={form.lesson}
            onChange={(e) => setForm({ ...form, lesson: e.target.value })}
            className="input-vintage mt-1"
          />
        </label>

        <button type="button" onClick={handleSave} className="btn-gilt w-full">
          {t('saveReplay')}
        </button>
      </div>

      {saved.length > 0 && (
        <section>
          <h3 className="font-serif text-lg text-splendor-accent mb-3 tracking-wide">
            {t('history')}
          </h3>
          <ul className="space-y-2">
            {saved.map((entry, i) => (
              <li
                key={i}
                className="text-sm text-splendor-ink/90 p-3 panel-soft font-body"
              >
                {entry}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
