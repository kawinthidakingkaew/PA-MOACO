import { useState } from 'react';
import { MiniMap } from '../components/MiniMap.tsx';
import { PlaceImage } from '../components/PlaceImage.tsx';
import { ProfileGrid, WeightBars } from '../components/profile.tsx';
import { Button, Tag } from '../components/ui.tsx';
import { POIS } from '../data/places.ts';
import { PROF, PROFILE_GLYPH, TAG_EN, TAG_TH } from '../data/profiles.ts';
import { nm } from '../domain/format.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import { navigate, PATHS } from '../state/router.ts';
import { useTrip } from '../state/trip.tsx';
import type { ProfileId } from '../domain/types.ts';

/** ขั้นที่ 1: เลือก 1 จาก 11 โปรไฟล์ (FR-01–03, UC-01) */
export function ProfilePage() {
  const t = useT(), l = useLang();
  const { draft, dispatch } = useTrip();
  const [sel, setSel] = useState<ProfileId>(draft.profileId ?? 'culture');
  const p = PROF[sel];
  const pois = POIS.filter((x) => x.profs.includes(sel));
  const top = [...pois].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const go = () => { dispatch({ type: 'profile', id: sel }); navigate(PATHS.plan); };

  return (
    <div className="ar-split page-profile" style={{ marginTop: 8 }}>
      <div className="ar-col" style={{ gap: 18 }}>
        <div>
          <p className="ar-eyebrow">{t('stepOf', { n: 1 })}</p>
          <h1 className="ar-h1">{t('h1Profile')}</h1>
          <p className="ar-lead">{t('leadProfile')}</p>
        </div>
        <ProfileGrid value={sel} onChange={setSel} minWidth={200} />
      </div>
      <aside className="ar-panel ar-sticky" aria-label={t('profilePreview')}>
        <div className="ar-panel-in">
          <div>
            <p className="ar-eyebrow" style={{ color: p.color }}>{t('selected')}</p>
            <h2 className="ar-h2">{nm(p, l)}</h2>
            <p className="ar-lead" style={{ fontSize: 14 }}>{l === 'en' ? p.descEn : p.desc}</p>
          </div>
          <MiniMap pins={pois.map((x) => ({ lat: x.lat, lon: x.lon, color: p.color }))} fit minSpan={0.3} aspect={1.15} label={t('profileMap', { x: nm(p, l) })} />
          <div>
            <div className="ar-sec-h" style={{ marginBottom: 8 }}>
              <span className="ar-h3" style={{ fontSize: 15 }}>{t('samples')}</span>
              <small>{t('matchN', { n: pois.length })}</small>
            </div>
            <div className="ar-strip">
              {top.map((x, i) => <PlaceImage key={x.id} color={p.color} glyph={PROFILE_GLYPH[p.id]} seed={i + 2} label={nm(x, l)} showSlot={false} alt={nm(x, l)} />)}
            </div>
          </div>
          <div>
            <div className="ar-h3" style={{ fontSize: 15, marginBottom: 8 }}>{t('priority')}</div>
            <WeightBars weights={p.w} color={p.color} />
          </div>
          <div className="ar-row">{p.tags.map((g) => <Tag key={g} color={p.color}>{(l === 'en' ? TAG_EN : TAG_TH)[g] ?? g}</Tag>)}</div>
          <div className="ar-cta"><Button variant="primary" block iconRight="chevron-right" onClick={go}>{t('chooseProfile')}</Button></div>
        </div>
      </aside>
      <div className="mobile-cta" role="region" aria-label={t('selected')}>
        <span><small>{t('selected')}</small><b>{nm(p, l)}</b></span>
        <Button variant="primary" iconRight="chevron-right" onClick={go}>{t('step2')}</Button>
      </div>
    </div>
  );
}
