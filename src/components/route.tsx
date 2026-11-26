import { Fragment, useState } from 'react';
import { Icon } from './Icon.tsx';
import { PlaceImage } from './PlaceImage.tsx';
import { Button, IconButton, Notice, Segmented, TextField } from './ui.tsx';
import { cssVars } from './style.ts';
import { CONFIG, dayColor } from '../domain/config.ts';
import { START_POINTS } from '../data/places.ts';
import { PROF, PROFILE_GLYPH } from '../data/profiles.ts';
import { dur, fmt, fmt1, hhmm, nm } from '../domain/format.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import type { DayResult, Poi, ProfileId, StartPoint } from '../domain/types.ts';

export interface StartPointPickerProps {
  value: StartPoint | null; onChange?: (v: StartPoint | null) => void; options?: StartPoint[];
  radiusKm?: number; onRadius?: (km: number) => void;
  onPinMode?: () => void; pinMode?: boolean; onUseLocation?: () => void; locating?: boolean; message?: string | null;
}
export function StartPointPicker({ value: v, onChange, options = START_POINTS, radiusKm, onRadius, onPinMode, pinMode, onUseLocation, locating, message }: StartPointPickerProps) {
  const t = useT(), l = useLang();
  const [q, setQ] = useState('');
  const area = (o: StartPoint) => (l === 'en' ? o.areaEn ?? o.area : o.area);
  const res = q
    ? options.filter((o) => (o.th + (o.area ?? '') + (o.en ?? '') + (o.areaEn ?? '')).toLowerCase().includes(q.toLowerCase()))
    : v ? [] : options.slice(0, 4);
  return (
    <div className="ar-start">
      <div className="ar-field-label">{t('start')}<span className="ar-muted" style={{ fontWeight: 400, fontSize: 12.5 }}>{t('startNear')}</span></div>
      {v ? (
        <div className="ar-start-sel">
          <span className="ic"><Icon name="pin" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{nm(v, l)}</b>
            <small>{(area(v) ? area(v) + ' · ' : '') + v.lat.toFixed(4) + ', ' + v.lon.toFixed(4)}</small>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onChange?.(null)}>{t('change')}</Button>
        </div>
      ) : (
        <TextField icon="search" value={q} placeholder={t('searchPh')} onChange={setQ} />
      )}
      {res.length ? (
        <ul className="ar-start-res" aria-label={t('results')}>
          {res.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => { setQ(''); onChange?.(o); }}>
                <Icon name="pin" size={17} /><span>{nm(o, l)}<small>{area(o)}</small></span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!v ? (
        <div className="ar-row">
          <Button size="sm" icon={pinMode ? 'x' : 'map'} aria-pressed={!!pinMode} onClick={onPinMode}>{pinMode ? t('pinCancel') : t('pinMap')}</Button>
          <Button size="sm" icon="locate" variant="ghost" disabled={locating} onClick={onUseLocation}>{locating ? t('locating') : t('useLoc')}</Button>
        </div>
      ) : null}
      {message ? <Notice tone="warn">{message}</Notice> : null}
      {onRadius && radiusKm != null ? (
        <div className="ar-field">
          <span className="ar-field-label">{t('radius')}</span>
          <Segmented label={t('radiusLbl')} value={radiusKm} onChange={onRadius} options={CONFIG.radiusOptions.map((k) => ({ value: k as number, label: `${k} ${t('km')}` }))} />
        </div>
      ) : null}
    </div>
  );
}

export function DayTabs({ days, value = -1, onChange, all = true }: { days: number; value?: number; onChange?: (i: number) => void; all?: boolean }) {
  const t = useT();
  return (
    <nav className="ar-dtabs" aria-label={t('pickDay')}>
      {all ? <button type="button" className="ar-dtab" aria-pressed={value < 0} onClick={() => onChange?.(-1)}>{t('allDays')}</button> : null}
      {Array.from({ length: days }, (_, i) => (
        <button key={i} type="button" className="ar-dtab" style={cssVars({ '--c': dayColor(i) })} aria-pressed={value === i} onClick={() => onChange?.(i)}>
          <i />{t('dayN', { n: i + 1 })}
        </button>
      ))}
    </nav>
  );
}

export interface StopListProps { day: DayResult; index?: number; start: StartPoint | null; readOnly?: boolean; onMove?: (k: number, dir: -1 | 1) => void; onRemove?: (k: number) => void }
export function StopList({ day: d, index: i = 0, start, readOnly, onMove, onRemove }: StopListProps) {
  const t = useT(), l = useLang();
  return (
    <section className="ar-day" style={cssVars({ '--c': dayColor(i) })} aria-label={t('dayN', { n: i + 1 })}>
      <div className="ar-day-h">
        <span className="sw" /><b>{t('dayN', { n: i + 1 })}</b>
        <span className="sum">{`${d.rows.length} ${t('stops')} · ${fmt1(d.km)} ${t('km')} · ${dur(d.minutes, l)}`}</span>
      </div>
      <ol className="ar-stops">
        <li className="ar-stop">
          <span className="n is-start" aria-hidden="true"><Icon name="pin" size={14} /></span>
          <div><b>{start ? nm(start, l) : t('start')}</b><div className="meta"><span className="ar-num">{hhmm(CONFIG.dayStart)}</span><span>{t('depart')}</span></div></div>
        </li>
        {d.rows.map((r, k) => (
          <Fragment key={r.poi.id}>
            <li className="ar-leg" aria-hidden="true"><Icon name="car" size={13} />{`${fmt1(r.legKm)} ${t('km')} · ${Math.max(1, Math.round(r.legMin))} ${t('min')}`}</li>
            <li className="ar-stop">
              <span className="n">{k + 1}</span>
              <div style={{ minWidth: 0 }}>
                <b>{nm(r.poi, l)}</b>
                <div className="meta">
                  <span className="ar-num">{hhmm(r.arrive)}</span>
                  <span>{t('stay', { d: dur(r.stay, l) })}</span>
                  <span>{r.cost ? fmt(r.cost) + ' ฿' : t('noFee')}</span>
                </div>
              </div>
              {readOnly ? null : (
                <div className="act">
                  <IconButton icon="arrow-up" label={t('up')} disabled={k === 0} onClick={() => onMove?.(k, -1)} />
                  <IconButton icon="arrow-down" label={t('down')} disabled={k === d.rows.length - 1} onClick={() => onMove?.(k, 1)} />
                  <IconButton icon="trash" label={t('remove', { x: nm(r.poi, l) })} danger onClick={() => onRemove?.(k)} />
                </div>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
      {d.rows.length === 0 ? <p className="ar-muted" style={{ margin: '0 14px 12px', fontSize: 13 }}>{t('emptyDay')}</p> : null}
      {d.over ? <div style={{ padding: '0 10px 10px' }}><Notice tone="warn" title={t('overDay')}>{t('overDayBody')}</Notice></div> : null}
      <div className="ar-day-f">
        <span>{t('travel')} <b>{fmt(d.cost.travel)} ฿</b></span>
        <span>{t('entry')} <b>{fmt(d.cost.entry)} ฿</b></span>
        <span>{t('dayTotal')} <b>{fmt(d.total)} ฿</b></span>
      </div>
    </section>
  );
}

export function PoiSuggestion({ poi: p, profile, distanceKm, onAdd }: { poi: Poi; profile?: ProfileId; distanceKm?: number; onAdd?: (id: string) => void }) {
  const t = useT(), l = useLang();
  const prof = profile ? PROF[profile] : null;
  return (
    <div className="ar-sugg">
      <PlaceImage color={prof ? prof.color : 'var(--accent)'} glyph={prof ? PROFILE_GLYPH[prof.id] : 'image'} seed={p.th.length} showSlot={false} decorative />
      <div style={{ minWidth: 0 }}>
        <b>{nm(p, l)}</b>
        <small>{(distanceKm != null ? `${fmt1(distanceKm)} ${t('km')} · ` : '') + `${p.hours} ${t('hr')} · ` + (p.cost ? fmt(p.cost) + ' ฿' : t('free'))}</small>
      </div>
      <Button size="sm" icon="plus" aria-label={t('addX', { x: nm(p, l) })} onClick={() => onAdd?.(p.id)}>{t('add')}</Button>
    </div>
  );
}
