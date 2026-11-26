import { useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon.tsx';
import { cx } from '../domain/format.ts';
import { cssVars } from './style.ts';
import { useT } from '../i18n/i18n.tsx';
import type { Lang, ThemePref } from '../domain/types.ts';

/* ---------- Button ---------- */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  block?: boolean;
}
export function Button({ variant = 'secondary', size, icon, iconRight, block, className, children, type = 'button', ...rest }: ButtonProps) {
  const s = size === 'sm' ? 15 : 17;
  return (
    <button type={type} {...rest} className={cx('ar-btn', 'ar-btn-' + variant, size === 'sm' && 'ar-btn-sm', block && 'ar-btn-block', className)}>
      {icon ? <Icon name={icon} size={s} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={s} /> : null}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { icon: IconName; label: string; danger?: boolean }
export function IconButton({ icon, label, danger, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} {...rest} className={cx('ar-iconbtn', danger && 'is-danger', className)}>
      <Icon name={icon} size={17} />
    </button>
  );
}

/* ---------- Theme + language ---------- */
export function ThemeToggle({ value = 'system', onChange }: { value?: ThemePref; onChange?: (v: ThemePref) => void }) {
  const t = useT();
  const opts: [ThemePref, IconName][] = [['light', 'sun'], ['dark', 'moon'], ['system', 'auto']];
  return (
    <div className="ar-theme" role="group" aria-label={t('theme')}>
      {opts.map(([v, ic]) => (
        <button key={v} type="button" aria-pressed={value === v} aria-label={t(v)} title={t(v)} onClick={() => onChange?.(v)}>
          <Icon name={ic} size={16} />
        </button>
      ))}
    </div>
  );
}
export function LangToggle({ value = 'th', onChange }: { value?: Lang; onChange?: (v: Lang) => void }) {
  const t = useT();
  const opts: [Lang, string][] = [['th', 'ไทย'], ['en', 'EN']];
  return (
    <div className="ar-lang" role="group" aria-label={t('lang')}>
      <Icon name="globe" size={16} />
      {opts.map(([v, label]) => (
        <button key={v} type="button" lang={v} aria-pressed={value === v} onClick={() => onChange?.(v)}>{label}</button>
      ))}
    </div>
  );
}

/* ---------- StepNav ---------- */
export function StepNav({ current = 0, reached, onSelect }: { current?: number; reached?: number; onSelect?: (i: number) => void }) {
  const t = useT();
  const r = reached ?? current;
  return (
    <nav className="ar-steps" aria-label={t('steps')}>
      {(['step1', 'step2', 'step3'] as const).map((k, i) => (
        <button key={k} type="button" className={cx('ar-step', i < current && 'is-done')} aria-current={i === current ? 'step' : undefined}
          disabled={i > r} onClick={() => onSelect?.(i)}>
          <i>{i < current ? <Icon name="check" size={13} strokeWidth={2.4} /> : i + 1}</i>
          <span>{t(k)}</span>
        </button>
      ))}
    </nav>
  );
}

/* ---------- Tag ---------- */
export function Tag({ color, children }: { color?: string; children: ReactNode }) {
  return (
    <span className={cx('ar-tag', color && 'is-tone')} style={color ? cssVars({ '--c': color }) : undefined}>
      {color ? <i /> : null}{children}
    </span>
  );
}

/* ---------- Fields ---------- */
export interface TextFieldProps {
  id?: string; label?: string; value: string; onChange?: (v: string) => void; placeholder?: string; icon?: IconName;
  error?: string; hint?: string; suffix?: ReactNode; type?: string; inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoFocus?: boolean; readOnly?: boolean; ariaLabel?: string;
}
export function TextField(p: TextFieldProps) {
  const auto = useId();
  const id = p.id ?? auto;
  const msgId = id + '-msg';
  return (
    <div className="ar-field">
      {p.label ? <label htmlFor={id}>{p.label}</label> : null}
      <div className={cx('ar-input', p.icon && 'has-icon', p.error && 'is-error')}>
        {p.icon ? <Icon name={p.icon} size={17} /> : null}
        <input id={id} type={p.type ?? 'text'} value={p.value} placeholder={p.placeholder} inputMode={p.inputMode} autoFocus={p.autoFocus}
          readOnly={p.readOnly} aria-label={p.label ? undefined : p.ariaLabel ?? p.placeholder} aria-invalid={!!p.error}
          aria-describedby={p.error || p.hint ? msgId : undefined} onChange={(e) => p.onChange?.(e.target.value)} />
        {p.suffix ? <span className="suffix">{p.suffix}</span> : null}
      </div>
      {p.error ? <span id={msgId} className="err"><Icon name="alert" size={13} />{p.error}</span>
        : p.hint ? <span id={msgId} className="hint">{p.hint}</span> : null}
    </div>
  );
}

export interface StepperProps { label: string; hint?: string; value: number; min?: number; max?: number; step?: number; unit?: string; format?: (v: number) => string; onChange?: (v: number) => void }
export function Stepper({ label, hint, value, min = 1, max = 99, step = 1, unit, format, onChange }: StepperProps) {
  const t = useT();
  const set = (n: number) => onChange?.(Math.max(min, Math.min(max, n)));
  return (
    <div className="ar-inline">
      <div>
        <div className="ar-field-label">{label}</div>
        {hint ? <div className="ar-muted" style={{ fontSize: 12 }}>{hint}</div> : null}
      </div>
      <div className="ar-stepper">
        <button type="button" aria-label={t('dec') + label} disabled={value <= min} onClick={() => set(value - step)}><Icon name="minus" size={16} /></button>
        <output aria-live="polite">{format ? format(value) : value + (unit ? ' ' + unit : '')}</output>
        <button type="button" aria-label={t('inc') + label} disabled={value >= max} onClick={() => set(value + step)}><Icon name="plus" size={16} /></button>
      </div>
    </div>
  );
}

export function Segmented<V extends string | number>({ label, value, options, onChange }: { label: string; value: V; options: { value: V; label: string }[]; onChange?: (v: V) => void }) {
  return (
    <div className="ar-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={value === o.value} onClick={() => onChange?.(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- Notice, KPI, status ---------- */
export function Notice({ tone = 'info', title, children, actions }: { tone?: 'info' | 'warn'; title?: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={cx('ar-notice', tone === 'warn' && 'is-warn')} role={tone === 'warn' ? 'alert' : 'note'}>
      <Icon name={tone === 'warn' ? 'alert' : 'info'} size={18} />
      <div className="body">
        {title ? <b>{title}</b> : null}
        {children}
        {actions ? <div className="acts">{actions}</div> : null}
      </div>
    </div>
  );
}

export function KpiTile({ icon, label, value, unit, sub, tone }: { icon?: IconName; label: string; value: ReactNode; unit?: string; sub?: ReactNode; tone?: 'ok' | 'warn' }) {
  return (
    <div className={cx('ar-kpi', tone === 'ok' && 'is-ok', tone === 'warn' && 'is-warn')}>
      <span className="lab">{icon ? <Icon name={icon} size={15} /> : null}{label}</span>
      <span className="val">{value}{unit ? <span>{unit}</span> : null}</span>
      {sub ? <span className="sub">{sub}</span> : null}
    </div>
  );
}

export interface PlanStatusProps { state?: 'computing' | 'done'; progress?: number; title?: string; detail?: string; onCancel?: () => void; onRerun?: () => void }
export function PlanStatus({ state = 'computing', progress = 0, title, detail, onCancel, onRerun }: PlanStatusProps) {
  const t = useT();
  if (state === 'done') {
    return (
      <div className="ar-status" role="status">
        <span className="ok-ic"><Icon name="check" size={15} strokeWidth={2.6} /></span>
        <div className="grow"><b>{title ?? t('done')}</b><small>{detail ?? ''}</small></div>
        {onRerun ? <Button size="sm" variant="ghost" icon="route" onClick={onRerun}>{t('rerun')}</Button> : null}
      </div>
    );
  }
  const pct = Math.round(progress * 100);
  return (
    <div className="ar-status" role="status" aria-live="polite">
      <span className="ar-spin" aria-hidden="true" />
      <div className="grow">
        <b>{t('computing')}</b>
        <small>{detail ?? t('round', { n: Math.round(pct * 1.2) })}</small>
        <div className="ar-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('computing')}><i style={{ width: pct + '%' }} /></div>
      </div>
      {onCancel ? <Button size="sm" onClick={onCancel}>{t('cancel')}</Button> : null}
    </div>
  );
}

export function Toast({ children }: { children?: ReactNode }) {
  return children ? <div className="ar-toast" role="status"><Icon name="check" size={16} />{children}</div> : null;
}

/* ---------- Dialog (ใช้กับเข้าสู่ระบบ ยืนยันลบ เปลี่ยนชื่อ) ---------- */
export function Dialog({ open, title, onClose, children, labelledBy }: { open: boolean; title: ReactNode; onClose: () => void; children: ReactNode; labelledBy?: string }) {
  const t = useT();
  const autoId = useId();
  const titleId = labelledBy ?? autoId;
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const closeLabel = t('close');
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = box.current;
    const first = el?.querySelector<HTMLElement>('input, button:not([aria-label="' + closeLabel + '"]), [href]');
    (first ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('button:not(:disabled), input, [href], [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, closeLabel]);
  if (!open) return null;
  return (
    <div className="ar-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ar-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={box} tabIndex={-1}>
        <div className="ar-dialog-h">
          <h2 id={titleId}>{title}</h2>
          <IconButton icon="x" label={t('close')} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

