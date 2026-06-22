import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Rutas ajustadas perfectamente para tu estructura de raíz
import es from '../locales/es.json';
import en from '../locales/en.json';

const resources = {
  es: { translation: es },
  en: { translation: en }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', 
    fallbackLng: 'es', 
    compatibilityJSON: 'v3', 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;