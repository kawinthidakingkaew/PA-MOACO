import { useCallback, useEffect, useMemo, useState } from 'react';
import { TripHistoryItem, type TripListItem } from '../components/account.tsx';
import { Icon } from '../components/Icon.tsx';
import { Button, Dialog, TextField } from '../components/ui.tsx';
import { EmptyState } from './EmptyState.tsx';
import { POI } from '../data/places.ts';
import { PROF } from '../data/profiles.ts';
import { fmtDate, nm } from '../domain/format.ts';
import { useLang, useT, type T } from '../i18n/i18n.tsx';
import { api } from '../services/api.ts';
import { useAuth } from '../state/auth.tsx';
import { useRequireUser } from '../state/loginGate.tsx';
import { navigate, PATHS } from '../state/router.ts';
import { useToast } from '../state/toast.tsx';
import { useTrip } from '../state/trip.tsx';
import type { Lang, SavedTrip } from '../domain/types.ts';

export function tripTitle(x: SavedTrip, t: T, l: Lang): string {
  if (x.customTitle) return x.customTitle;
  const p = x.draft.profileId ? PROF[x.draft.profileId] : null;
  return t('tripTitle', { p: p ? nm(p, l) : '—', n: x.draft.plan.length });
}

function toItem(x: SavedTrip, t: T, l: Lang): TripListItem {
  const ids = x.draft.plan.flatMap((ids, day) => ids.map((id) => ({ id, day })));
  return {
    id: x.id, title: tripTitle(x, t, l), start: x.draft.start ? nm(x.draft.start, l) : '—',
    stops: x.stops, km: x.km, total: x.total, date: fmtDate(x.savedAt, l),
    changed: ids.filter((i) => !POI[i.id]).length,
    pins: ids.filter((i) => POI[i.id]).map((i) => ({ lat: POI[i.id].lat, lon: POI[i.id].lon, day: i.day })),
  };
}

/** ทริปของฉัน (FR-27, UC-20) */
export function MyTripsPage() {
  const t = useT(), l = useLang();
  const { user, ready } = useAuth();
  const requireUser = useRequireUser();
  const toast = useToast();
  const { draft, dispatch } = useTrip();
  const [trips, setTrips] = useState<SavedTrip[] | null>(null);
  const [q, setQ] = useState('');
  const [f, setF] = useState<'all' | '30'>('all');
  const [renaming, setRenaming] = useState<SavedTrip | null>(null);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState<SavedTrip | null>(null);

  const load = useCallback(async () => { if (user) setTrips(await api.listTrips(user)); }, [user]);
  useEffect(() => { void load(); }, [load]);

  const list = useMemo(() => {
    const since = Date.now() - 30 * 864e5;
    return (trips ?? [])
      .filter((x) => f === 'all' || new Date(x.savedAt).getTime() >= since)
      .filter((x) => !q || tripTitle(x, t, l).toLowerCase().includes(q.toLowerCase()));
  }, [trips, f, q, t, l]);

  if (!ready) return null;
  if (!user) {
    return <EmptyState icon="lock" title={t('myTrips')} body={t('loginToSee')} action={<Button variant="primary" icon="person" onClick={() => requireUser(null)}>{t('login')}</Button>} />;
  }

  const open = (x: SavedTrip, panel?: 'pdf' | 'email') => { dispatch({ type: 'load', trip: x }); navigate(PATHS.summary, { panel }); };
  const newTrip = () => { dispatch({ type: 'reset' }); navigate(PATHS.profile); };
  const doRename = async () => {
    if (!renaming) return;
    await api.renameTrip(user, renaming.id, name); setRenaming(null); toast(t('renamedToast')); void load();
  };
  const doDuplicate = async (x: SavedTrip) => {
    await api.duplicateTrip(user, x.id, t('copyOf', { x: tripTitle(x, t, l) })); toast(t('duplicatedToast')); void load();
  };
  const doDelete = async () => {
    if (!deleting) return;
    await api.deleteTrip(user, deleting.id);
    if (draft.savedId === deleting.id) dispatch({ type: 'unlink' });
    setDeleting(null); toast(t('deletedToast')); void load();
  };

  const total = trips?.length ?? 0;
  return (
    <div className="ar-col page-trips" style={{ gap: 16, marginTop: 8 }}>
      <div className="ar-sec-h" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="ar-h1">{t('myTrips')}</h1>
          <p className="ar-lead">{t('tripsCount', { n: total })}</p>
        </div>
        <div className="ar-row trips-tools">
          <div className="trips-search"><TextField icon="search" value={q} onChange={setQ} placeholder={t('searchTrips')} /></div>
          <div className="ar-row" role="group" aria-label={t('fAll')}>
            <button type="button" className="ar-chip" aria-pressed={f === 'all'} onClick={() => setF('all')}>{t('fAll')}</button>
            <button type="button" className="ar-chip" aria-pressed={f === '30'} onClick={() => setF('30')}>{t('last30')}</button>
          </div>
          <Button variant="primary" icon="plus" onClick={newTrip}>{t('newTrip')}</Button>
        </div>
      </div>

      {trips === null ? null : total === 0 ? (
        <div className="ar-empty">
          <Icon name="history" size={28} />
          <b>{t('emptyTrips')}</b>
          <span className="ar-muted">{t('emptyTripsBody')}</span>
          <Button variant="primary" icon="plus" onClick={newTrip}>{t('newTrip')}</Button>
        </div>
      ) : list.length === 0 ? (
        <p className="ar-muted">{t('noResults')}</p>
      ) : (
        list.map((x) => (
          <TripHistoryItem key={x.id} trip={toItem(x, t, l)}
            onOpen={() => open(x)} onPdf={() => open(x, 'pdf')} onEmail={() => open(x, 'email')}
            onRename={() => { setRenaming(x); setName(tripTitle(x, t, l)); }}
            onDuplicate={() => void doDuplicate(x)} onDelete={() => setDeleting(x)} />
        ))
      )}

      <Dialog open={!!renaming} title={t('renameTitle')} onClose={() => setRenaming(null)}>
        <form className="ar-col" style={{ gap: 12 }} onSubmit={(e) => { e.preventDefault(); void doRename(); }}>
          <TextField label={t('tripName')} value={name} onChange={setName} />
          <div className="ar-row" style={{ justifyContent: 'flex-end' }}>
            <Button onClick={() => setRenaming(null)}>{t('cancel')}</Button>
            <Button variant="primary" type="submit" disabled={!name.trim()}>{t('saveName')}</Button>
          </div>
        </form>
      </Dialog>
      <Dialog open={!!deleting} title={t('delTitle')} onClose={() => setDeleting(null)}>
        <p className="ar-dialog-lead">{deleting ? t('delBody', { x: tripTitle(deleting, t, l) }) : ''}</p>
        <div className="ar-row" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={() => setDeleting(null)}>{t('cancel')}</Button>
          <Button variant="danger" icon="trash" onClick={() => void doDelete()}>{t('delConfirm')}</Button>
        </div>
      </Dialog>
    </div>
  );
}
