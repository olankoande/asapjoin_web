import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './fr.json';
import en from './en.json';
import { extraResources } from './extraResources';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: { ...fr, ...extraResources.fr, common: { ...fr.common, ...extraResources.fr.common }, createTrip: { ...fr.createTrip, ...extraResources.fr.createTrip, errors: { ...fr.createTrip.errors, ...extraResources.fr.createTrip.errors } } } },
      en: { translation: { ...en, ...extraResources.en, common: { ...en.common, ...extraResources.en.common }, createTrip: { ...en.createTrip, ...extraResources.en.createTrip, errors: { ...en.createTrip.errors, ...extraResources.en.createTrip.errors } } } },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language.startsWith('fr') ? 'fr' : 'en';
  }
});

if (typeof document !== 'undefined') {
  const language = i18n.resolvedLanguage || i18n.language || 'fr';
  document.documentElement.lang = language.startsWith('fr') ? 'fr' : 'en';
}

export default i18n;
