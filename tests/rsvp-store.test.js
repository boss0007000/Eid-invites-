const test = require('node:test');
const assert = require('node:assert/strict');
const { formatCsvCell, formatRsvpRow, normalizeRsvp } = require('../rsvpStore');

test('normalizeRsvp accepts a valid RSVP', () => {
  const rsvp = normalizeRsvp({
    name: 'Aqeela Family',
    adults: 2,
    kids: 1,
    notes: 'See you soon',
  });

  assert.equal(rsvp.name, 'Aqeela Family');
  assert.equal(rsvp.adults, 2);
  assert.equal(rsvp.kids, 1);
  assert.equal(rsvp.notes, 'See you soon');
  assert.match(rsvp.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('normalizeRsvp requires at least one guest', () => {
  assert.throws(
    () => normalizeRsvp({ name: 'Guest', adults: 0, kids: 0 }),
    /Please RSVP for at least one guest./,
  );
});

test('formatCsvCell neutralizes spreadsheet formulas and escapes quotes', () => {
  assert.equal(formatCsvCell('=SUM(1,1)'), '"\'=SUM(1,1)"');
  assert.equal(formatCsvCell('Aboo says "welcome"'), '"Aboo says ""welcome"""');
});

test('formatRsvpRow returns a csv row', () => {
  const row = formatRsvpRow({
    timestamp: '2026-01-01T00:00:00.000Z',
    name: 'Aqeela',
    adults: 3,
    kids: 2,
    notes: 'Looking forward to it',
  });

  assert.equal(
    row,
    '"2026-01-01T00:00:00.000Z","Aqeela","3","2","Looking forward to it"',
  );
});
