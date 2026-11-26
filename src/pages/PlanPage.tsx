import { useEffect, useMemo, useRef, useState } from 'react';
import { MiniMap, type MapPin, type MapRoute } from '../components/MiniMap.tsx';
import { DayTabs, PoiSuggestion, StartPointPicker, StopList } from '../components/route.tsx';
import { Button, Notice, PlanStatus, Stepper } from '../components/ui.tsx';
import { EmptyState } from './EmptyState.tsx';
import { POI } from '../data/places.ts';
import { PROF } from '../data/profiles.ts';
import { CONFIG, dayColor } from '../domain/config.ts';
import { fmt, fmt1, nm } from '../domain/format.ts';
import { haversineKm, inPhuket } from '../domain/geo.ts';
import { addStop, candidates, evalTrip, moveStop, removeStop } from '../domain/planner.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import { api } from '../services/api.ts';
import { navigate, PATHS } from '../state/router.ts';
import { useTrip } from '../state/trip.tsx';
import type { LatLon, StartPoint } from '../domain/types.ts';

type Stage = 'setup' | 'computing' | 'done';

/** ขั้นที่ 2: จุดเริ่มต้น จำนวนวัน คน งบ แล้วจัดเส้นทางและแก้ไขรายวัน (FR-04–20, UC-02–05) */
export function PlanPage() {
  const t = useT(), l = useLang();
  const { draft, dispatch } = useTrip();
  const { profileId, start, radiusKm, days, people, budgetPerDay, plan } = draft;
  const hasPlan = plan.length > 0;
  const [stage, setStage] = useState<Stage>(hasPlan && start ? 'done' : 'setup');
  const [progress, setProgress] = useState(0);
  const [dv, setDv] = useState(0);
  const [pinMode, setPinMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const P = profileId ? PROF[profileId] : null;
  const trip = useMemo(() => (start ? evalTrip(start, plan, people) : null), [start, plan, people]);
  const cands = useMemo(() => (start && profileId ? candidates(profileId, start, radiusKm) : []), [start, profileId, radiusKm]);

  if (!P || !profileId) {
    return <EmptyState icon="person" title={t('noProfile')} action={<Button variant="primary" icon="chevron-left" onClick={() => navigate(PATHS.profile)}>{t('backProfile')}</Button>} />;
  }

  const run = async () => {
    if (!start) return;
    abort.current?.abort();
    const ac = new AbortController(); abort.current = ac;
    setStage('computing'); setProgress(0); setError(null);
    try {
      const p = await api.planRoute({ profile: profileId, start, days, radiusKm }, setProgress, ac.signal);
      dispatch({ type: 'plan', plan: p }); setDv(0); setStage('done');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') { setError(t('planFailed')); setStage('setup'); }
    }
  };
  const cancel = () => { abort.current?.abort(); setStage(hasPlan ? 'done' : 'setup'); };

  const setStart = (s: StartPoint | null) => { setMsg(null); setPinMode(false); dispatch({ type: 'start', start: s }); if (!s) setStage('setup'); };
  const onPick = (p: LatLon) => {
    if (!inPhuket(p)) { setMsg(t('pinOutside')); return; }
    setStart({ id: 'PIN', th: 'จุดที่ปักหมุด', en: 'Dropped pin', lat: +p.lat.toFixed(5), lon: +p.lon.toFixed(5) });
  };
  const useLocation = () => {
    setMsg(null);
    if (!navigator.geolocation) { setMsg(t('locDenied')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        if (!inPhuket(p)) { setMsg(t('locOutside')); return; }
        setStart({ id: 'LOC', th: 'ตำแหน่งปัจจุบัน', en: 'My location', lat: +p.lat.toFixed(5), lon: +p.lon.toFixed(5) });
      },
      () => { setLocating(false); setMsg(t('locDenied')); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const done = stage === 'done' && !!trip && hasPlan;
  const inPlan = new Set(plan.flat());
  const day = dv < 0 ? 0 : Math.min(dv, plan.length - 1);
  const lastId = plan[day]?.[plan[day].length - 1];
  const from: LatLon | null = lastId ? POI[lastId] : start;
  const sugg = cands.filter((x) => !inPlan.has(x.id)).map((x) => ({ ...x, d2: from ? haversineKm(from, x) : x.dist })).sort((a, b) => a.d2 - b.d2).slice(0, 4);

  const routes: MapRoute[] = [], pins: MapPin[] = [];
  if (done && start) plan.forEach((ids, i) => {
    const show = dv < 0 || dv === i;
    routes.push({ color: dayColor(i), dim: !show, points: [start, ...ids.map((id) => POI[id]).filter(Boolean)] });
    ids.forEach((id, k) => { const q = POI[id]; if (q) pins.push({ lat: q.lat, lon: q.lon, color: dayColor(i), label: k + 1, dim: !show }); });
  });
  const budgetTotal = budgetPerDay * plan.length;
  const over = !!trip && trip.total > budgetTotal;
  const eyebrow = `${t('stepOf', { n: 2 })} · ${nm(P, l)}`;

  const setup = (
    <>
      <div>
        <p className="ar-eyebrow">{eyebrow}</p>
        <h1 className="ar-h2">{t('h2Setup')}</h1>
        <p className="ar-lead" style={{ fontSize: 14 }}>{t('leadSetup')}</p>
      </div>
      <StartPointPicker value={start} onChange={setStart} radiusKm={radiusKm} onRadius={(km) => dispatch({ type: 'radius', km })}
        pinMode={pinMode} onPinMode={() => { setMsg(null); setPinMode(!pinMode); }} onUseLocation={useLocation} locating={locating} message={msg} />
      <hr className="ar-divider" />
      <Stepper label={t('nDays')} hint={t('profileRange', { a: P.days[0], b: P.days[1] })} value={days} min={P.days[0]} max={P.days[1]} unit={t('days')} onChange={(n) => dispatch({ type: 'days', n })} />
      <Stepper label={t('nPeople')} value={people} min={1} max={CONFIG.maxPeople} unit={t('people')} onChange={(n) => dispatch({ type: 'people', n })} />
      <Stepper label={t('perDay')} hint={t('wholeGroup')} value={budgetPerDay} min={1000} max={20000} step={500} format={(v) => fmt(v) + ' ฿'} onChange={(n) => dispatch({ type: 'budget', n })} />
      {error ? <Notice tone="warn">{error}</Notice> : null}
      {stage === 'computing'
        ? <PlanStatus state="computing" progress={progress} onCancel={cancel} />
        : (
          <div className="ar-cta">
            <Button variant="primary" block icon="route" disabled={!start} onClick={run}>{t('plan')}</Button>
            {!start ? <span className="ar-muted" style={{ fontSize: 12, textAlign: 'center' }}>{t('pickStartFirst')}</span> : null}
            {hasPlan && start ? <Button variant="ghost" block onClick={() => setStage('done')}>{t('cancel')}</Button> : null}
          </div>
        )}
    </>
  );

  const result = done && trip ? (
    <>
      <div>
        <p className="ar-eyebrow">{eyebrow}</p>
        <h1 className="ar-h2">{t('h2Result', { n: plan.length })}</h1>
      </div>
      <PlanStatus state="done" detail={`${trip.stops} ${t('stops')} · ${fmt1(trip.km)} ${t('km')} · ${fmt(trip.total)} ฿`} onRerun={() => setStage('setup')} />
      <DayTabs days={plan.length} value={dv} onChange={setDv} />
      {(dv < 0 ? plan.map((_, i) => i) : [day]).map((i) => (
        <StopList key={i} index={i} start={start} day={trip.days[i]}
          onRemove={(k) => dispatch({ type: 'plan', plan: removeStop(plan, i, k) })}
          onMove={(k, dir) => dispatch({ type: 'plan', plan: moveStop(plan, i, k, dir) })} />
      ))}
      {dv >= 0 ? (
        <div>
          <div className="ar-sec-h" style={{ marginBottom: 4 }}>
            <span className="ar-h3" style={{ fontSize: 15 }}>{t('nearby')}</span>
            <small>{t('inRadius', { n: radiusKm })}</small>
          </div>
          {sugg.length
            ? sugg.map((x) => <PoiSuggestion key={x.id} poi={x} profile={profileId} distanceKm={x.d2} onAdd={(id) => dispatch({ type: 'plan', plan: addStop(plan, day, id) })} />)
            : <p className="ar-muted" style={{ fontSize: 13 }}>{t('noNearby')}</p>}
        </div>
      ) : null}
      {over ? <Notice tone="warn" title={t('overTitle', { x: fmt(trip.total - budgetTotal) })}>{t('overBody')}</Notice> : null}
      <div className="ar-cta">
        <Button variant="primary" block iconRight="chevron-right" disabled={trip.stops === 0} onClick={() => navigate(PATHS.summary)}>{t('confirm')}</Button>
        <span className="ar-muted" style={{ fontSize: 12, textAlign: 'center' }}>{t('sumLine', { a: fmt(trip.total), b: fmt(budgetTotal) })}</span>
      </div>
    </>
  ) : null;

  return (
    <div className="ar-split-map page-plan" style={{ marginTop: 8 }}>
      <div className="ar-sticky">
        <MiniMap start={start} radiusKm={!done ? radiusKm : null} fit={!!start} pins={pins} routes={routes} faint={done ? [] : cands}
          aspect={1.05} controls onLocate={!done ? useLocation : undefined}
          onPick={pinMode ? onPick : undefined} pickHint={t('pinHint')}
          style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-panel)' }} />
      </div>
      <aside className="ar-panel" aria-live="polite">
        <div className="ar-panel-in">{done ? result : setup}</div>
      </aside>
    </div>
  );
}
