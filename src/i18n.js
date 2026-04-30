import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';
import it from './locales/it.json';
import fr from './locales/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      de: { translation: de },
      pt: { translation: pt },
      ar: { translation: ar },
      it: { translation: it },
      fr: { translation: fr },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'de', 'pt', 'ar', 'it', 'fr'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
