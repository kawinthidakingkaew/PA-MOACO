import { useEffect } from 'react';
import { AppHeader } from './components/AppHeader.tsx';
import { Button } from './components/ui.tsx';
import { EmptyState } from './pages/EmptyState.tsx';
import { MyTripsPage } from './pages/MyTripsPage.tsx';
import { PlanPage } from './pages/PlanPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { SummaryPage } from './pages/SummaryPage.tsx';
import { LangProvider, tr } from './i18n/i18n.tsx';
import { AuthProvider, useAuth } from './state/auth.tsx';
import { LoginGateProvider, useRequireUser } from './state/loginGate.tsx';
import { PrefsProvider, usePrefs } from './state/prefs.tsx';
import { navigate, PATHS, useRoute } from './state/router.ts';
import { ToastProvider, useToast } from './state/toast.tsx';
import { reachedStep, TripProvider, useTrip } from './state/trip.tsx';

const STEP_PATHS = [PATHS.profile, PATHS.plan, PATHS.summary];

function Shell() {
  const route = useRoute();
  const prefs = usePrefs();
  const { user, signOut } = useAuth();
  const requireUser = useRequireUser();
  const toast = useToast();
  const { draft, dispatch } = useTrip();
  const t = (k: Parameters<typeof tr>[1]) => tr(prefs.lang, k);

  const step = STEP_PATHS.indexOf(route.path as (typeof STEP_PATHS)[number]);
  useEffect(() => {
    const page = step >= 0 ? t((['step1', 'step2', 'step3'] as const)[step]) : route.path === PATHS.trips ? t('myTrips') : null;
    document.title = (page ? page + ' · ' : '') + t('appName');
  });

  const logout = async () => {
    await signOut();
    dispatch({ type: 'unlink' });
    toast(t('loggedOutToast'));
    if (route.path === PATHS.trips) navigate(PATHS.profile);
  };

  let page;
  switch (route.path) {
    case PATHS.profile: page = <ProfilePage />; break;
    case PATHS.plan: page = <PlanPage />; break;
    case PATHS.summary: page = <SummaryPage />; break;
    case PATHS.trips: page = <MyTripsPage />; break;
    default: page = <EmptyState icon="map" title={t('notFound')} action={<Button variant="primary" onClick={() => navigate(PATHS.profile)}>{t('backHome')}</Button>} />;
  }

  return (
    <div className="ar-page app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('skip')}</a>
      <AppHeader step={step} reached={reachedStep(draft)} onStep={(i) => navigate(STEP_PATHS[i])}
        theme={prefs.theme} onTheme={prefs.setTheme} onLang={prefs.setLang}
        user={user} onLogin={() => requireUser(null)} onMyTrips={() => navigate(PATHS.trips)} onLogout={() => void logout()} />
      <main id="main" tabIndex={-1}>{page}</main>
    </div>
  );
}

function WithLang() {
  const { lang } = usePrefs();
  return (
    <LangProvider lang={lang}>
      <AuthProvider>
        <TripProvider>
          <ToastProvider>
            <LoginGateProvider>
              <Shell />
            </LoginGateProvider>
          </ToastProvider>
        </TripProvider>
      </AuthProvider>
    </LangProvider>
  );
}

export default function App() {
  return <PrefsProvider><WithLang /></PrefsProvider>;
}
