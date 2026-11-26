import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import { MiniMap } from './MiniMap.tsx';
import { Button, Dialog, IconButton, Notice, Segmented, TextField, type ButtonProps } from './ui.tsx';
import { dayColor } from '../domain/config.ts';
import { fmt, fmt1, parseEmails } from '../domain/format.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import type { ExportAction, Lang, LatLon, User } from '../domain/types.ts';

/**
 * ปุ่มเข้าสู่ระบบด้วย Google
 * ระบบจริงต้องใช้ปุ่มทางการตาม Sign in with Google branding guidelines (Google Identity Services)
 * ตัว "G" ตรงนี้เป็นตัวแทนเท่านั้น
 */
export function GoogleButton({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children?: ReactNode }) {
  const t = useT();
  return (
    <button type="button" className="ar-google" onClick={onClick} disabled={disabled}>
      <span className="ar-google-mark" aria-hidden="true">G</span>{children ?? t('loginGoogle')}
    </button>
  );
}

const initials = (name: string) => (name || '?').trim().charAt(0).toUpperCase();

export function AccountMenu({ user, onMyTrips, onLogout }: { user: User; onMyTrips?: () => void; onLogout?: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="ar-acct" ref={ref}>
      <button type="button" className="ar-acct-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`${t('account')}: ${user.name}`} onClick={() => setOpen(!open)}>
        {user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="ar-avatar" aria-hidden="true">{initials(user.name)}</span>}
        <span className="nm">{user.name}</span>
        <Icon name="arrow-down" size={14} />
      </button>
      {open ? (
        <div className="ar-acct-menu" role="menu">
          <div className="who"><b>{user.name}</b><small>{user.email}</small></div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onMyTrips?.(); }}><Icon name="history" size={16} />{t('myTrips')}</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout?.(); }}><Icon name="logout" size={16} />{t('logout')}</button>
        </div>
      ) : null}
    </div>
  );
}

/** ปุ่มที่ต้องเข้าสู่ระบบ: ยังกดได้เสมอ (FR-36) ผู้ใช้ทั่วไปกดแล้วจะเปิดหน้าต่างเข้าสู่ระบบ */
export function LockedButton({ locked, ...rest }: ButtonProps & { locked?: boolean }) {
  const t = useT();
  if (!locked) return <Button {...rest} />;
  return <Button {...rest} icon="lock" title={t('needLogin')} aria-description={t('needLogin')} />;
}

export function LoginDialog({ open, action = null, busy, error, note, onGoogle, onClose }: { open: boolean; action?: ExportAction | null; busy?: boolean; error?: string | null; note?: string; onGoogle: () => void; onClose: () => void }) {
  const t = useT();
  const titleKey = action === 'email' ? 'loginTitle_email' : action === 'pdf' ? 'loginTitle_pdf' : action === 'save' ? 'loginTitle_save' : 'login';
  return (
    <Dialog open={open} title={t(titleKey)} onClose={onClose}>
      {action ? <p className="ar-dialog-lead">{t('loginKeep')}</p> : null}
      <div className="ar-perks">
        <b>{t('loginPerks')}</b>
        {(['perk1', 'perk2', 'perk3', 'perk4'] as const).map((k) => <span key={k}><Icon name="check" size={15} />{t(k)}</span>)}
      </div>
      <GoogleButton onClick={onGoogle} disabled={busy}>{busy ? t('signingIn') : undefined}</GoogleButton>
      {error ? <Notice tone="warn">{error}</Notice> : null}
      <p className="ar-dialog-note">{t('loginPrivacy')}</p>
      {note ? <p className="ar-dialog-note">{note}</p> : null}
      <button type="button" className="ar-link" onClick={onClose}>{t('later')}</button>
    </Dialog>
  );
}

export interface EmailOptions { recipients: string[]; attachPdf: boolean; includeLink: boolean }
export function EmailPanel({ email, sent, busy, error, onSend, onClose }: { email: string; sent?: boolean; busy?: boolean; error?: string | null; onSend: (o: EmailOptions) => void; onClose?: () => void }) {
  const t = useT();
  const [extra, setExtra] = useState('');
  const [attachPdf, setAttach] = useState(true);
  const [includeLink, setLink] = useState(true);
  const [fieldErr, setFieldErr] = useState<string | null>(null);
  const send = () => {
    const { valid, invalid } = parseEmails(extra);
    if (invalid.length) { setFieldErr(t('emailInvalid', { x: invalid.join(', ') })); return; }
    setFieldErr(null);
    onSend({ recipients: [email, ...valid.filter((v) => v.toLowerCase() !== email.toLowerCase())], attachPdf, includeLink });
  };
  return (
    <section className="ar-sheet" aria-label={t('emailTitle')}>
      <div className="ar-dialog-h">
        <h3 className="ar-h3">{t('emailTitle')}</h3>
        {onClose ? <IconButton icon="x" label={t('close')} onClick={onClose} /> : null}
      </div>
      <div className="ar-field">
        <span className="ar-field-label">{t('sendTo')}</span>
        <div className="ar-readonly">{email} <span className="ar-muted">{t('yourAccount')}</span></div>
      </div>
      <TextField label={t('moreRecipients')} placeholder={t('moreRecipientsPh')} value={extra} onChange={setExtra} icon="mail" type="text" inputMode="email" error={fieldErr ?? undefined} />
      <label className="ar-check"><input type="checkbox" checked={attachPdf} onChange={(e) => setAttach(e.target.checked)} />{t('attachPdf')}</label>
      <label className="ar-check"><input type="checkbox" checked={includeLink} onChange={(e) => setLink(e.target.checked)} />{t('includeLink')}</label>
      {error ? <Notice tone="warn">{error}</Notice> : null}
      {sent ? <Notice title={t('emailSent', { x: email })} />
        : <Button variant="primary" icon="mail" block disabled={busy} onClick={send}>{busy ? t('sending') : t('send')}</Button>}
    </section>
  );
}

export interface PdfOptions { map: boolean; stops: boolean; cost: boolean; lang: Lang }
export function PdfPanel({ title, onPrint, onClose }: { title?: string; onPrint: (o: PdfOptions) => void; onClose?: () => void }) {
  const t = useT();
  const [o, setO] = useState<PdfOptions>({ map: true, stops: true, cost: true, lang: useLang() });
  const opts: [keyof Omit<PdfOptions, 'lang'>, 'incMap' | 'incStops' | 'incCost'][] = [['map', 'incMap'], ['stops', 'incStops'], ['cost', 'incCost']];
  return (
    <section className="ar-sheet" aria-label={t('pdfTitle')}>
      <div className="ar-dialog-h">
        <h3 className="ar-h3">{t('pdfTitle')}</h3>
        {onClose ? <IconButton icon="x" label={t('close')} onClick={onClose} /> : null}
      </div>
      <div className="ar-pdf">
        <div className="ar-pdf-page" role="img" aria-label={t('pdfPreview')}>
          <b>{title ?? 'PDF'}</b>
          {o.map ? <div className="m" /> : null}
          {o.stops ? <><i /><i /><i style={{ width: '70%' }} /></> : null}
          {o.cost ? <div className="tb" /> : null}
        </div>
        <div className="ar-col" style={{ gap: 10 }}>
          {opts.map(([k, s]) => (
            <label key={k} className="ar-check"><input type="checkbox" checked={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.checked })} />{t(s)}</label>
          ))}
          <div className="ar-field">
            <span className="ar-field-label">{t('docLang')}</span>
            <Segmented label={t('docLang')} value={o.lang} onChange={(lang) => setO({ ...o, lang })} options={[{ value: 'th' as Lang, label: t('thai') }, { value: 'en' as Lang, label: t('english') }]} />
          </div>
          <div className="ar-row">
            <Button variant="primary" icon="download" onClick={() => onPrint(o)}>{t('download')}</Button>
            <Button icon="printer" onClick={() => onPrint(o)}>{t('print')}</Button>
          </div>
          <span className="ar-muted" style={{ fontSize: 12 }}>{t('pdfNote')}</span>
        </div>
      </div>
    </section>
  );
}

export interface TripListItem { id: string; title: string; start: string; stops: number; km: number; total: number; date: string; changed?: number; pins: (LatLon & { day: number })[] }
export function TripHistoryItem({ trip: x, onOpen, onPdf, onEmail, onRename, onDuplicate, onDelete }: {
  trip: TripListItem; onOpen?: () => void; onPdf?: () => void; onEmail?: () => void; onRename?: () => void; onDuplicate?: () => void; onDelete?: () => void;
}) {
  const t = useT();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [menu]);
  const pick = (f?: () => void) => () => { setMenu(false); f?.(); };
  return (
    <article className="ar-trip">
      <MiniMap pins={x.pins.map((p) => ({ lat: p.lat, lon: p.lon, color: dayColor(p.day) }))} fit minSpan={0.18} aspect={1.4} labels={false} credit={false} className="ar-trip-map" label={x.title} />
      <div className="ar-trip-body">
        <b>{x.title}</b>
        <div className="ar-trip-meta">
          <span>{x.start}</span>
          <span>{`${x.stops} ${t('stops')} · ${fmt1(x.km)} ${t('km')}`}</span>
          <span>{fmt(x.total)} ฿</span>
          <span>{t('savedOn', { d: x.date })}</span>
        </div>
        {x.changed ? <span className="ar-trip-warn"><Icon name="alert" size={14} />{t('dataChanged', { n: x.changed })}</span> : null}
      </div>
      <div className="ar-trip-act">
        <Button variant="primary" size="sm" onClick={onOpen}>{t('open')}</Button>
        <Button size="sm" icon="download" onClick={onPdf}>PDF</Button>
        <Button size="sm" icon="mail" onClick={onEmail}>{t('sendEmail')}</Button>
        <div className="ar-menu-wrap" ref={ref}>
          <IconButton icon="more" label={`${t('more')}: ${x.title}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)} />
          {menu ? (
            <div className="ar-acct-menu ar-trip-menu" role="menu">
              <button type="button" role="menuitem" onClick={pick(onRename)}><Icon name="edit" size={16} />{t('rename')}</button>
              <button type="button" role="menuitem" onClick={pick(onDuplicate)}><Icon name="share" size={16} />{t('duplicate')}</button>
              <button type="button" role="menuitem" className="is-danger" onClick={pick(onDelete)}><Icon name="trash" size={16} />{t('del')}</button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
