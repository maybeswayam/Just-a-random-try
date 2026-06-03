import { readFile } from 'fs/promises';

function parseCsvLine(line) {
  // Minimal CSV parser supporting quotes.
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function normalizeNumber(input) {
  if (!input) return '';
  // E.164-ish normalization: keep digits only.
  const digits = String(input).replace(/[^\d]/g, '');
  // WhatsApp IDs require country code; we can't infer, so require >= 10 digits.
  return digits;
}

function toBool(val) {
  if (!val) return false;
  return String(val).trim().toLowerCase() !== 'no';
}

export async function loadContacts(csvPath) {
  const raw = await readFile(csvPath, 'utf8');
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name) => header.indexOf(name);

  const required = ['name', 'number', 'business_type'];
  for (const r of required) {
    if (idx(r) === -1) {
      throw new Error(`contacts.csv missing required column: ${r}`);
    }
  }

  const seen = new Set();
  const contacts = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[idx('name')] || '';
    const numberRaw = cols[idx('number')] || '';
    const business_type = (cols[idx('business_type')] || '').trim();
    const notable_info = idx('notable_info') !== -1 ? (cols[idx('notable_info')] || '').trim() : '';
    const has_website = toBool(idx('has_website') !== -1 ? cols[idx('has_website')] : '');
    const running_ads = toBool(idx('running_ads') !== -1 ? cols[idx('running_ads')] : '');

    const number = normalizeNumber(numberRaw);

    if (!name || !number || number.length < 10) continue;

    const key = number;
    if (seen.has(key)) continue;
    seen.add(key);

    contacts.push({
      id: key,
      name,
      number, // digits only
      business_type,
      notable_info,
      has_website,
      running_ads
    });
  }

  return contacts;
}
