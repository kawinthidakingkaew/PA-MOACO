import type { CSSProperties } from 'react';
import { Icon, iconKids } from './Icon.tsx';
import { ICON_PATHS, type IconName } from './icons.ts';
import { cx } from '../domain/format.ts';
import { useT } from '../i18n/i18n.tsx';
import { cssVars } from './style.ts';

export interface PlaceImageProps {
  color?: string; glyph?: string; seed?: number; src?: string; alt?: string; label?: string;
  showSlot?: boolean; className?: string; style?: CSSProperties;
  /** ภาพประกอบที่ข้อความรอบข้างอธิบายแล้ว ให้โปรแกรมอ่านหน้าจอข้ามไป */
  decorative?: boolean;
}

/** ภาพสถานที่ ถ้ายังไม่มีรูปจริง (src) จะวาดภาพแทนจากสีโปรไฟล์และไอคอน */
export function PlaceImage({ color = 'var(--accent)', glyph = 'image', seed: s = 1, src, alt, label, showSlot = true, className, style, decorative }: PlaceImageProps) {
  const t = useT();
  const seed = s % 7;
  return (
    <div className={cx('ar-place', className)} style={cssVars({ '--c': color }, style)} {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': alt ?? label ?? t('placeImg') })}>
      {src ? <img src={src} alt="" loading="lazy" /> : (
        <svg className="ar-place-art" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d={`M0 ${70 - seed * 2} Q40 ${56 + seed} 80 ${66 - seed} T160 ${60 + seed * 2} V100 H0z`} fill="currentColor" opacity={0.16} />
          <path d={`M0 ${84 - seed} Q50 ${74 + seed} 100 ${82 - seed} T160 ${78 + seed} V100 H0z`} fill="currentColor" opacity={0.22} />
          <circle cx={120 - seed * 6} cy={28 + seed} r={11} fill="currentColor" opacity={0.18} />
          <g transform="translate(62 26) scale(1.5)" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.9}>
            {iconKids(ICON_PATHS[glyph as IconName] ?? ICON_PATHS.image)}
          </g>
        </svg>
      )}
      {!src && showSlot ? <span className="ar-place-slot"><Icon name="image" size={12} />{t('placeImg')}</span> : null}
      {label ? <span className="ar-place-label">{label}</span> : null}
    </div>
  );
}
