import { useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { Icon } from './Icon.tsx';
import { COAST, ISLANDS, MAINLAND } from '../data/raw.ts';
import { cx } from '../domain/format.ts';
import { useLang, useT } from '../i18n/i18n.tsx';
import type { LatLon } from '../domain/types.ts';

/*
 * แผนที่ภูเก็ตแบบ SVG (ไม่ต้องโหลด tile) ใช้ในเดโมและหน้าพิมพ์
 * ระบบจริงสามารถแทนด้วย MapLibre GL + OpenFreeMap โดยคง props ชุดเดิม
 */
const LON0 = 98.2, LAT0 = 8.26, KY = 4000, KX = 4000 * Math.cos((7.95 * Math.PI) / 180);
const proj = (lat: number, lon: number): [number, number] => [(lon - LON0) * KX, (LAT0 - lat) * KY];
const unproj = (x: number, y: number): LatLon => ({ lat: LAT0 - y / KY, lon: x / KX + LON0 });

function smoothClosed(pts: [number, number][]): string {
  const P = pts.map((q) => proj(q[0], q[1])), n = P.length;
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
function blob(lat: number, lon: number, rl: number, ro: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, w = 1 + 0.18 * Math.sin(i * 2.7 + lat * 99);
    pts.push([lat + Math.sin(a) * rl * w, lon + Math.cos(a) * ro * w]);
  }
  return pts;
}
let LAND: string[] | null = null;
const landPaths = () => (LAND ??= [smoothClosed(MAINLAND), smoothClosed(COAST), ...ISLANDS.map((i) => smoothClosed(blob(i[0], i[1], i[2], i[3])))]);

const MAP_LABELS: [string, string, number, number][] = [
  ['ถลาง', 'Thalang', 8.07, 98.345], ['กะทู้', 'Kathu', 7.935, 98.318], ['เมืองภูเก็ต', 'Phuket Town', 7.862, 98.378],
  ['ป่าตอง', 'Patong', 7.902, 98.315], ['ราไวย์', 'Rawai', 7.792, 98.33], ['เชิงทะเล', 'Cherng Talay', 7.988, 98.318],
];

export interface MapPin extends LatLon { color?: string; label?: string | number; dim?: boolean }
export interface MapRoute { points: LatLon[]; color: string; dim?: boolean }

export interface MiniMapProps {
  pins?: MapPin[]; routes?: MapRoute[]; faint?: LatLon[]; start?: LatLon | null; radiusKm?: number | null;
  fit?: boolean; minSpan?: number; aspect?: number; height?: number; labels?: boolean; credit?: boolean;
  controls?: boolean; label?: string; className?: string; style?: CSSProperties;
  /** เปิดโหมดปักหมุด: คลิกบนแผนที่แล้วส่งพิกัดกลับ */
  onPick?: (p: LatLon) => void;
  pickHint?: string;
  onLocate?: () => void;
}

export function MiniMap(props: MiniMapProps) {
  const t = useT(), lang = useLang();
  const { pins = [], routes = [], start, faint = [], aspect = 1.25 } = props;
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const view = useMemo(() => {
    const focus: LatLon[] = [...pins, ...faint, ...(start ? [start] : [])];
    let b = { a: 7.745, b: 8.222, c: 98.255, d: 98.47 };
    if (props.fit && focus.length) {
      b = { a: Infinity, b: -Infinity, c: Infinity, d: -Infinity };
      focus.forEach((p) => { b.a = Math.min(b.a, p.lat); b.b = Math.max(b.b, p.lat); b.c = Math.min(b.c, p.lon); b.d = Math.max(b.d, p.lon); });
      if (start && props.radiusKm) {
        const dl = props.radiusKm / 111;
        b.a = Math.min(b.a, start.lat - dl); b.b = Math.max(b.b, start.lat + dl); b.c = Math.min(b.c, start.lon - dl); b.d = Math.max(b.d, start.lon + dl);
      }
      const padL = Math.max(0.01, (b.b - b.a) * 0.12), padO = Math.max(0.01, (b.d - b.c) * 0.12);
      b.a -= padL; b.b += padL; b.c -= padO; b.d += padO;
      const minS = props.minSpan ?? 0.12, cl = (b.a + b.b) / 2, co = (b.c + b.d) / 2;
      if (b.b - b.a < minS) { b.a = cl - minS / 2; b.b = cl + minS / 2; }
      if (b.d - b.c < minS) { b.c = co - minS / 2; b.d = co + minS / 2; }
    }
    const p0 = proj(b.b, b.c), p1 = proj(b.a, b.d);
    let w = p1[0] - p0[0], hh = p1[1] - p0[1];
    if (w / hh < aspect) { const nw = hh * aspect; p0[0] -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; p0[1] -= (nh - hh) / 2; hh = nh; }
    // ซูมรอบจุดกึ่งกลาง
    const cxp = p0[0] + w / 2, cyp = p0[1] + hh / 2, zw = w / zoom, zh = hh / zoom;
    return { x: cxp - zw / 2, y: cyp - zh / 2, w: zw, h: zh };
  }, [pins, faint, start, props.fit, props.radiusKm, props.minSpan, aspect, zoom]);

  const u = view.w / 100;
  const L = landPaths();

  const pick = (e: MouseEvent<SVGSVGElement>) => {
    if (!props.onPick || !svgRef.current) return;
    const svg = svgRef.current, ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(ctm.inverse());
    props.onPick(unproj(q.x, q.y));
  };

  const pathOf = (pts: LatLon[]) => pts.map((p, i) => { const q = proj(p.lat, p.lon); return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('');

  return (
    <div className={cx('ar-map', props.onPick && 'is-picking', props.className)}
      style={{ aspectRatio: props.height ? undefined : String(aspect), height: props.height, ...props.style }}>
      <svg ref={svgRef} viewBox={[view.x, view.y, view.w, view.h].map((n) => n.toFixed(1)).join(' ')} preserveAspectRatio="xMidYMid slice"
        role="img" aria-label={props.label ?? t('map')} onClick={props.onPick ? pick : undefined}>
        <rect className="sea" x={view.x - view.w} y={view.y - view.h} width={view.w * 3} height={view.h * 3} />
        <g>{L.map((d, i) => <path key={i} className="shallow" d={d} strokeWidth={u * 2.2} />)}</g>
        <g>{L.map((d, i) => <path key={i} className="land" d={d} />)}</g>
        {props.labels !== false ? (
          <g>{MAP_LABELS.map((l) => { const q = proj(l[2], l[3]); return <text key={l[0]} className="lbl" x={q[0]} y={q[1]} fontSize={u * 3.4}>{lang === 'en' ? l[1] : l[0]}</text>; })}</g>
        ) : null}
        {start && props.radiusKm ? (() => { const c = proj(start.lat, start.lon); return <circle className="radius" cx={c[0]} cy={c[1]} r={props.radiusKm * (4000 / 111.32)} />; })() : null}
        <g>{faint.map((p, i) => { const q = proj(p.lat, p.lon); return <circle key={i} className="pin-faint" cx={q[0]} cy={q[1]} r={u * 1.1} />; })}</g>
        {routes.map((r, ri) => {
          const d = pathOf(r.points);
          return (
            <g key={ri}>
              <path className="route-halo" d={d} opacity={r.dim ? 0.2 : 0.8} />
              <path className="route" d={d} style={{ stroke: r.color }} opacity={r.dim ? 0.25 : 1} />
            </g>
          );
        })}
        {pins.map((p, i) => {
          const q = proj(p.lat, p.lon), r = p.label != null ? u * 2.6 : u * 1.6;
          return (
            <g key={i} opacity={p.dim ? 0.3 : 1}>
              <circle className="pin" cx={q[0]} cy={q[1]} r={r} style={{ fill: p.color ?? 'var(--accent)' }} />
              {p.label != null ? <text className="pin-num" x={q[0]} y={q[1] + u * 0.1} fontSize={u * 2.7}>{p.label}</text> : null}
            </g>
          );
        })}
        {start ? (() => {
          const s = proj(start.lat, start.lon);
          return (
            <g>
              <circle className="start" cx={s[0]} cy={s[1]} r={u * 3.2} />
              <g transform={`translate(${s[0] - u * 2.2} ${s[1] - u * 2.2}) scale(${(u * 4.4) / 24})`} fill="none" stroke="var(--on-sun)" strokeWidth={2.4} strokeLinecap="round">
                <path d="M12 6v12M6 12h12" />
              </g>
            </g>
          );
        })() : null}
      </svg>
      {props.onPick && props.pickHint ? <span className="ar-map-hint" role="status">{props.pickHint}</span> : null}
      {props.controls ? (
        <div className="ar-map-ctl">
          <button type="button" aria-label={t('zoomIn')} disabled={zoom >= 4} onClick={() => setZoom((z) => Math.min(4, z * 1.5))}><Icon name="plus" size={16} /></button>
          <button type="button" aria-label={t('zoomOut')} disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z / 1.5))}><Icon name="minus" size={16} /></button>
          {props.onLocate ? <button type="button" aria-label={t('myLoc')} onClick={props.onLocate}><Icon name="locate" size={16} /></button> : null}
        </div>
      ) : null}
      {props.credit !== false ? <span className="ar-map-credit">© OpenStreetMap contributors</span> : null}
    </div>
  );
}
