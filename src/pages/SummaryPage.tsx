import { useEffect, useMemo, useState } from 'react';
import { EmailPanel, LockedButton, PdfPanel, type EmailOptions, type PdfOptions } from '../components/account.tsx';
import { MiniMap, type MapPin } from '../components/MiniMap.tsx';
import { BudgetBar, CostTable, DayTimeline } from '../components/summary.tsx';
import { Button, KpiTile, Notice } from '../components/ui.tsx';
import { EmptyState } from './EmptyState.tsx';
import { POI } from '../data/places.ts';
import { PROF } from '../data/profiles.ts';
import { CONFIG, dayColor } from '../domain/config.ts';
import { dur, fmt, fmt1, fmtDate, nm } from '../domain/format.ts';
import { evalTrip } from '../domain/planner.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import { api, toDraftData } from '../services/api.ts';
import { useAuth } from '../state/auth.tsx';
import { useRequireUser } from '../state/loginGate.tsx';
import { usePrefs } from '../state/prefs.tsx';
import { navigate, PATHS, takePendingPanel } from '../state/router.ts';
import { useToast } from '../state/toast.tsx';
import { useTrip } from '../state/trip.tsx';
import type { ExportAction, User } from '../domain/types.ts';

type Panel = 'email' | 'pdf' | null;

/** ขั้นที่ 3: สรุปเส้นทาง ระยะทาง เวลา ค่าใช้จ่าย และการนำออก (FR-21–28, 35, 36, UC-06–07, 18–19) */
export function SummaryPage() {
  const t = useT(), l = useLang();
  const prefs = usePrefs();
  const { user } = useAuth();
  const requireUser = useRequireUser();
  const toast = useToast();
  const { draft, dispatch } = useTrip();
  const { start, plan, people, budgetPerDay, profileId } = draft;

  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<ExportAction | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printJob, setPrintJob] = useState<(PdfOptions & { restore: typeof l }) | null>(null);

  const trip = useMemo(() => (start ? evalTrip(start, plan, people) : null), [start, plan, people]);

  // เปิดแผง PDF/อีเมลอัตโนมัติเมื่อมาจาก "ทริปของฉัน"
  useEffect(() => {
    const p = takePendingPanel();
    if (p && user) setPanel(p);
  }, []);

  // พิมพ์หลังจากเปลี่ยนภาษาเอกสารแล้วเรนเดอร์เสร็จ จากนั้นคืนภาษาเดิม
  useEffect(() => {
    if (!printJob || l !== printJob.lang) return;
    const id = requestAnimationFrame(() => {
      // เอกสารพิมพ์ใช้สีโหมดสว่างเสมอ
      const root = document.documentElement, theme = root.getAttribute('data-theme');
      root.setAttribute('data-theme', 'light');
      window.print();
      if (theme) root.setAttribute('data-theme', theme);
      if (printJob.restore !== printJob.lang) prefs.setLang(printJob.restore);
      setPrintJob(null);
    });
    return () => cancelAnimationFrame(id);
  }, [printJob, l, prefs]);

  if (!start || !trip || !profileId || trip.stops === 0) {
    return <EmptyState icon="route" title={t('noPlan')} body={t('noPlanBody')} action={<Button variant="primary" icon="route" onClick={() => navigate(draft.profileId ? PATHS.plan : PATHS.profile)}>{t('startPlanning')}</Button>} />;
  }

  const prof = PROF[profileId];
  const nDays = plan.length;
  const budget = budgetPerDay * nDays;
  const over = trip.total > budget;
  const routes = plan.map((ids, i) => ({ color: dayColor(i), points: [start, ...ids.map((id) => POI[id]).filter(Boolean)] }));
  const pins: MapPin[] = [];
  plan.forEach((ids, i) => ids.forEach((id, k) => { const p = POI[id]; if (p) pins.push({ lat: p.lat, lon: p.lon, color: dayColor(i), label: k + 1 }); }));
  const title = t('h1Summary', { n: nDays });
  const isSaved = !!draft.savedId && !draft.dirty;

  const doSave = async (u: User) => {
    setBusy('save'); setError(null);
    try {
      const saved = await api.saveTrip(u, toDraftData(draft), draft.savedId);
      const wasUpdate = !!draft.savedId;
      dispatch({ type: 'saved', id: saved.id });
      toast(wasUpdate ? t('updatedToast') : t('savedToast'));
    } catch { setError(t('saveFailed')); }
    finally { setBusy(null); }
  };
  const act = (a: ExportAction) => requireUser(a, (u) => {
    if (a === 'save') void doSave(u);
    else { setPanel(a); setEmailSent(false); setError(null); }
  });
  const sendEmail = async (o: EmailOptions) => {
    if (!user) return;
    setBusy('email'); setError(null);
    try { await api.sendTripEmail(user, { ...o, tripId: draft.savedId, draft: toDraftData(draft) }); setEmailSent(true); }
    catch { setError(t('sendFailed')); }
    finally { setBusy(null); }
  };
  const print = (o: PdfOptions) => {
    setPrintJob({ ...o, restore: l });
    if (o.lang !== l) prefs.setLang(o.lang);
  };

  const saveLabel = busy === 'save' ? t('saving') : isSaved ? t('saved') : draft.savedId ? t('updateTrip') : t('save');
  const po = printJob ?? { map: true, stops: true, cost: true };

  return (
    <div className="ar-col page-summary" style={{ gap: 16, marginTop: 8 }}
      data-print-map={po.map ? '1' : '0'} data-print-stops={po.stops ? '1' : '0'} data-print-cost={po.cost ? '1' : '0'}>
      <div className="print-only print-head">
        <b>{t('appName')}</b>
        <span>{t('printedOn', { d: fmtDate(new Date().toISOString(), l) })}</span>
      </div>
      <div className="ar-sec-h" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="ar-eyebrow">{`${t('stepOf', { n: 3 })} · ${nm(prof, l)} · ${nDays} ${t('days')} · ${people} ${t('people')}`}</p>
          <h1 className="ar-h1">{title}</h1>
          <p className="ar-lead">{t('startFrom', { x: nm(start, l) })}</p>
        </div>
        <div className="ar-row no-print summary-actions">
          <Button icon="edit" onClick={() => navigate(PATHS.plan)}>{t('editRoute')}</Button>
          <LockedButton locked={!user} icon="printer" onClick={() => act('pdf')}>{t('printPdf')}</LockedButton>
          <LockedButton locked={!user} icon="mail" onClick={() => act('email')}>{t('sendEmail')}</LockedButton>
          <LockedButton locked={!user} variant="primary" icon={isSaved ? 'check' : 'download'} disabled={busy === 'save' || (isSaved && !!user)} onClick={() => act('save')}>{saveLabel}</LockedButton>
        </div>
      </div>
      {error ? <div className="no-print"><Notice tone="warn">{error}</Notice></div> : null}
      {panel === 'email' && user ? <div className="no-print"><EmailPanel email={user.email} sent={emailSent} busy={busy === 'email'} onSend={sendEmail} onClose={() => setPanel(null)} /></div> : null}
      {panel === 'pdf' && user ? <div className="no-print"><PdfPanel title={title} onPrint={print} onClose={() => setPanel(null)} /></div> : null}

      <div className="ar-kpis">
        <KpiTile icon="route" label={t('kDist')} value={fmt1(trip.km)} unit={t('km')} sub={`${trip.stops} ${t('stopsVisited')}`} />
        <KpiTile icon="car" label={t('kDrive')} value={dur(trip.driveMin, l)} sub={t('kSpeed', { n: CONFIG.kmh })} />
        <KpiTile icon="clock" label={t('kTime')} value={dur(trip.minutes, l)} sub={t('kTimeSub')} />
        <KpiTile icon="wallet" label={t('kCost')} value={fmt(trip.total)} unit="฿" tone={over ? 'warn' : 'ok'}
          sub={t(over ? 'overBudget' : 'useBudget', { n: Math.round((trip.total / budget) * 100) })} />
      </div>

      <div className="ar-split summary-split">
        <div className="ar-col">
          <div className="print-map"><MiniMap start={start} fit minSpan={0.05} pins={pins} routes={routes} aspect={1.6} style={{ borderRadius: 'var(--radius-xl)' }} /></div>
          <div className="ar-col print-stops">{trip.days.map((d, i) => <DayTimeline key={i} index={i} day={d} start={start} />)}</div>
        </div>
        <aside className="ar-panel print-cost">
          <div className="ar-panel-in">
            <span className="ar-h3">{t('budget')}</span>
            <BudgetBar cost={trip.cost} budget={budget} />
            <hr className="ar-divider" />
            <span className="ar-h3">{t('perDayCost')}</span>
            <CostTable days={trip.days} guide={trip.cost.guide} />
            <Notice title={t('how')}>{t('howBody', { k: CONFIG.bahtPerKm, g: fmt(CONFIG.guideFlat) })}</Notice>
          </div>
        </aside>
      </div>
    </div>
  );
}
