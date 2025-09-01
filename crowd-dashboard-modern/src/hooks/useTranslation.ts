import { translations, Language, TranslationKey } from '../lib/translations';

export function useTranslation(language: Language) {
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return { t };
}