import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './resources/en';
import { ru } from './resources/ru';
import { zhHans } from './resources/zh-Hans';

void i18n.use(initReactI18next).init({
  lng: 'ru',
  fallbackLng: 'ru',
  supportedLngs: ['ru', 'en', 'zh-Hans'],
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    'zh-Hans': { translation: zhHans },
  },
  interpolation: {
    escapeValue: false,
  },
  initAsync: false,
  react: {
    useSuspense: false,
    bindI18n: false,
    bindI18nStore: false,
  },
});

export default i18n;
