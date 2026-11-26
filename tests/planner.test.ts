import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/domain/config.ts';
import { addStop, candidates, evalDay, evalTrip, moveStop, planTrip, removeStop } from '../src/domain/planner.ts';
import { roadKm } from '../src/domain/geo.ts';
import { POI, START_POINTS } from '../src/data/places.ts';
import { PROFILES } from '../src/data/profiles.ts';

const kata = START_POINTS[2];

test('cost model: 10 ฿/km + entry × people + flat guide fee per trip', () => {
  const plan = planTrip({ profile: 'nature', start: kata, days: 2, radiusKm: 15 });
  const people = 3;
  const r = evalTrip(kata, plan, people);
  const km = plan.reduce((sum, ids) => {
    let cur = kata as { lat: number; lon: number }, s = 0;
    for (const id of ids) { s += roadKm(cur, POI[id]); cur = POI[id]; }
    return sum + s;
  }, 0);
  const entry = plan.flat().reduce((a, id) => a + POI[id].cost * people, 0);
  assert.ok(Math.abs(r.km - km) < 1e-9);
  assert.ok(Math.abs(r.cost.travel - km * CONFIG.bahtPerKm) < 1e-9);
  assert.equal(r.cost.entry, entry);
  assert.equal(r.cost.guide, CONFIG.guideFlat);
  assert.ok(Math.abs(r.total - (km * 10 + entry + 500)) < 1e-9);
});

test('guide fee is charged once per trip, not per day', () => {
  const plan = planTrip({ profile: 'long_trip', start: kata, days: 5, radiusKm: 25 });
  assert.equal(evalTrip(kata, plan, 2).cost.guide, 500);
});

test('empty plan costs nothing', () => {
  const r = evalTrip(kata, [[], []], 2);
  assert.equal(r.total, 0);
  assert.equal(r.stops, 0);
});

test('every planned day fits in 8 hours and uses only matching places in range', () => {
  for (const p of PROFILES) {
    const plan = planTrip({ profile: p.id, start: kata, days: p.days[0], radiusKm: 15 });
    assert.equal(plan.length, p.days[0]);
    const ids = plan.flat();
    assert.equal(new Set(ids).size, ids.length, 'no duplicate stops');
    const allowed = new Set(candidates(p.id, kata, 15).map((c) => c.id));
    ids.forEach((id) => assert.ok(allowed.has(id), `${id} in range for ${p.id}`));
    plan.forEach((day) => assert.ok(evalDay(kata, day).minutes <= CONFIG.dayMinutes));
  }
});

test('timeline starts at 09:00 and arrival times increase', () => {
  const [day] = planTrip({ profile: 'culture', start: START_POINTS[0], days: 1, radiusKm: 15 });
  const d = evalDay(START_POINTS[0], day, 1);
  assert.ok(d.rows[0].arrive > CONFIG.dayStart);
  for (let i = 1; i < d.rows.length; i++) assert.ok(d.rows[i].arrive > d.rows[i - 1].arrive);
});

test('plan edits: remove, move, add (no duplicates)', () => {
  const plan = [['P001', 'P002', 'P003'], ['P004']];
  assert.deepEqual(removeStop(plan, 0, 1), [['P001', 'P003'], ['P004']]);
  assert.deepEqual(moveStop(plan, 0, 0, 1), [['P002', 'P001', 'P003'], ['P004']]);
  assert.deepEqual(moveStop(plan, 0, 0, -1), plan, 'cannot move above the first stop');
  assert.deepEqual(addStop(plan, 1, 'P005'), [['P001', 'P002', 'P003'], ['P004', 'P005']]);
  assert.deepEqual(addStop(plan, 1, 'P001'), plan, 'a place already in the trip is not added twice');
});

test('unknown place ids are skipped (place removed from the database)', () => {
  const d = evalDay(kata, ['P001', 'NOPE'], 1);
  assert.equal(d.rows.length, 1);
});
