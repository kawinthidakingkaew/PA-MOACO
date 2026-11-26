/**
 * ชั้นบริการข้อมูลของหน้าเว็บ
 *
 * - `mockApi` (ค่าเริ่มต้น) ทำงานในเบราว์เซอร์ทั้งหมด: จัดเส้นทางด้วย planner.ts และเก็บทริปใน localStorage
 * - `httpApi` คือสัญญา REST ที่ backend ต้องมี (ตามเอกสารออกแบบฐานข้อมูล) ตั้ง VITE_API_BASE_URL เพื่อใช้
 * ทุกหน้าเรียกผ่าน `api` ตัวเดียว จึงสลับได้โดยไม่ต้องแก้หน้าจอ
 */
import { planTrip, evalTrip, type PlanOptions } from '../domain/planner.ts';
import type { Plan, SavedTrip, TripDraft, User } from '../domain/types.ts';
import { readJSON, writeJSON } from './storage.ts';

export type DraftData = SavedTrip['draft'];
export interface EmailRequest { recipients: string[]; attachPdf: boolean; includeLink: boolean; tripId: string | null; draft: DraftData }

export interface TripApi {
  /** เรียกเครื่องมือ PA-MOACO; onProgress รับค่า 0–1 */
  planRoute(opt: PlanOptions, onProgress?: (p: number) => void, signal?: AbortSignal): Promise<Plan>;
  listTrips(user: User): Promise<SavedTrip[]>;
  getTrip(user: User, id: string): Promise<SavedTrip | null>;
  /** สร้างใหม่ หรืออัปเดตเมื่อส่ง id */
  saveTrip(user: User, draft: DraftData, id?: string | null): Promise<SavedTrip>;
  renameTrip(user: User, id: string, title: string): Promise<SavedTrip>;
  duplicateTrip(user: User, id: string, title: string): Promise<SavedTrip>;
  deleteTrip(user: User, id: string): Promise<void>;
  sendTripEmail(user: User, req: EmailRequest): Promise<void>;
}

export const toDraftData = (d: TripDraft): DraftData => ({
  profileId: d.profileId, start: d.start, radiusKm: d.radiusKm, days: d.days, people: d.people, budgetPerDay: d.budgetPerDay, plan: d.plan,
});

function summarize(draft: DraftData) {
  if (!draft.start) return { km: 0, total: 0, stops: 0 };
  const r = evalTrip(draft.start, draft.plan, draft.people);
  return { km: r.km, total: r.total, stops: r.stops };
}

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
  const id = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(id); rej(new DOMException('aborted', 'AbortError')); }, { once: true });
});
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : 'T' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
const key = (u: User) => `pr.trips.${u.id}`;

export const mockApi: TripApi = {
  async planRoute(opt, onProgress, signal) {
    // จำลองรอบการทำงานของ ACO ให้ผู้ใช้เห็นความคืบหน้า
    for (let k = 1; k <= 12; k++) { await wait(90, signal); onProgress?.(k / 12); }
    return planTrip(opt);
  },
  async listTrips(u) {
    return readJSON<SavedTrip[]>('local', key(u), []).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  },
  async getTrip(u, id) { return readJSON<SavedTrip[]>('local', key(u), []).find((x) => x.id === id) ?? null; },
  async saveTrip(u, draft, id) {
    await wait(300);
    const all = readJSON<SavedTrip[]>('local', key(u), []);
    const prev = id ? all.find((x) => x.id === id) : undefined;
    const trip: SavedTrip = { id: prev?.id ?? uid(), ownerId: u.id, customTitle: prev?.customTitle, draft, ...summarize(draft), savedAt: new Date().toISOString() };
    writeJSON('local', key(u), [trip, ...all.filter((x) => x.id !== trip.id)]);
    return trip;
  },
  async renameTrip(u, id, title) {
    const all = readJSON<SavedTrip[]>('local', key(u), []);
    const t = all.find((x) => x.id === id);
    if (!t) throw new Error('not_found');
    t.customTitle = title.trim() || undefined;
    writeJSON('local', key(u), all);
    return t;
  },
  async duplicateTrip(u, id, title) {
    const all = readJSON<SavedTrip[]>('local', key(u), []);
    const t = all.find((x) => x.id === id);
    if (!t) throw new Error('not_found');
    const copy: SavedTrip = { ...structuredClone(t), id: uid(), customTitle: title, savedAt: new Date().toISOString() };
    writeJSON('local', key(u), [copy, ...all]);
    return copy;
  },
  async deleteTrip(u, id) {
    // ระบบจริงเป็น soft delete (deleted_at) ตามเอกสารฐานข้อมูล
    writeJSON('local', key(u), readJSON<SavedTrip[]>('local', key(u), []).filter((x) => x.id !== id));
  },
  async sendTripEmail(_u, req) {
    await wait(600);
    if (!req.recipients.length) throw new Error('no_recipient');
    // เดโมไม่ส่งอีเมลจริง backend จะส่งผ่านผู้ให้บริการอีเมลและบันทึก email_log พร้อมจำกัดจำนวนครั้ง
  },
};

/** สัญญา REST สำหรับ backend จริง (ยังไม่ได้ทดสอบกับเซิร์ฟเวอร์) */
export function httpApi(base: string): TripApi {
  const req = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const r = await fetch(base + path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
    if (!r.ok) throw new Error(`${r.status}`);
    return (r.status === 204 ? undefined : await r.json()) as T;
  };
  return {
    planRoute: async (opt, onProgress, signal) => {
      onProgress?.(0.1);
      const res = await req<{ plan: Plan }>('/plan', { method: 'POST', body: JSON.stringify(opt), signal });
      onProgress?.(1);
      return res.plan;
    },
    listTrips: () => req('/trips'),
    getTrip: (_u, id) => req(`/trips/${id}`),
    saveTrip: (_u, draft, id) => (id ? req(`/trips/${id}`, { method: 'PUT', body: JSON.stringify({ draft }) }) : req('/trips', { method: 'POST', body: JSON.stringify({ draft }) })),
    renameTrip: (_u, id, title) => req(`/trips/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
    duplicateTrip: (_u, id, title) => req(`/trips/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ title }) }),
    deleteTrip: (_u, id) => req(`/trips/${id}`, { method: 'DELETE' }),
    sendTripEmail: (_u, r) => req('/trips/email', { method: 'POST', body: JSON.stringify(r) }),
  };
}

const API = import.meta.env?.VITE_API_BASE_URL as string | undefined;
export const api: TripApi = API ? httpApi(API) : mockApi;
