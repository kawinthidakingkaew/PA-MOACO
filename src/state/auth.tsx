import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth } from '../services/auth.ts';
import type { User } from '../domain/types.ts';

interface AuthState {
  user: User | null;
  ready: boolean;
  busy: boolean;
  demo: boolean;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { auth.current().then(setUser).finally(() => setReady(true)); }, []);
  const signIn = useCallback(async () => {
    setBusy(true);
    try { const u = await auth.signInWithGoogle(); setUser(u); return u; }
    catch { return null; }
    finally { setBusy(false); }
  }, []);
  const signOut = useCallback(async () => { await auth.signOut(); setUser(null); }, []);
  const v = useMemo(() => ({ user, ready, busy, demo: auth.demo, signIn, signOut }), [user, ready, busy, signIn, signOut]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider missing');
  return v;
}
