import type { Poi, StartPoint } from '../domain/types.ts';
import { PROFILES } from './profiles.ts';
import { RAW_POIS } from './raw.ts';

export const POIS: Poi[] = RAW_POIS.map((r, i) => {
  const tags = r[4].split(' ');
  return {
    id: 'P' + String(i + 1).padStart(3, '0'),
    th: r[0], en: r[1], lat: r[2], lon: r[3], tags, cost: r[5], hours: r[6], rating: r[7],
    profs: PROFILES.filter((pr) => pr.tags.some((t) => tags.includes(t))).map((pr) => pr.id),
  };
});
export const POI: Record<string, Poi> = Object.fromEntries(POIS.map((p) => [p.id, p]));

export const START_POINTS: StartPoint[] = [
  { id: 'S1', th: 'สถานีขนส่งภูเก็ต (บขส. 1)', en: 'Phuket Bus Terminal 1', area: 'อ.เมืองภูเก็ต', areaEn: 'Mueang Phuket', lat: 7.887, lon: 98.396 },
  { id: 'S2', th: 'หาดป่าตอง', en: 'Patong Beach', area: 'อ.กะทู้', areaEn: 'Kathu', lat: 7.8961, lon: 98.2964 },
  { id: 'S3', th: 'หาดกะตะ', en: 'Kata Beach', area: 'อ.เมืองภูเก็ต', areaEn: 'Mueang Phuket', lat: 7.82, lon: 98.299 },
  { id: 'S4', th: 'ท่าอากาศยานภูเก็ต', en: 'Phuket Airport', area: 'อ.ถลาง', areaEn: 'Thalang', lat: 8.109, lon: 98.307 },
  { id: 'S5', th: 'วงเวียนห้าแยกฉลอง', en: 'Chalong Circle', area: 'อ.เมืองภูเก็ต', areaEn: 'Mueang Phuket', lat: 7.844, lon: 98.338 },
  { id: 'S6', th: 'หาดบางเทา / เชิงทะเล', en: 'Bang Tao / Cherng Talay', area: 'อ.ถลาง', areaEn: 'Thalang', lat: 8.0, lon: 98.2945 },
];

export const poiCount = (profileId: string): number => POIS.filter((p) => p.profs.includes(profileId as Poi['profs'][number])).length;
