import { ICON_PATHS, type IconName } from './icons.ts';
import { cx } from '../domain/format.ts';

export type { IconName };

export function iconKids(list: readonly string[]) {
  return list.map((d, i) => {
    if (/^c\d/.test(d)) {
      const [x, y, r] = d.slice(1).trim().split(/\s+/).map(Number);
      return <circle key={i} cx={x} cy={y} r={r} />;
    }
    if (d.startsWith('F ')) return <path key={i} d={d.slice(2)} fill="currentColor" stroke="none" />;
    return <path key={i} d={d} />;
  });
}

export interface IconProps { name: IconName | string; size?: number; strokeWidth?: number; title?: string; className?: string }

export function Icon({ name, size = 18, strokeWidth = 1.75, title, className }: IconProps) {
  const paths = ICON_PATHS[name as IconName] ?? ICON_PATHS.info;
  return (
    <svg className={cx('ar-icon', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title ? <title>{title}</title> : null}
      {iconKids(paths)}
    </svg>
  );
}

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="10" style={{ fill: 'var(--accent)' }} />
      <path d="M8 24 C12 12, 18 26, 26 10" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="1 4.2" style={{ stroke: 'var(--on-accent)' }} />
      <circle cx="8" cy="24" r="2.6" style={{ fill: 'var(--sun)' }} />
      <circle cx="26" cy="10" r="2.6" style={{ fill: 'var(--on-accent)' }} />
    </svg>
  );
}
