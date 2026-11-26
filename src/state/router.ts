import { useEffect, useState } from 'react';

/**
 * เส้นทางแบบ hash ชื่อเดียว (#plan, #summary, #trips) เปิดจาก static hosting ได้โดยไม่ต้องตั้งค่าเซิร์ฟเวอร์
 * และใช้ได้ในหน้าที่ฝังอยู่ใน iframe ซึ่งรับเฉพาะ hash แบบชื่อเดียว
 */
export const PATHS = { profile: '', plan: 'plan', summary: 'summary', trips: 'trips' } as const;
export type Panel = 'pdf' | 'email';
export interface Route { path: string }

const parse = (): Route => ({ path: window.location.hash.replace(/^#\/?/, '') });

export function useRoute(): Route {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => { setR(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}

let pendingPanel: Panel | null = null;
/** แผงที่ต้องเปิดเมื่อถึงหน้าสรุป (มาจาก "ทริปของฉัน") อ่านได้ครั้งเดียว */
export const takePendingPanel = (): Panel | null => { const p = pendingPanel; pendingPanel = null; return p; };

export function navigate(to: string, opts?: { panel?: Panel }): void {
  pendingPanel = opts?.panel ?? null;
  if (to === PATHS.profile) {
    if (window.location.hash) window.location.hash = '';
    else window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else window.location.hash = to;
}
