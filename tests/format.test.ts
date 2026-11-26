import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dur, fmt, fmtDate, hhmm, parseEmails } from '../src/domain/format.ts';
import { EN, TH } from '../src/i18n/strings.ts';

test('number and time formats', () => {
  assert.equal(fmt(6395.4), '6,395');
  assert.equal(hhmm(540), '09:00');
  assert.equal(dur(135, 'th'), '2 ชม. 15 นาที');
  assert.equal(dur(60, 'en'), '1 h');
});

test('Thai dates use the Buddhist year', () => {
  assert.match(fmtDate('2026-11-23T05:00:00Z', 'th'), /2569/);
  assert.match(fmtDate('2026-11-23T05:00:00Z', 'en'), /2026/);
});

test('email parsing splits on commas and flags bad addresses', () => {
  const r = parseEmails('a@gmail.com, b@x.co ; nope, a@gmail.com');
  assert.deepEqual(r.valid, ['a@gmail.com', 'b@x.co']);
  assert.deepEqual(r.invalid, ['nope']);
});

test('every Thai string has an English translation', () => {
  for (const k of Object.keys(TH)) assert.ok((EN as Record<string, string>)[k], k);
});
