import { Fragment, useState } from 'react';
import { Icon } from './Icon.tsx';
import { PlaceImage } from './PlaceImage.tsx';
import { cssVars } from './style.ts';
import { PROFILES, PROFILE_GLYPH } from '../data/profiles.ts';
import { poiCount } from '../data/places.ts';
import { nm } from '../domain/format.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import type { Profile, ProfileId } from '../domain/types.ts';

export function WeightBars({ weights, color }: { weights: [number, number, number]; color?: string }) {
  const t = useT();
  const L = [t('dist'), t('satis'), t('costW')];
  return (
    <div className="ar-weights" style={color ? cssVars({ '--c': color }) : undefined} role="list" aria-label={t('weights')}>
      {weights.map((v, i) => (
        <Fragment key={i}>
          <span role="listitem">{L[i]}</span>
          <div className="bar" aria-hidden="true"><i style={{ width: Math.round(v * 100) + '%' }} /></div>
          <em>{Math.round(v * 100)}%</em>
        </Fragment>
      ))}
    </div>
  );
}

export function ProfileCard({ profile: p, selected, onSelect, image, showWeights }: { profile: Profile; selected?: boolean; onSelect?: (id: ProfileId) => void; image?: string; showWeights?: boolean }) {
  const t = useT(), l = useLang();
  return (
    <button type="button" className="ar-pcard" style={cssVars({ '--c': p.color })} aria-pressed={!!selected} onClick={() => onSelect?.(p.id)}>
      <PlaceImage color={p.color} glyph={PROFILE_GLYPH[p.id]} seed={p.id.length} src={image} decorative />
      <div className="ar-pcard-body">
        <div className="ar-pcard-h">
          <span className="dot" />
          <b>{nm(p, l)}</b>
          {selected ? <span className="chk"><Icon name="check" size={14} strokeWidth={2.6} /></span> : null}
        </div>
        <p>{l === 'en' ? p.descEn : p.desc}</p>
        <div className="ar-pcard-meta">
          <span>{t('places')} <b>{poiCount(p.id)}</b></span>
          <span>{t('trip')} <b>{p.days[0] === p.days[1] ? p.days[0] : `${p.days[0]}–${p.days[1]}`}</b> {t('days')}</span>
        </div>
        {showWeights ? <WeightBars weights={p.w} color={p.color} /> : null}
      </div>
    </button>
  );
}

type DayFilter = 'all' | '1' | '2-4' | '5';
export function ProfileGrid({ value, onChange, minWidth }: { value: ProfileId | null; onChange?: (id: ProfileId) => void; minWidth?: number }) {
  const t = useT();
  const [f, setF] = useState<DayFilter>('all');
  const filters: [DayFilter, 'fAll' | 'f1' | 'f24' | 'f5'][] = [['all', 'fAll'], ['1', 'f1'], ['2-4', 'f24'], ['5', 'f5']];
  const list = PROFILES.filter((p) => f === 'all' || (f === '1' ? p.days[0] <= 1 : f === '2-4' ? p.days[1] >= 2 && p.days[0] <= 4 : p.days[1] >= 5));
  return (
    <div className="ar-col">
      <div className="ar-filter" role="group" aria-label={t('filterDays')}>
        {filters.map(([k, s]) => <button key={k} type="button" className="ar-chip" aria-pressed={f === k} onClick={() => setF(k)}>{t(s)}</button>)}
      </div>
      <div className="ar-pgrid" style={minWidth ? { gridTemplateColumns: `repeat(auto-fill,minmax(min(${minWidth}px,100%),1fr))` } : undefined}>
        {list.map((p) => <ProfileCard key={p.id} profile={p} selected={value === p.id} onSelect={onChange} />)}
      </div>
    </div>
  );
}
