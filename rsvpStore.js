const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_DIRECTORY = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIRECTORY, 'rsvps.csv');
const FORMULA_PREFIX = /^[\s]*[=+\-@]/;

function formatCsvCell(value) {
  const normalized = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  const safeValue = FORMULA_PREFIX.test(normalized) ? `'${normalized}` : normalized;

  return `"${safeValue.replace(/"/g, '""')}"`;
}

function normalizeRsvp(payload) {
  const name = String(payload?.name ?? '').trim();
  const adults = Number(payload?.adults);
  const kids = Number(payload?.kids);
  const notes = String(payload?.notes ?? '').trim();

  if (!name) {
    throw new Error('Please enter your name.');
  }

  if (!Number.isInteger(adults) || adults < 0) {
    throw new Error('Adults must be a whole number.');
  }

  if (!Number.isInteger(kids) || kids < 0) {
    throw new Error('Kids must be a whole number.');
  }

  if (adults + kids < 1) {
    throw new Error('Please RSVP for at least one guest.');
  }

  return {
    timestamp: new Date().toISOString(),
    name: name.slice(0, 80),
    adults,
    kids,
    notes: notes.slice(0, 250),
  };
}

function formatRsvpRow(rsvp) {
  return [rsvp.timestamp, rsvp.name, rsvp.adults, rsvp.kids, rsvp.notes]
    .map(formatCsvCell)
    .join(',');
}

async function appendRsvp(rsvp) {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, 'timestamp,name,adults,kids,notes\n', 'utf8');
  }

  await fs.appendFile(DATA_FILE, `${formatRsvpRow(rsvp)}\n`, 'utf8');
}

module.exports = {
  appendRsvp,
  formatCsvCell,
  formatRsvpRow,
  normalizeRsvp,
  DATA_FILE,
};
