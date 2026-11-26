import type { CSSProperties } from 'react';
/** ใส่ CSS custom property (เช่น --c) ใน style โดยไม่ต้อง cast ทุกจุด */
export const cssVars = (o: Record<string, string | number | undefined>, extra?: CSSProperties): CSSProperties => ({ ...(o as CSSProperties), ...extra });
