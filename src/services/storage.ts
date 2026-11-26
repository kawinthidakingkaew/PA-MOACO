/** อ่าน/เขียน Web Storage อย่างปลอดภัย (โหมดส่วนตัวหรือถูกบล็อกจะคืนค่าเริ่มต้น) */
type Kind = 'local' | 'session';
const store = (k: Kind): Storage | null => {
  try { return k === 'local' ? window.localStorage : window.sessionStorage; } catch { return null; }
};
export function readJSON<T>(kind: Kind, key: string, fallback: T): T {
  try { const s = store(kind)?.getItem(key); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
}
export function writeJSON(kind: Kind, key: string, value: unknown): void {
  try { if (value === undefined || value === null) store(kind)?.removeItem(key); else store(kind)?.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
