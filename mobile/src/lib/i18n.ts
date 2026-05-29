import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

import en from '../locales/en.json';
import fa from '../locales/fa.json';
import ps from '../locales/ps.json';

export const LANGUAGE_KEY = 'noori_language';
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fa', label: 'Dari', nativeLabel: 'دری' },
  { code: 'ps', label: 'Pashto', nativeLabel: 'پښتو' },
] as const;

export type LanguageCode = 'en' | 'fa' | 'ps';

async function getStoredLanguage(): Promise<LanguageCode> {
  try {
    const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'fa' || stored === 'ps') return stored;
  } catch {
    // fall through
  }
  return 'fa'; // Default: Dari (Afghan majority language)
}

export async function saveLanguage(code: LanguageCode) {
  await SecureStore.setItemAsync(LANGUAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export async function initI18n() {
  const lng = await getStoredLanguage();

  await i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng,
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      fa: { translation: fa },
      ps: { translation: ps },
    },
    interpolation: { escapeValue: false },
  });

  return i18n;
}

export default i18n;
