import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_DRAFT, reachedStep, tripReducer } from '../src/domain/draft.ts';
import { START_POINTS } from '../src/data/places.ts';
import type { SavedTrip } from '../src/domain/types.ts';

test('choosing a profile clamps days to its range and clears the old plan', () => {
  let s = tripReducer({ ...EMPTY_DRAFT, days: 7, plan: [['P001']] }, { type: 'profile', id: 'nature' });
  assert.equal(s.days, 2);
  assert.deepEqual(s.plan, []);
  s = tripReducer({ ...s, days: 1 }, { type: 'profile', id: 'long_trip' });
  assert.equal(s.days, 5);
});

test('editing a saved trip marks it dirty; saving clears it', () => {
  let s = tripReducer(EMPTY_DRAFT, { type: 'saved', id: 'T1' });
  s = tripReducer(s, { type: 'plan', plan: [['P001']] });
  assert.equal(s.dirty, true);
  s = tripReducer(s, { type: 'saved', id: 'T1' });
  assert.equal(s.dirty, false);
  s = tripReducer(s, { type: 'unlink' });
  assert.equal(s.savedId, null);
});

test('loading a saved trip restores its draft', () => {
  const trip: SavedTrip = {
    id: 'T9', ownerId: 'u', km: 1, total: 1, stops: 1, savedAt: '2026-11-20T00:00:00Z',
    draft: { profileId: 'culture', start: START_POINTS[0], radiusKm: 10, days: 1, people: 4, budgetPerDay: 3000, plan: [['P001']] },
  };
  const s = tripReducer(EMPTY_DRAFT, { type: 'load', trip });
  assert.equal(s.savedId, 'T9');
  assert.equal(s.people, 4);
  assert.equal(reachedStep(s), 2);
});

test('reached step follows the flow', () => {
  assert.equal(reachedStep(EMPTY_DRAFT), 0);
  assert.equal(reachedStep({ ...EMPTY_DRAFT, profileId: 'cafe' }), 1);
  assert.equal(reachedStep({ ...EMPTY_DRAFT, profileId: 'cafe', start: START_POINTS[0], plan: [[]] }), 1);
});
