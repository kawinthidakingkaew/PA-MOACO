/**
 * ค่าคงที่ของการคำนวณ (FRD: ค่าเดินทาง 10 ฿/กม. + ค่าเข้าชม × จำนวนคน + ค่าไกด์เหมาจ่ายต่อทริป)
 * ในระบบจริงค่าเหล่านี้ควรมาจาก API ตั้งค่าระบบ (system_config)
 */
export const CONFIG = {
  bahtPerKm: 10,
  guideFlat: 500,
  /** ความเร็วเฉลี่ยในเมือง กม./ชม. */
  kmh: 30,
  /** เวลาเที่ยวต่อวันสูงสุด (นาที) */
  dayMinutes: 480,
  /** เวลาออกเดินทาง 09:00 (นาทีนับจากเที่ยงคืน) */
  dayStart: 540,
  budgetPerDay: 4000,
  /** ตัวคูณแปลงระยะเส้นตรงเป็นระยะถนนโดยประมาณ */
  roadFactor: 1.41,
  radiusOptions: [5, 10, 15, 25],
  defaultRadiusKm: 15,
  maxStopsPerDay: 6,
  maxPeople: 20,
} as const;

/** ขอบเขตจังหวัดภูเก็ตโดยประมาณ ใช้ตรวจตำแหน่งปัจจุบัน */
export const PHUKET_BOUNDS = { minLat: 7.74, maxLat: 8.21, minLon: 98.25, maxLon: 98.48 };

export type CostCategory = 'travel' | 'entry' | 'guide';
export const CATS: { id: CostCategory; c: string; icon: string }[] = [
  { id: 'travel', c: 'var(--c-travel)', icon: 'car' },
  { id: 'entry', c: 'var(--c-entry)', icon: 'ticket' },
  { id: 'guide', c: 'var(--c-guide)', icon: 'person' },
];

export const dayColor = (i: number): string => `var(--day-${(i % 9) + 1})`;
