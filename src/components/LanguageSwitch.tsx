import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/messages';

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  const btn = (code: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(code)}
      className={`flex-1 px-2 py-1.5 text-xs font-serif tracking-wide transition-colors duration-200 ${
        locale === code
          ? 'bg-splendor-velvet text-[#fff8e8]'
          : 'text-splendor-muted hover:text-splendor-ink'
      }`}
      aria-pressed={locale === code}
    >
      {label}
    </button>
  );

  return (
    <div
      className="flex border-[1.5px] border-splendor-line bg-splendor-card/80"
      role="group"
      aria-label={t('languageLabel')}
    >
      {btn('en', t('langEn'))}
      {btn('zh', t('langZh'))}
    </div>
  );
}
