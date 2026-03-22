import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.resolvedLanguage?.startsWith('fr') ? 'fr' : 'en';

  const toggle = () => {
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-secondary transition-all"
      aria-label={t('common.switchLanguage')}
      title={currentLang === 'fr' ? t('common.switchToEnglish') : t('common.switchToFrench')}
    >
      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="uppercase">{currentLang === 'fr' ? 'EN' : 'FR'}</span>
    </button>
  );
}
