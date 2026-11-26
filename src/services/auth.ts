/**
 * การเข้าสู่ระบบด้วย Google (FR-26)
 *
 * เดโมนี้ใช้ `mockAuth` ซึ่งคืนบัญชีตัวอย่าง ไม่ได้ติดต่อ Google
 *
 * การต่อของจริง (แนะนำ):
 *  1. ตั้ง VITE_GOOGLE_CLIENT_ID แล้วโหลด https://accounts.google.com/gsi/client
 *  2. ใช้ google.accounts.oauth2.initCodeClient({ client_id, scope: 'openid email profile', ux_mode: 'popup' })
 *  3. ส่ง authorization code ไปที่ backend `POST /auth/google` ให้ backend แลก token, ตรวจ id_token
 *     สร้างหรือค้นผู้ใช้จาก google_sub แล้วตั้ง session cookie แบบ httpOnly
 *  4. หน้าเว็บเรียก `GET /auth/me` เพื่อรู้ว่าใครเข้าสู่ระบบอยู่ — ไม่เก็บ token ไว้ใน localStorage
 */
import type { User } from '../domain/types.ts';
import { readJSON, writeJSON } from './storage.ts';

export interface AuthService {
  readonly demo: boolean;
  current(): Promise<User | null>;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
}

const KEY = 'pr.user';
export const DEMO_USER: User = { id: 'demo-google-sub', name: 'ผู้ใช้ตัวอย่าง', email: 'name@gmail.com' };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockAuth: AuthService = {
  demo: true,
  async current() { return readJSON<User | null>('local', KEY, null); },
  async signInWithGoogle() { await wait(500); writeJSON('local', KEY, DEMO_USER); return DEMO_USER; },
  async signOut() { writeJSON('local', KEY, null); },
};

/** โครงสำหรับ backend จริง (ยังไม่ได้ทดสอบกับเซิร์ฟเวอร์) */
export const httpAuth = (base: string, getCode: () => Promise<string>): AuthService => ({
  demo: false,
  async current() {
    const r = await fetch(`${base}/auth/me`, { credentials: 'include' });
    return r.ok ? ((await r.json()) as User) : null;
  },
  async signInWithGoogle() {
    const code = await getCode();
    const r = await fetch(`${base}/auth/google`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    if (!r.ok) throw new Error('auth_failed');
    return (await r.json()) as User;
  },
  async signOut() { await fetch(`${base}/auth/logout`, { method: 'POST', credentials: 'include' }); },
});

/** ตอนนี้ใช้ mock เสมอ เมื่อทำ getCode ด้วย Google Identity Services แล้วให้สลับเป็น httpAuth(API, getCode) */
export const auth: AuthService = mockAuth;
