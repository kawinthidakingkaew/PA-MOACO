export type Lang = 'th' | 'en';
export type ThemePref = 'light' | 'dark' | 'system';
export type ProfileId =
  | 'cafe' | 'culture' | 'adventure' | 'workation' | 'festival' | 'nature'
  | 'wellness' | 'solo' | 'day_trip' | 'short_trip' | 'long_trip';

export interface LatLon { lat: number; lon: number }

/** ชื่อสองภาษา: ไทยเป็นค่าหลัก อังกฤษเป็นค่ารอง */
export interface Named { th: string; en?: string }

export interface Profile extends Named {
  id: ProfileId;
  en: string;
  /** น้ำหนักวัตถุประสงค์ [ระยะทาง, ความพึงพอใจ, ค่าใช้จ่าย] รวมกันได้ 1 */
  w: [number, number, number];
  tags: string[];
  /** จำนวนวันที่เหมาะ [ต่ำสุด, สูงสุด] */
  days: [number, number];
  desc: string;
  descEn: string;
  /** CSS colour token ของโปรไฟล์ */
  color: string;
}

export interface Poi extends Named, LatLon {
  id: string;
  en: string;
  tags: string[];
  /** ค่าเข้าชมต่อคน (บาท) */
  cost: number;
  /** ชั่วโมงที่ใช้ในสถานที่ */
  hours: number;
  rating: number;
  /** โปรไฟล์ที่สถานที่นี้ตรง */
  profs: ProfileId[];
}

export interface StartPoint extends Named, LatLon {
  id: string;
  area?: string;
  areaEn?: string;
}

/** แผนรายวัน: รายการ POI id เรียงตามลำดับการแวะ */
export type Plan = string[][];

export interface CostBreakdown { travel: number; entry: number }
export interface TripCost extends CostBreakdown { guide: number }

export interface StopRow {
  poi: Poi;
  legKm: number;
  legMin: number;
  /** นาทีนับจากเที่ยงคืน */
  arrive: number;
  stay: number;
  /** ค่าเข้าชมรวมทั้งกลุ่ม */
  cost: number;
}

export interface DayResult {
  rows: StopRow[];
  km: number;
  minutes: number;
  end: number;
  cost: CostBreakdown;
  total: number;
  over: boolean;
}

export interface TripResult {
  days: DayResult[];
  km: number;
  minutes: number;
  driveMin: number;
  stops: number;
  cost: TripCost;
  total: number;
}

export interface User {
  /** Google subject id (sub) */
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/** ข้อมูลที่ผู้ใช้กรอกและแผนที่จัดแล้ว เก็บใน session เพื่อไม่ให้หายหลังเข้าสู่ระบบ */
export interface TripDraft {
  profileId: ProfileId | null;
  start: StartPoint | null;
  radiusKm: number;
  days: number;
  people: number;
  budgetPerDay: number;
  plan: Plan;
  /** id ของทริปที่บันทึกไว้ ถ้าแผนนี้เปิดมาจาก "ทริปของฉัน" หรือบันทึกแล้ว */
  savedId: string | null;
  /** แผนเปลี่ยนหลังบันทึกล่าสุด */
  dirty: boolean;
}

export interface SavedTrip {
  id: string;
  ownerId: string;
  /** ชื่อที่ผู้ใช้ตั้งเอง ถ้าไม่มีจะสร้างจากโปรไฟล์และจำนวนวัน */
  customTitle?: string;
  draft: Omit<TripDraft, 'savedId' | 'dirty'>;
  km: number;
  total: number;
  stops: number;
  savedAt: string;
}

export type ExportAction = 'save' | 'email' | 'pdf';
