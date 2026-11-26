import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readJSON, writeJSON } from '../services/storage.ts';
import type { Lang, ThemePref } from '../domain/types.ts';

interface Prefs { lang: Lang; setLang: (l: Lang) => void; theme: ThemePref; setTheme: (t: ThemePref) => void; resolved: 'light' | 'dark' }
const Ctx = createContext<Prefs | null>(null);

const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => readJSON<Lang>('local', 'pr.lang', 'th'));
  const [theme, setTheme] = useState<ThemePref>(() => readJSON<ThemePref>('local', 'pr.theme', 'system'));
  const [sysDark, setSysDark] = useState(systemDark);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSysDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const resolved = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme;
  useEffect(() => { writeJSON('local', 'pr.lang', lang); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { writeJSON('local', 'pr.theme', theme); }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0f1b1a' : '#0b7a75');
  }, [resolved]);
  const v = useMemo(() => ({ lang, setLang, theme, setTheme, resolved }), [lang, theme, resolved]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function usePrefs(): Prefs {
  const v = useContext(Ctx);
  if (!v) throw new Error('PrefsProvider missing');
  return v;
}
