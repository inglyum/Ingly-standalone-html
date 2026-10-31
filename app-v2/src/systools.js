// INGLY OS V2 — Sistema & Strumenti (data-layer). Viste DETERMINISTICHE su dati
// reali + contenuti di riferimento (brand/legale) come costanti riviste. Nessun
// dato finto, nessuna AI generativa. Report hub, Calendario (agenda da scadenze
// reali), Brand Identity, Legale, Risorse Laser (da attrezzature+materiali).
import { loadReports } from './reports.js';
import { listQuotes } from './quotes.js';
import { listInvoices, balanceDue } from './invoices.js';
import { listEquipment } from './equipment.js';
import { listMaterials } from './materials.js';
import { friendlyError } from './crm.js';
export { friendlyError };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// ── REPORT HUB — sintesi dei report reali + nota export (riusa reports).
export async function loadReportHub(sb) {
  const rep = await safe(loadReports(sb), null);
  if (!rep) return { error: new Error('report non disponibile'), cards: [] };
  const cards = [
    { label: 'Ricavo ordini', value: rep.sales.revenue, unit: '€' },
    { label: 'Preventivi', value: rep.sales.quotes, unit: '' },
    { label: 'Conversione', value: rep.sales.conversion, unit: '%' },
    { label: 'Da incassare', value: rep.finance.daIncassare, unit: '€' },
    { label: 'Valore magazzino', value: rep.warehouse.value, unit: '€' },
    { label: 'Margine commesse', value: rep.projects.margin, unit: '€' },
  ];
  return { cards, alerts: rep.alerts || [], source: 'reports.loadReports (aggregazione reale cross-modulo)', error: null };
}

// ── CALENDARIO — agenda deterministica dalle scadenze reali (preventivi e
// fatture). Niente eventi inventati: solo date presenti nei dati.
export async function loadAgenda(sb) {
  const [quotes, invoices] = await Promise.all([
    safe(listQuotes(sb, { limit: 2000 }), []), safe(listInvoices(sb, { limit: 2000 }), []),
  ]);
  const events = [];
  for (const q of quotes) if (q.valid_until && q.status !== 'ACCEPTED' && q.status !== 'CANCELLED') {
    events.push({ date: q.valid_until, kind: 'Preventivo in scadenza', entity: q.number || q.customer_name || '—', source: 'sales_quote.valid_until' });
  }
  for (const i of invoices) if (i.due_date && i.status !== 'PAID' && i.status !== 'CANCELLED' && balanceDue(i) > 0) {
    events.push({ date: i.due_date, kind: 'Fattura in scadenza', entity: (i.number || '—') + ' · €' + r2(balanceDue(i)), source: 'sales_invoice.due_date' });
  }
  events.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return { events, source: 'scadenze reali di preventivi e fatture', error: null };
}

// ── RISORSE LASER — riferimento da attrezzature (€/min) e materiali reali.
export async function loadLaserResources(sb) {
  const [eq, mats] = await Promise.all([
    safe(listEquipment(sb, {}), []), safe(listMaterials(sb, {}), []),
  ]);
  const machines = eq.map((e) => ({ name: e.name, category: e.category || '—', costPerMin: Number(e.cost_per_min) || (Number(e.hourly_cost) ? r2(e.hourly_cost / 60) : 0) }));
  const materials = mats.map((m) => ({ name: m.name, type: m.material_type || m.category || '—', costPerMq: Number(m.cost_per_mq) || Number(m.cost) || 0 }));
  return { machines, materials, source: 'equipment + materiali (dati reali)', error: null };
}

// ── BRAND IDENTITY — riferimento statico (BRAND_GUIDELINES): costanti riviste.
export const BRAND = {
  name: 'Ingly Design', place: 'San Cipirello (PA) · Valle del Belìce',
  values: ['Moderno', 'Premium', 'Pulito', 'Minimal', 'Caldo'],
  references: ['Linear', 'Apple', 'Notion', 'Framer'],
  techniques: ['Taglio e incisione laser CO2/fibra', 'Stampa UV', 'DTF', 'Stampa 3D'],
  materials: ['Legno/MDF', 'Plexiglass', 'Acciaio', 'Alluminio'],
  voice: 'Professionale ma caldo. Niente emoji a raffica in contesto B2B, niente sconti "urlati" da volantino.',
};
export function loadBrand() { return { brand: BRAND, source: 'BRAND_GUIDELINES.md (riferimento statico)' }; }

// ── LEGALE — modelli di testo standard (IT), costanti riviste, NON consulenza.
export const LEGAL_DOCS = [
  { id: 'privacy', title: 'Nota privacy (sintesi)', body: 'I dati dei clienti sono trattati solo per evadere ordini e preventivi, conservati localmente/sui sistemi aziendali e non ceduti a terzi senza consenso. Titolare: Ingly Design, San Cipirello (PA).' },
  { id: 'terms', title: 'Condizioni di vendita (sintesi)', body: 'Preventivi validi 7 giorni. Acconto 50% su personalizzati oltre €50. I prodotti personalizzati non sono soggetti a reso salvo difetto. Tempi di consegna indicativi e concordati.' },
  { id: 'warranty', title: 'Garanzia', body: 'Garanzia legale di conformità secondo normativa vigente. Difetti di produzione sostituiti/rilavorati senza costi; esclusi danni da uso improprio.' },
];
export function loadLegal() { return { items: LEGAL_DOCS, source: 'Modelli standard IT · costanti riviste (non è consulenza legale)' }; }
