// INGLY OS V2 — Strumenti extra (data-layer). SOLO logica DETERMINISTICA:
// Tax Calendar (scadenze fiscali IT ricorrenti, date note), Fiscal (sintesi da
// finanza + aliquota), Laser B2B (calcolo col markup B2B KB). Nessun servizio
// esterno, nessun dato finto. Dove servirebbe lo SdI reale si dichiara il limite.
import { loadFinance } from './finance.js';
import { getSettings } from './settings.js';
import { calcLaser } from './quotetools.js';
import { friendlyError } from './crm.js';
export { friendlyError, calcLaser };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };
const pad = (n) => String(n).padStart(2, '0');

// ── TAX CALENDAR — scadenze fiscali italiane ricorrenti (date note, non stimate).
// Ogni voce: giorno del mese + mesi in cui ricorre. La prossima occorrenza è
// calcolata da oggi. Riferimento generale (non sostituisce il commercialista).
const DEADLINES = [
  { label: 'Liquidazione IVA mensile / F24', day: 16, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: 'Versamento IVA e ritenute mese precedente' },
  { label: 'IVA trimestrale (I trim.)', day: 16, months: [5], note: 'Versamento IVA I trimestre' },
  { label: 'IVA trimestrale (II trim.)', day: 20, months: [8], note: 'Versamento IVA II trimestre' },
  { label: 'IVA trimestrale (III trim.)', day: 16, months: [11], note: 'Versamento IVA III trimestre' },
  { label: 'IVA trimestrale (IV trim.)', day: 16, months: [3], note: 'Versamento IVA IV trimestre (anno prec.)' },
  { label: 'Dichiarazione IVA annuale', day: 30, months: [4], note: 'Invio dichiarazione IVA' },
  { label: 'Acconto IVA', day: 27, months: [12], note: 'Versamento acconto IVA' },
  { label: 'Modello Redditi / IRPEF saldo+acconto', day: 30, months: [6], note: 'Saldo e primo acconto imposte' },
  { label: 'Secondo acconto imposte', day: 30, months: [11], note: 'Secondo acconto IRPEF/IRES' },
  { label: 'Certificazione Unica (CU)', day: 16, months: [3], note: 'Invio CU' },
];

function nextOccurrence(day, months, from) {
  const base = from || new Date();
  for (let add = 0; add < 13; add++) {
    const d = new Date(base.getFullYear(), base.getMonth() + add, day);
    const m = d.getMonth() + 1;
    if (!months.includes(m)) continue;
    if (d >= new Date(base.getFullYear(), base.getMonth(), base.getDate())) return d;
  }
  return null;
}

export function loadTaxCalendar(from) {
  const base = from || new Date();
  const items = DEADLINES.map((d) => {
    const next = nextOccurrence(d.day, d.months, base);
    return next ? { label: d.label, note: d.note, date: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`, daysTo: Math.round((next - base) / 86400000) } : null;
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
  return { items, source: 'Scadenzario fiscale IT ricorrente (date note) · riferimento, non sostituisce il commercialista' };
}

// ── FISCAL — sintesi fiscale deterministica da finanza + aliquota impostata.
export async function loadFiscal(sb, tenantId) {
  const [fin, settings] = await Promise.all([
    safe(loadFinance(sb, {}), { incassato: 0, daIncassare: 0, scaduto: 0 }),
    safe(getSettings(sb, tenantId), {}),
  ]);
  const aliquota = Number(settings.vat_rate != null ? settings.vat_rate : 22);
  const imponibileIncassato = r2(fin.incassato / (1 + aliquota / 100));
  const ivaIncassata = r2(fin.incassato - imponibileIncassato);
  return {
    aliquota, incassato: fin.incassato, imponibileIncassato, ivaIncassata,
    daIncassare: fin.daIncassare, scaduto: fin.scaduto,
    note: 'Stima IVA sull\'incassato all\'aliquota configurata. Lo scorporo esatto dipende dalle aliquote per riga; per gli adempimenti reali (invio SdI, F24) serve integrazione dedicata.',
    source: 'finance.loadFinance + impostazioni (aliquota)', error: null,
  };
}

// ── LASER B2B — stesso calcolatore laser, markup B2B KB (×2.5 = +150%).
export function calcLaserB2B(inp = {}) {
  return calcLaser({ ...inp, markup_pct: inp.markup_pct != null ? inp.markup_pct : 150 });
}
