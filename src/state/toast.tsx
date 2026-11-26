import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Toast } from '../components/ui.tsx';

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2800);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-slot" aria-live="polite">{msg ? <Toast>{msg}</Toast> : null}</div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
