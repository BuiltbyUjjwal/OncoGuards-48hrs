import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n, { STORAGE_KEY, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n';
import { LanguageCode, LanguageContextType } from '../i18n/types';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'hi') {
        return saved;
      }
    } catch (err) {
      console.warn('Unable to access localStorage for language:', err);
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((newLang: LanguageCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (err) {
      console.warn('Unable to save language to localStorage:', err);
    }
    i18n.changeLanguage(newLang);
    document.documentElement.setAttribute('lang', newLang);
    setCurrentLanguageState(newLang);
  }, []);

  // Ensure i18next and DOM are in sync with the initial state
  useEffect(() => {
    i18n.changeLanguage(currentLanguage);
    document.documentElement.setAttribute('lang', currentLanguage);
  }, [currentLanguage]);

  // Translate function wrapper for convenient component consumption
  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      const translation = i18n.t(key);
      if (!translation || translation === key) {
        return defaultValue || key;
      }
      return translation;
    },
    [currentLanguage]
  );

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isHindi: currentLanguage === 'hi',
    isEnglish: currentLanguage === 'en',
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
