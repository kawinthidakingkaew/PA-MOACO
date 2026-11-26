import type { Profile, ProfileId } from '../domain/types.ts';

type ProfileSeed = Omit<Profile, 'color'>;

/** 11 โปรไฟล์จากงานวิจัย PA-MOACO (tourist_profiles) */
const SEED: ProfileSeed[] = [
  { id: 'cafe', th: 'คาเฟ่ฮอปปิ้ง', en: 'Café hopping', w: [0.2, 0.6, 0.2], tags: ['cafe'], days: [1, 7], desc: 'ไล่ชิมกาแฟ ร้านขนม และคาเฟ่วิวสวย', descEn: 'Coffee, desserts and cafés with a view' },
  { id: 'culture', th: 'วัฒนธรรม', en: 'Culture', w: [0.2, 0.7, 0.1], tags: ['culture', 'museum'], days: [1, 7], desc: 'วัด ศาลเจ้า ย่านเมืองเก่า และพิพิธภัณฑ์', descEn: 'Temples, shrines, Old Town and museums' },
  { id: 'adventure', th: 'ผจญภัย', en: 'Adventure', w: [0.3, 0.6, 0.1], tags: ['adventure', 'nature'], days: [1, 7], desc: 'ซิปไลน์ คายัค น้ำตก และกิจกรรมกลางแจ้ง', descEn: 'Ziplines, kayaking, waterfalls and the outdoors' },
  { id: 'workation', th: 'เวิร์กเคชัน', en: 'Workation', w: [0.2, 0.6, 0.2], tags: ['workation', 'cafe'], days: [1, 3], desc: 'ทำงานจากที่สวย ๆ สลับกับคาเฟ่', descEn: 'Work from beautiful spots between cafés' },
  { id: 'festival', th: 'เทศกาล/อีเวนต์', en: 'Festivals & events', w: [0.5, 0.3, 0.2], tags: ['festival', 'event', 'concert', 'marathon'], days: [1, 3], desc: 'ถนนคนเดิน โชว์ คอนเสิร์ต และงานประจำปี', descEn: 'Walking streets, shows, concerts and annual events' },
  { id: 'nature', th: 'ธรรมชาติ', en: 'Nature', w: [0.3, 0.6, 0.1], tags: ['nature', 'national_park'], days: [1, 2], desc: 'หาด อุทยาน จุดชมวิว และป่าชายเลน', descEn: 'Beaches, national parks, viewpoints and mangroves' },
  { id: 'wellness', th: 'สุขภาพ/สปา', en: 'Wellness & spa', w: [0.2, 0.7, 0.1], tags: ['wellness', 'spa'], days: [1, 2], desc: 'สปา นวดไทย โยคะ และรีทรีต', descEn: 'Spas, Thai massage, yoga and retreats' },
  { id: 'solo', th: 'เที่ยวคนเดียว', en: 'Solo', w: [0.3, 0.4, 0.3], tags: ['cafe', 'culture'], days: [1, 2], desc: 'คาเฟ่และวัฒนธรรม เดินทางง่าย คุมงบ', descEn: 'Cafés and culture, easy to reach, on budget' },
  { id: 'day_trip', th: 'เที่ยววันเดียว', en: 'Day trip', w: [0.6, 0.2, 0.2], tags: ['cafe', 'local_food'], days: [1, 1], desc: 'ใกล้ ๆ กัน กินอิ่ม ไม่ต้องค้างคืน', descEn: 'Close together, good food, no overnight' },
  { id: 'short_trip', th: 'ทริปสั้น 2–4 วัน', en: 'Short trip (2–4 days)', w: [0.3, 0.5, 0.2], tags: ['relax', 'cafe', 'culture'], days: [2, 4], desc: 'พักผ่อน คาเฟ่ และวัฒนธรรมแบบไม่เร่ง', descEn: 'Unhurried rest, cafés and culture' },
  { id: 'long_trip', th: 'ทริปยาว 5+ วัน', en: 'Long trip (5+ days)', w: [0.2, 0.6, 0.2], tags: ['relax', 'cafe', 'culture', 'nature'], days: [5, 9], desc: 'เที่ยวครบทั้งเกาะ ทั้งหาด เมือง และธรรมชาติ', descEn: 'The whole island: beaches, town and nature' },
];

export const PROFILES: Profile[] = SEED.map((p) => ({ ...p, color: `var(--prof-${p.id.replace('_', '-')})` }));
export const PROF: Record<ProfileId, Profile> = Object.fromEntries(PROFILES.map((p) => [p.id, p])) as Record<ProfileId, Profile>;

export const PROFILE_GLYPH: Record<ProfileId, string> = {
  cafe: 'cup', culture: 'temple', adventure: 'mountain', workation: 'laptop', festival: 'flag', nature: 'leaf',
  wellness: 'drop', solo: 'person', day_trip: 'sun', short_trip: 'calendar', long_trip: 'route',
};

export const TAG_TH: Record<string, string> = { cafe: 'คาเฟ่', culture: 'วัฒนธรรม', museum: 'พิพิธภัณฑ์', adventure: 'ผจญภัย', nature: 'ธรรมชาติ', national_park: 'อุทยาน', workation: 'เวิร์กเคชัน', festival: 'เทศกาล', event: 'อีเวนต์', concert: 'การแสดง', marathon: 'มาราธอน', wellness: 'สุขภาพ', spa: 'สปา', local_food: 'อาหารท้องถิ่น', relax: 'พักผ่อน', beach: 'ชายหาด', viewpoint: 'จุดชมวิว' };
export const TAG_EN: Record<string, string> = { cafe: 'Café', culture: 'Culture', museum: 'Museum', adventure: 'Adventure', nature: 'Nature', national_park: 'National park', workation: 'Workation', festival: 'Festival', event: 'Event', concert: 'Show', marathon: 'Marathon', wellness: 'Wellness', spa: 'Spa', local_food: 'Local food', relax: 'Relax', beach: 'Beach', viewpoint: 'Viewpoint' };

export const isProfileId = (v: unknown): v is ProfileId => typeof v === 'string' && v in PROF;
