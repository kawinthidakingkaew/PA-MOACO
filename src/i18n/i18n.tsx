import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { STR, type StrKey } from './strings.ts';
import type { Lang } from '../domain/types.ts';

export type Vars = Record<string, string | number>;
export type T = (k: StrKey, vars?: Vars) => string;

export function tr(lang: Lang, k: StrKey, vars?: Vars): string {
  let s: string = STR[lang][k] ?? STR.th[k] ?? k;
  if (vars) for (const [v, val] of Object.entries(vars)) s = s.split(`{${v}}`).join(String(val));
  return s;
}

const LangCtx = createContext<Lang>('th');
export const LangProvider = ({ lang, children }: { lang: Lang; children: ReactNode }) => <LangCtx.Provider value={lang}>{children}</LangCtx.Provider>;
export const useLang = (): Lang => useContext(LangCtx);
export function useT(): T {
  const l = useLang();
  return useCallback((k: StrKey, v?: Vars) => tr(l, k, v), [l]);
}
export type { StrKey };
