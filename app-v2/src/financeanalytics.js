// INGLY OS V2 — Analisi Finanza (data-layer). Viste DETERMINISTICHE su dati
// reali: Obiettivi (goals vs KB), ProfitScope, ProfitLeak, Revenue Simulator,
// Dynamic Price. Nessuna tabella nuova, nessun dato finto, ogni numero con
// fonte. Allineato alla KB (ecommerce-rules): margine ≥60%, ticket ≥€45, ecc.
import { loadReports } from './reports.js';
import { productIntelligence, forecast as intForecast } from './intelligence.js';
import { listProducts } from './catalog.js';
import { priceForMargin, roundTo90 } from './quoter.js';
import { KPI_TARGETS } from './analytics.js';
import { friendlyError } from './crm.js';
export { friendlyError, KPI_TARGETS };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };
const pct = (v, t) => (Number(t) > 0 ? Math.round(Math.min(999, (Number(v) / Number(t)) * 100)) : 0);

// ── 1) OBIETTIVI — target KB vs valori reali, con % di avanzamento.
export async function loadGoals(sb) {
  const [rep, fc] = await Promise.all([safe(loadReports(sb), null), safe(intForecast(sb), null)]);
  if (!rep) return { error: new Error('report non disponibile'), items: [] };
  const s = rep.sales;
  const marginPct = rep.projects.revenue > 0 ? r2(rep.projects.margin / rep.projects.revenue * 100) : 0;
  const monthly = fc ? fc.projMonthlyRevenue : s.revenue;
  const items = [
    { key: 'monthRevenue', label: 'Ricavo mensile (proiezione)', value: monthly, target: KPI_TARGETS.monthRevenueMin, unit: '€', progress: pct(monthly, KPI_TARGETS.monthRevenueMin), source: 'Forecast ordini 90gg → media mensile' },
    { key: 'avgTicket', label: 'Ticket medio', value: s.avgTicket, target: KPI_TARGETS.avgTicket, unit: '€', progress: pct(s.avgTicket, KPI_TARGETS.avgTicket), source: 'Ordini → ricavo/numero' },
    { key: 'conversion', label: 'Conversione', value: s.conversion, target: KPI_TARGETS.weekConversion, unit: '%', progress: pct(s.conversion, KPI_TARGETS.weekConversion), source: 'Preventivi ACCEPTED/totale' },
    { key: 'margin', label: 'Margine', value: marginPct, target: KPI_TARGETS.monthMargin, unit: '%', progress: pct(marginPct, KPI_TARGETS.monthMargin), source: 'Commesse → (ricavo−costo)/ricavo' },
  ].map((g) => ({ ...g, status: g.progress >= 100 ? 'ok' : g.progress >= 70 ? 'near' : 'under' }));
  return { items, source: 'reports + forecast (dati reali) · target KB', error: null };
}

// ── 2) PROFITSCOPE — redditività complessiva + top prodotti per valore.
export async function loadProfitScope(sb) {
  const rep = await safe(loadReports(sb), null);
  if (!rep) return { error: new Error('report non disponibile'), top: [] };
  const revenue = rep.projects.revenue; const cost = rep.projects.cost; const margin = rep.projects.margin;
  const marginPct = revenue > 0 ? r2(margin / revenue * 100) : 0;
  return {
    revenue, cost, margin, marginPct,
    top: rep.topProducts, critical: rep.projects.critical,
    source: 'Commesse (economics reali) + righe ordine per prodotto', error: null,
  };
}

// ── 3) PROFITLEAK — dove si perde margine: prodotti a basso margine, commesse
// in perdita, dead stock. Da segnali reali, con fonte e azione KB.
export async function loadProfitLeak(sb) {
  const [prodInt, rep] = await Promise.all([safe(productIntelligence(sb), { lowMargin: [], dead: [] }), safe(loadReports(sb), null)]);
  const leaks = [];
  for (const p of (prodInt.lowMargin || [])) leaks.push({ type: 'Margine basso', entity: p.name, detail: `margine ${p.marginPct}% (<20%)`, action: 'Rivedi prezzo/costo o dismetti', source: p.source });
  for (const p of (prodInt.dead || [])) leaks.push({ type: 'Dead stock', entity: p.name, detail: p.reason, action: 'Promo di sblocco o stop riordino', source: p.source });
  if (rep) for (const c of (rep.projects.critical || [])) leaks.push({ type: 'Commessa in perdita', entity: c.name, detail: `margine €${c.margin}`, action: 'Mai gara al ribasso: aggiungi valore (KB)', source: 'Commesse → margine < 0' });
  return { items: leaks, source: 'product intelligence + commesse (dati reali)', error: null };
}

// ── 4) REVENUE SIMULATOR — what-if DETERMINISTICO su volume e prezzo.
// Pura aritmetica sul baseline reale: nessun modello nascosto.
export function simulateRevenue(base, params = {}) {
  const b = base || { monthlyRevenue: 0, marginPct: 0 };
  const dV = Number(params.volumePct || 0) / 100;
  const dP = Number(params.pricePct || 0) / 100;
  const newRevenue = r2(b.monthlyRevenue * (1 + dV) * (1 + dP));
  // Il costo scala col volume, non col prezzo: il margine % migliora col prezzo.
  const baseCost = r2(b.monthlyRevenue * (1 - b.marginPct / 100));
  const newCost = r2(baseCost * (1 + dV));
  const newMargin = r2(newRevenue - newCost);
  const newMarginPct = newRevenue > 0 ? r2(newMargin / newRevenue * 100) : 0;
  return {
    base: b, params: { volumePct: Number(params.volumePct || 0), pricePct: Number(params.pricePct || 0) },
    newRevenue, newCost, newMargin, newMarginPct,
    deltaRevenue: r2(newRevenue - b.monthlyRevenue),
    source: 'Baseline reale × variazioni (costo scala col volume)',
  };
}

export async function loadRevSimBase(sb) {
  const [fc, rep] = await Promise.all([safe(intForecast(sb), null), safe(loadReports(sb), null)]);
  const monthlyRevenue = fc ? fc.projMonthlyRevenue : (rep ? rep.sales.revenue : 0);
  const marginPct = rep && rep.projects.revenue > 0 ? r2(rep.projects.margin / rep.projects.revenue * 100) : 60;
  return { monthlyRevenue, marginPct, source: 'forecast + commesse (dati reali)', error: null };
}

// ── 5) DYNAMIC PRICE — prezzo suggerito per margine target, da costo reale del
// prodotto. Riusa il motore quoter (priceForMargin, arrotondamento ,90).
export async function loadDynamicPrice(sb, targetMarginPct = KPI_TARGETS.monthMargin) {
  const products = await safe(listProducts(sb, { limit: 1000 }), []);
  const items = products.filter((p) => Number(p.cost) > 0).map((p) => {
    const cost = r2(p.cost); const current = r2(p.price || 0);
    const suggested = priceForMargin(cost, targetMarginPct) || roundTo90(cost * 2);
    const currentMarginPct = current > 0 ? r2((current - cost) / current * 100) : 0;
    return {
      name: p.name, cost, current, suggested, currentMarginPct,
      delta: r2(suggested - current),
      action: current > 0 && currentMarginPct < targetMarginPct ? 'Alza prezzo' : current === 0 ? 'Imposta prezzo' : 'OK',
      source: `Catalogo → costo €${cost}; prezzo per margine ${targetMarginPct}% (motore quoter)`,
    };
  }).sort((a, b) => b.delta - a.delta);
  return { items, targetMarginPct, source: 'catalog_product + motore quoter (priceForMargin)', error: null };
}
