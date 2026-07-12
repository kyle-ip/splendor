import { extractToc } from '@/lib/toc';
import { useI18n } from '@/i18n/I18nProvider';

interface PageTocProps {
  markdown: string;
  minItems?: number;
}

export function PageToc({ markdown, minItems = 3 }: PageTocProps) {
  const { t } = useI18n();
  const items = extractToc(markdown);

  if (items.length < minItems) return null;

  return (
    <nav
      aria-label={t('onThisPage')}
      className="xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto"
    >
      <div className="panel-soft p-4">
        <p className="font-serif text-[11px] tracking-[0.2em] uppercase text-splendor-muted mb-3">
          {t('onThisPage')}
        </p>
        <ul className="space-y-1.5 text-sm font-serif">
          {items.map((item) => (
            <li key={item.id} className={item.level === 3 ? 'pl-3' : ''}>
              <a
                href={`#${item.id}`}
                className="text-splendor-muted hover:text-splendor-velvet transition-colors duration-200 no-underline leading-snug"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
