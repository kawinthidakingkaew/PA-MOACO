import { BrandMark } from './Icon.tsx';
import { AccountMenu } from './account.tsx';
import { Button, LangToggle, StepNav, ThemeToggle } from './ui.tsx';
import { useLang, useT } from '../i18n/i18n.tsx';
import type { Lang, ThemePref, User } from '../domain/types.ts';

export interface AppHeaderProps {
  step: number; reached: number; onStep?: (i: number) => void;
  theme: ThemePref; onTheme: (t: ThemePref) => void; onLang: (l: Lang) => void;
  user: User | null; onLogin: () => void; onMyTrips: () => void; onLogout: () => void;
}

export function AppHeader(p: AppHeaderProps) {
  const t = useT(), l = useLang();
  return (
    <header className="ar-header">
      <a className="ar-brand" href="#" aria-label={t('appName')}>
        <BrandMark />
        <div><b>{t('appName')}</b><small>{t('appSub')}</small></div>
      </a>
      <StepNav current={p.step} reached={p.reached} onSelect={p.onStep} />
      <div className="ar-row app-tools">
        <LangToggle value={l} onChange={p.onLang} />
        <ThemeToggle value={p.theme} onChange={p.onTheme} />
        {p.user
          ? <AccountMenu user={p.user} onMyTrips={p.onMyTrips} onLogout={p.onLogout} />
          : <Button variant="ghost" size="sm" icon="person" onClick={p.onLogin}>{t('login')}</Button>}
      </div>
    </header>
  );
}
