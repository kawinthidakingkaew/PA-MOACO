/**
 * การจัดเส้นทางและคำนวณค่าใช้จ่าย
 *
 * `planTrip` เป็นตัวแทนชั่วคราวของเครื่องมือ PA-MOACO (greedy: คะแนนสถานที่หารด้วยระยะทาง)
 * ระบบจริงเรียก API ของ PA-MOACO ผ่าน services/api.ts แล้วใช้ `evalTrip` ฝั่งหน้าเว็บ
 * เพื่อคำนวณใหม่ทันทีเมื่อผู้ใช้เพิ่ม ลบ หรือสลับลำดับจุดแวะ
 */
import { CONFIG } from './config.ts';
import { haversineKm, roadKm } from './geo.ts';
import { POI, POIS } from '../data/places.ts';
import type { DayResult, LatLon, Plan, Poi, ProfileId, StopRow, TripResult } from './types.ts';

export interface Candidate extends Poi { dist: number }

/** สถานที่ที่ตรงโปรไฟล์ภายในรัศมีจากจุดเริ่มต้น เรียงจากใกล้ไปไกล */
export function candidates(profileId: ProfileId, start: LatLon, radiusKm: number): Candidate[] {
  return POIS
    .map((x) => ({ ...x, dist: haversineKm(start, x) }))
    .filter((x) => x.profs.includes(profileId) && x.dist <= radiusKm && x.dist > 0.15)
    .sort((a, b) => a.dist - b.dist);
}

export interface PlanOptions { profile: ProfileId; start: LatLon; days: number; radiusKm: number }

export function planTrip(opt: PlanOptions): Plan {
  const pool = candidates(opt.profile, opt.start, opt.radiusKm);
  const out: Plan = [];
  for (let d = 0; d < opt.days; d++) {
    let cur: LatLon = opt.start, used = 0;
    const stops: string[] = [];
    while (pool.length && stops.length < CONFIG.maxStopsPerDay) {
      let best = 0, score = -1;
      pool.forEach((p, i) => { const s = p.rating / (1 + roadKm(cur, p) * 0.35); if (s > score) { score = s; best = i; } });
      const cand = pool[best];
      const need = (roadKm(cur, cand) / CONFIG.kmh) * 60 + cand.hours * 60;
      if (used + need > CONFIG.dayMinutes) break;
      used += need; stops.push(cand.id); cur = cand; pool.splice(best, 1);
    }
    out.push(stops);
  }
  return out;
}

export function evalDay(start: LatLon, ids: string[], people = 1): DayResult {
  let t: number = CONFIG.dayStart, cur: LatLon = start, km = 0, entry = 0;
  const rows: StopRow[] = [];
  ids.forEach((id) => {
    const p = POI[id];
    if (!p) return; // สถานที่ถูกลบออกจากฐานข้อมูลแล้ว
    const legKm = roadKm(cur, p), legMin = (legKm / CONFIG.kmh) * 60;
    t += legMin; km += legKm;
    rows.push({ poi: p, legKm, legMin, arrive: t, stay: p.hours * 60, cost: p.cost * people });
    t += p.hours * 60; entry += p.cost * people; cur = p;
  });
  const minutes = t - CONFIG.dayStart;
  const cost = { travel: km * CONFIG.bahtPerKm, entry };
  return { rows, km, minutes, end: t, cost, total: cost.travel + cost.entry, over: minutes > CONFIG.dayMinutes };
}

export function evalTrip(start: LatLon, plan: Plan, people: number): TripResult {
  const days = plan.map((ids) => evalDay(start, ids, people));
  const sum = (f: (d: DayResult) => number) => days.reduce((a, d) => a + f(d), 0);
  const hasStops = days.some((d) => d.rows.length > 0);
  const cost = { travel: sum((d) => d.cost.travel), entry: sum((d) => d.cost.entry), guide: hasStops ? CONFIG.guideFlat : 0 };
  return {
    days,
    km: sum((d) => d.km),
    minutes: sum((d) => d.minutes),
    driveMin: sum((d) => d.rows.reduce((a, r) => a + r.legMin, 0)),
    stops: sum((d) => d.rows.length),
    cost,
    total: cost.travel + cost.entry + cost.guide,
  };
}

/* ---------- การแก้แผน (pure) ---------- */
export const removeStop = (plan: Plan, day: number, k: number): Plan => plan.map((ids, j) => (j === day ? ids.filter((_, x) => x !== k) : ids));
export function moveStop(plan: Plan, day: number, k: number, dir: -1 | 1): Plan {
  return plan.map((ids, j) => {
    if (j !== day || k + dir < 0 || k + dir >= ids.length) return ids;
    const a = ids.slice(); [a[k], a[k + dir]] = [a[k + dir], a[k]]; return a;
  });
}
export const addStop = (plan: Plan, day: number, id: string): Plan =>
  plan.some((ids) => ids.includes(id)) ? plan : plan.map((ids, j) => (j === day ? [...ids, id] : ids));
