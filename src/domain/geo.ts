import { CONFIG, PHUKET_BOUNDS } from './config.ts';
import type { LatLon } from './types.ts';

/** ระยะเส้นตรงบนผิวโลก (กม.) */
export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371, r = Math.PI / 180;
  const dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** ระยะถนนโดยประมาณ — ระบบจริงใช้ระยะจาก routing engine (เช่น OSRM) แทน */
export const roadKm = (a: LatLon, b: LatLon): number => haversineKm(a, b) * CONFIG.roadFactor;

export const inPhuket = (p: LatLon): boolean =>
  p.lat >= PHUKET_BOUNDS.minLat && p.lat <= PHUKET_BOUNDS.maxLat && p.lon >= PHUKET_BOUNDS.minLon && p.lon <= PHUKET_BOUNDS.maxLon;
