// INGLY OS V2 — Strumenti Preventivi (data-layer). Calcolatori DETERMINISTICI
// che riusano il motore quoter: Laser, Stampa 3D, Apparel (DTF/stampa). + Listino
// prezzi dal catalogo, Template documenti (preset), Quote Intelligence (analisi
// preventivi reali). Nessuna tabella nuova, nessun dato finto, ogni output con
// fonte. Formule allineate alla KB (manodopera €18/h, markup, minimi).
import { computeWorking, computeLine, roundTo90, LABOR_RATE } from './quoter.js';
import { listProducts, marginPercent } from './catalog.js';
import { listQuotes } from './quotes.js';
import { friendlyError } from './crm.js';
export { friendlyError, LABOR_RATE };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// Costo→prezzo con il motore quoter (markup % default +100% ×2, come v96).
function priceFromCost(unitCost, markupPct = 100) {
  return computeLine({ workings: [{ category: 'extra', quantity: 1, unit_cost: unitCost }], markup_pct: markupPct, quantity: 1 });
}

// ── 1) LASER — materiale (mq+sfrido) + macchina (min × €/min) + manodopera.
export function calcLaser(inp = {}) {
  const material = computeWorking({ category: 'material', mq: inp.mq, sfrido_pct: inp.sfrido_pct, cost_per_mq: inp.cost_per_mq });
  const machine = computeWorking({ category: 'machine', minutes: inp.laser_min, cost_per_min: inp.cost_per_min });
  const labor = computeWorking({ category: 'labor', minutes: inp.labor_min, rate_per_hour: inp.rate_per_hour || LABOR_RATE });
  const unitCost = r2(material.cost + machine.cost + labor.cost);
  const price = priceFromCost(unitCost, inp.markup_pct);
  return { unitCost, breakdown: [
    { label: 'Materiale (+sfrido)', value: material.cost }, { label: 'Laser (macchina)', value: machine.cost }, { label: 'Manodopera', value: labor.cost },
  ], price: price.unitPrice, markupPct: price.markupPct, source: 'Motore quoter · materiale+laser+manodopera (KB €18/h)' };
}

// ── 2) STAMPA 3D — filamento (g × €/g) + macchina (ore × €/h) + manodopera.
export function calc3D(inp = {}) {
  const grams = Math.max(0, Number(inp.grams) || 0); const costPerKg = Math.max(0, Number(inp.cost_per_kg) || 0);
  const filament = r2(grams / 1000 * costPerKg);
  const machine = computeWorking({ category: 'labor', hours: inp.print_hours, rate_per_hour: inp.machine_rate });
  const labor = computeWorking({ category: 'labor', minutes: inp.labor_min, rate_per_hour: inp.rate_per_hour || LABOR_RATE });
  const unitCost = r2(filament + machine.cost + labor.cost);
  const price = priceFromCost(unitCost, inp.markup_pct);
  return { unitCost, breakdown: [
    { label: `Filamento (${grams}g)`, value: filament }, { label: 'Stampa (macchina/ore)', value: machine.cost }, { label: 'Manodopera (post)', value: labor.cost },
  ], price: price.unitPrice, markupPct: price.markupPct, source: 'Filamento €/kg + ore stampa + manodopera (KB)' };
}

// ── 3) APPAREL — capo + stampa (area o costo fisso) + manodopera.
export function calcApparel(inp = {}) {
  const garment = Math.max(0, Number(inp.garment_cost) || 0);
  const print = computeWorking({ category: 'gadget', quantity: inp.prints || 1, unit_cost: inp.print_cost });
  const labor = computeWorking({ category: 'labor', minutes: inp.labor_min, rate_per_hour: inp.rate_per_hour || LABOR_RATE });
  const unitCost = r2(garment + print.cost + labor.cost);
  const price = priceFromCost(unitCost, inp.markup_pct);
  return { unitCost, breakdown: [
    { label: 'Capo', value: r2(garment) }, { label: 'Stampa (DTF/transfer)', value: print.cost }, { label: 'Manodopera', value: labor.cost },
  ], price: price.unitPrice, markupPct: price.markupPct, source: 'Capo + stampa + manodopera (KB)' };
}

// ── 4) LISTINO — prezzi del catalogo con margine attuale, ordinato per nome.
export async function loadListino(sb) {
  const products = await safe(listProducts(sb, { limit: 2000 }), []);
  const items = products.map((p) => ({
    name: p.name, sku: p.sku || '—', cost: r2(p.cost || 0), price: r2(p.price || 0),
    marginPct: marginPercent(p), source: 'Catalogo (dati reali)',
  })).sort((a, b) => a.name.localeCompare(b.name));
  return { items, source: 'catalog_product', error: null };
}

// ── 5) TEMPLATE DOCUMENTI — preset deterministici (testi standard KB), pronti
// da copiare nel preventivo. Non genera testo da modello: sono costanti riviste.
export const DOC_TEMPLATES = [
  { id: 'std', name: 'Preventivo standard', body: 'Preventivo valido 7 giorni. Acconto 50% su personalizzati oltre €50. Consegna da concordare. Prezzi IVA esclusa salvo diversa indicazione.' },
  { id: 'b2b', name: 'Offerta B2B rivendita', body: 'Condizioni rivendita B2B: sconti quantità 10+ −10%, 25+ −15%, 50+ −20%. Validità 7 giorni. Pagamento come da accordi.' },
  { id: 'express', name: 'Servizio express <48h', body: 'Lavorazione express entro 48h: maggiorazione +25% (opt-in). Soggetta a disponibilità slot produzione.' },
  { id: 'event', name: 'Evento / grandi quantità', body: 'Fornitura per evento: preventivo su misura, acconto 50%, saldo alla consegna. Campione approvato prima della produzione.' },
];
export function loadTemplates() { return { items: DOC_TEMPLATES, source: 'Preset KB (ecommerce-rules) · costanti riviste, nessuna AI' }; }

// ── 6) QUOTE INTELLIGENCE — analisi dei preventivi reali: tasso di conversione,
// valore medio, distribuzione per stato. Spiegabile, con fonte.
export async function loadQuoteIntel(sb) {
  const quotes = await safe(listQuotes(sb, { limit: 3000 }), []);
  const byStatus = {};
  for (const q of quotes) byStatus[q.status] = (byStatus[q.status] || 0) + 1;
  const accepted = byStatus.ACCEPTED || 0; const total = quotes.length;
  const conversion = total ? Math.round(accepted / total * 100) : 0;
  const values = quotes.map((q) => Number(q.total || 0)).filter((v) => v > 0);
  const avgValue = values.length ? r2(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const open = (byStatus.SENT || 0) + (byStatus.DRAFT || 0);
  return {
    total, accepted, conversion, avgValue, open, byStatus,
    hint: conversion < 40 ? 'Conversione sotto il 40% (KB): rinforza qualifica e follow-up a 7 gg.' : 'Conversione in linea con la KB (≥40%).',
    source: 'sales_quote (dati reali)', error: null,
  };
}
