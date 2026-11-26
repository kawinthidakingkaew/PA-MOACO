import type { Lang, Named } from './types.ts';

export const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
export const fmt1 = (n: number): string =>
  (Math.round(n * 10) / 10).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const hhmm = (m: number): string => {
  const r = Math.round(m);
  return String(Math.floor(r / 60)).padStart(2, '0') + ':' + String(r % 60).padStart(2, '0');
};
export function dur(m: number, lang: Lang): string {
  const r = Math.round(m), hh = Math.floor(r / 60), mm = r % 60;
  const H = lang === 'en' ? 'h' : 'ชม.', M = lang === 'en' ? 'min' : 'นาที';
  return ((hh ? `${hh} ${H} ` : '') + (mm || !hh ? `${mm} ${M}` : '')).trim();
}
/** ชื่อตามภาษา ถ้าไม่มีชื่ออังกฤษใช้ชื่อไทย */
export const nm = (o: Named, lang: Lang): string => (lang === 'en' && o.en ? o.en : o.th);

/** วันที่แบบไทย (พ.ศ.) หรืออังกฤษ เช่น "23 พ.ย. 2569" / "23 Nov 2026" */
export function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return lang === 'en'
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : d.toLocaleDateString('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const cx = (...a: (string | false | null | undefined)[]): string => a.filter(Boolean).join(' ');

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
/** แยกอีเมลที่คั่นด้วยจุลภาค เซมิโคลอน หรือช่องว่าง คืนรายการที่ถูกต้องและที่ผิด */
export function parseEmails(input: string): { valid: string[]; invalid: string[] } {
  const parts = input.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const valid = [...new Set(parts.filter((p) => EMAIL_RE.test(p)))];
  return { valid, invalid: parts.filter((p) => !EMAIL_RE.test(p)) };
}
