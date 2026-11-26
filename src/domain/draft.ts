import { CONFIG } from './config.ts';
import { PROF } from '../data/profiles.ts';
import type { Plan, ProfileId, SavedTrip, StartPoint, TripDraft } from './types.ts';

/*
 * แผนที่กำลังจัด เก็บใน sessionStorage: ผู้ใช้ทั่วไปวางแผนได้ครบ
 * และแผนไม่หายเมื่อเข้าสู่ระบบกลางทาง (UC-07a)
 */
export const EMPTY_DRAFT: TripDraft = {
  profileId: null, start: null, radiusKm: CONFIG.defaultRadiusKm, days: 1, people: 2, budgetPerDay: CONFIG.budgetPerDay,
  plan: [], savedId: null, dirty: false,
};

export type TripAction =
  | { type: 'profile'; id: ProfileId }
  | { type: 'start'; start: StartPoint | null }
  | { type: 'radius'; km: number }
  | { type: 'days'; n: number }
  | { type: 'people'; n: number }
  | { type: 'budget'; n: number }
  | { type: 'plan'; plan: Plan }
  | { type: 'clearPlan' }
  | { type: 'saved'; id: string }
  /** ตัดการเชื่อมกับทริปที่บันทึก (ออกจากระบบ หรือทริปถูกลบ) */
  | { type: 'unlink' }
  | { type: 'load'; trip: SavedTrip }
  | { type: 'reset' };

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export function tripReducer(s: TripDraft, a: TripAction): TripDraft {
  switch (a.type) {
    case 'profile': {
      if (s.profileId === a.id) return s;
      const p = PROF[a.id];
      // เปลี่ยนโปรไฟล์ = แผนเดิมใช้ไม่ได้ เริ่มทริปใหม่แต่คงจุดเริ่มต้นและจำนวนคน
      return { ...s, profileId: a.id, days: clamp(s.days, p.days[0], p.days[1]), plan: [], savedId: null, dirty: false };
    }
    case 'start': return { ...s, start: a.start, plan: [], dirty: s.savedId != null };
    case 'radius': return { ...s, radiusKm: a.km };
    case 'days': return { ...s, days: a.n };
    case 'people': return { ...s, people: a.n, dirty: s.savedId != null || s.dirty };
    case 'budget': return { ...s, budgetPerDay: a.n, dirty: s.savedId != null || s.dirty };
    case 'plan': return { ...s, plan: a.plan, dirty: s.savedId != null };
    case 'clearPlan': return { ...s, plan: [] };
    case 'saved': return { ...s, savedId: a.id, dirty: false };
    case 'unlink': return { ...s, savedId: null, dirty: false };
    case 'load': return { ...a.trip.draft, savedId: a.trip.id, dirty: false };
    case 'reset': return EMPTY_DRAFT;
  }
}

/** ขั้นที่ไปถึงแล้ว: 0 = เลือกโปรไฟล์, 1 = จัดเส้นทาง, 2 = มีแผนให้สรุป */
export const reachedStep = (d: TripDraft): number => (d.plan.some((ids) => ids.length) && d.start ? 2 : d.profileId ? 1 : 0);
