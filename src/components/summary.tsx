import { Icon } from './Icon.tsx';
import { cssVars } from './style.ts';
import { CATS, CONFIG, dayColor } from '../domain/config.ts';
import { dur, fmt, fmt1, hhmm, nm } from '../domain/format.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import type { DayResult, StartPoint, TripCost } from '../domain/types.ts';

export function BudgetBar({ cost, budget }: { cost: TripCost; budget: number }) {
  const t = useT();
  const total = CATS.reduce((a, c) => a + (cost[c.id] || 0), 0);
  const scale = Math.max(total, budget) || 1, over = total > budget;
  return (
    <div className="ar-budget">
      <div className="ar-budget-top">
        <span>{t('used')} <b>{fmt(total)} ฿</b> {t('ofBudget')} <b>{fmt(budget)} ฿</b></span>
        <span style={{ color: over ? 'var(--warn)' : 'var(--ok)', fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <Icon name={over ? 'alert' : 'check'} size={15} />{over ? t('over', { x: fmt(total - budget) }) : t('left', { x: fmt(budget - total) })}
        </span>
      </div>
      <div className="ar-stack" role="img" aria-label={t('budgetShare')}>
        {CATS.map((c) => { const v = cost[c.id] || 0; return v ? <i key={c.id} style={cssVars({ '--c': c.c, width: (v / scale) * 100 + '%' })} title={`${t(c.id)} ${fmt(v)} ฿`} /> : null; })}
        {budget ? <span className="bud" style={{ left: `calc(${(budget / scale) * 100}% - 1px)` }}><span>{t('budgetLbl')}</span></span> : null}
      </div>
      <div className="ar-legend">
        {CATS.map((c) => <span key={c.id} style={cssVars({ '--c': c.c })}><i />{`${t(c.id)} ${Math.round(((cost[c.id] || 0) / (total || 1)) * 100)}%`}</span>)}
      </div>
    </div>
  );
}

export function CostTable({ days, guide = CONFIG.guideFlat }: { days: DayResult[]; guide?: number }) {
  const t = useT();
  const dayCats = CATS.filter((c) => c.id !== 'guide') as { id: 'travel' | 'entry'; c: string }[];
  const tot = (k: 'travel' | 'entry') => days.reduce((a, d) => a + d.cost[k], 0);
  const grand = days.reduce((a, d) => a + d.total, 0) + guide;
  return (
    <table className="ar-table">
      <thead>
        <tr>
          <th scope="col">{t('dayCol')}</th>
          {dayCats.map((c) => <th scope="col" key={c.id}><span className="ar-legend-dot" style={cssVars({ '--c': c.c })} />{t(c.id)}</th>)}
          <th scope="col">{t('total')}</th>
        </tr>
      </thead>
      <tbody>
        {days.map((d, i) => (
          <tr key={i}>
            <td><span className="ar-legend-dot" style={cssVars({ '--c': dayColor(i) }, { borderRadius: '50%' })} />{t('dayN', { n: i + 1 })}</td>
            {dayCats.map((c) => <td key={c.id}>{fmt(d.cost[c.id])}</td>)}
            <td>{fmt(d.total)}</td>
          </tr>
        ))}
        <tr className="is-flat">
          <td colSpan={dayCats.length + 1}><span className="ar-legend-dot" style={cssVars({ '--c': 'var(--c-guide)' })} />{t('guideFlat')}</td>
          <td>{fmt(guide)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td>{t('tripTotal')}</td>{dayCats.map((c) => <td key={c.id}>{fmt(tot(c.id))}</td>)}<td>{fmt(grand)} ฿</td></tr>
      </tfoot>
    </table>
  );
}

export function DayTimeline({ day: d, index: i = 0, start }: { day: DayResult; index?: number; start: StartPoint | null }) {
  const t = useT(), l = useLang();
  return (
    <section className="ar-day" style={cssVars({ '--c': dayColor(i) })} aria-label={t('dayN', { n: i + 1 })}>
      <div className="ar-day-h">
        <span className="sw" /><b>{t('dayN', { n: i + 1 })}</b>
        <span className="sum">{`${fmt1(d.km)} ${t('km')} · ${hhmm(CONFIG.dayStart)}–${hhmm(d.end)} · ${fmt(d.total)} ฿`}</span>
      </div>
      <ol className="ar-tl">
        <li>
          <span className="t">{hhmm(CONFIG.dayStart)}</span>
          <span className="n is-start"><Icon name="pin" size={12} /></span>
          <div><b>{start ? nm(start, l) : t('start')}</b><small>{t('depart')}</small></div>
          <span />
        </li>
        {d.rows.map((r, k) => (
          <li key={r.poi.id}>
            <span className="t">{hhmm(r.arrive)}</span>
            <span className="n">{k + 1}</span>
            <div><b>{nm(r.poi, l)}</b><small>{`${t('stay', { d: dur(r.stay, l) })} · ${fmt1(r.legKm)} ${t('km')} ${Math.max(1, Math.round(r.legMin))} ${t('min')}`}</small></div>
            <span className="c">{r.cost ? fmt(r.cost) + ' ฿' : '—'}</span>
          </li>
        ))}
      </ol>
      {d.rows.length === 0 ? <p className="ar-muted" style={{ margin: '0 14px 12px', fontSize: 13 }}>{t('emptyDay')}</p> : null}
    </section>
  );
}
