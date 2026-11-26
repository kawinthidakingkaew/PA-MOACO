import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { LoginDialog } from '../components/account.tsx';
import { useAuth } from './auth.tsx';
import { useToast } from './toast.tsx';
import { useT } from '../i18n/i18n.tsx';
import type { ExportAction, User } from '../domain/types.ts';

/**
 * ประตูเข้าสู่ระบบ: คำสั่งที่ต้องเป็นสมาชิก (บันทึก อีเมล PDF) เรียก `requireUser`
 * ถ้ายังไม่เข้าสู่ระบบจะเปิดหน้าต่าง Google แล้วทำคำสั่งเดิมต่อทันทีหลังสำเร็จ (UC-07a)
 */
type After = (u: User) => void;
const Ctx = createContext<(action: ExportAction | null, after?: After) => void>(() => {});

export function LoginGateProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const { user, signIn, busy, demo } = useAuth();
  const toast = useToast();
  const [action, setAction] = useState<ExportAction | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const after = useRef<After | undefined>(undefined);

  const requireUser = useCallback((a: ExportAction | null, then?: After) => {
    if (user) { then?.(user); return; }
    after.current = then; setAction(a); setError(null); setOpen(true);
  }, [user]);

  const onGoogle = async () => {
    setError(null);
    const u = await signIn();
    if (!u) { setError(t('signInFailed')); return; }
    setOpen(false);
    const then = after.current; after.current = undefined;
    if (then) then(u); else toast(t('signedInToast'));
  };
  const close = useCallback(() => { setOpen(false); after.current = undefined; }, []);

  const v = useMemo(() => requireUser, [requireUser]);
  return (
    <Ctx.Provider value={v}>
      {children}
      <LoginDialog open={open} action={action} busy={busy} error={error} note={demo ? t('demoAuth') : undefined} onGoogle={onGoogle} onClose={close} />
    </Ctx.Provider>
  );
}
export const useRequireUser = () => useContext(Ctx);
