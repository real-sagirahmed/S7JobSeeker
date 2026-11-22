import { en, type TranslationDictionary } from './en';
import { bn } from './bn';

export type Language = 'en' | 'bn';

export const dictionaries: Record<Language, TranslationDictionary> = {
  en,
  bn
};

export { en, bn };
export type { TranslationDictionary };
