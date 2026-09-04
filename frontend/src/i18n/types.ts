export type LanguageCode = 'en' | 'hi';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, defaultValue?: string) => string;
  supportedLanguages: LanguageOption[];
  isHindi: boolean;
  isEnglish: boolean;
}
