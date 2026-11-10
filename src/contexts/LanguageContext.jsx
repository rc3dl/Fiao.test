import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations } from '@/lib/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'fiao-language';

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'es' ? saved : 'es';
  } catch {
    return 'es';
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const next = nextLanguage === 'en' ? 'en' : 'es';
    setLanguageState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* almacenamiento opcional */ }
    document.documentElement.lang = next;
  }, []);

  const toggleLanguage = useCallback(() => setLanguage(language === 'es' ? 'en' : 'es'), [language, setLanguage]);

  // Admite claves jerárquicas, textos literales y plantillas con valores variables.
  const t = useCallback((key, vars = {}) => {
    if (typeof key !== 'string') return key;
    const dictionary = translations[language] || translations.es;
    const value = key.split('.').reduce((obj, part) => obj?.[part], dictionary);
    let result = typeof value === 'string' ? value : undefined;
    const copy = dictionary?.copy || {};

    if (result === undefined) {
      result = copy[key] ?? copy[key.trim()];
    }

    // Traduce mensajes generados en tiempo de ejecución, por ejemplo "Welcome back, Ana 👋".
    if (result === undefined) {
      const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const [template, translated] of Object.entries(copy)) {
        if (!template.includes('{')) continue;
        const names = [];
        let pattern = '^';
        let cursor = 0;
        const placeholders = [...template.matchAll(/\{(\w+)\}/g)];
        for (const match of placeholders) {
          pattern += escapeRegExp(template.slice(cursor, match.index)) + '([\\s\\S]*?)';
          names.push(match[1]);
          cursor = match.index + match[0].length;
        }
        pattern += escapeRegExp(template.slice(cursor)) + '$';
        const found = new RegExp(pattern).exec(key);
        if (found) {
          result = translated;
          names.forEach((name, index) => {
            result = result.replaceAll(`{${name}}`, found[index + 1]);
          });
          break;
        }
      }
    }

    if (result === undefined) result = key;
    for (const [name, replacement] of Object.entries(vars || {})) {
      result = result.replaceAll(`{${name}}`, String(replacement));
    }
    return result;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, toggleLanguage, t }), [language, setLanguage, toggleLanguage, t]);

  React.useEffect(() => { document.documentElement.lang = language; }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage debe utilizarse dentro de LanguageProvider');
  return context;
}
