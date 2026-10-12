// INGLY OS V2 — Analisi (data-layer). Viste BI DETERMINISTICHE, read-only, su
// dati reali: KPI ufficiali KB, forecaster, opportunità, growth engine. Nessuna
// tabella nuova, nessun dato finto, nessuna AI simulata: ogni numero ha una
// fonte. Dove i dati mancano → 0 / lista vuota (dichiarato, non inventato).
import { loadReports } from './reports.js';
import { forecast as intForecast, customerRFM, reorderIntelligence, businessAlerts } from './intelligence.js';
import { friendlyError } from './crm.js';
export { friendlyError };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// Soglie KPI ufficiali (ecommerce-rules.md → KB).
export const KPI_TARGETS = {
  weekRevenue: 375, weekConversion: 40, weekBillableHours: 15,
  monthRevenueMin: 1500, monthRevenueMax: 3000, monthMargin: 60, avgTicket: 45, returnRate: 30,
};

function kpiStatus(value, target) { return Number(value) >= Number(target) ? 'ok' : 'under'; }

// ── 1) KPI — confronto valori reali vs target KB, con stato e fonte.
export async function loadKpi(sb) {
  const rep = await safe(loadReports(sb), null);
  if (!rep) return { error: new Error('report non disponibile'), items: [] };
  const s = rep.sales; const marginPct = rep.projects.revenue > 0 ? r2(rep.projects.margin / rep.projects.revenue * 100) : 0;
  const items = [
    { key: 'avgTicket', label: 'Ticket medio', value: s.avgTicket, unit: '€', target: KPI_TARGETS.avgTicket, status: kpiStatus(s.avgTicket, KPI_TARGETS.avgTicket), source: 'Ordini attivi → ricavo/numero ordini' },
    { key: 'conversion', label: 'Conversione preventivi', value: s.conversion, unit: '%', target: KPI_TARGETS.weekConversion, status: kpiStatus(s.conversion, KPI_TARGETS.weekConversion), source: 'Preventivi ACCEPTED / totale' },
    { key: 'monthMargin', label: 'Margine commesse', value: marginPct, unit: '%', target: KPI_TARGETS.monthMargin, status: kpiStatus(marginPct, KPI_TARGETS.monthMargin), source: 'Commesse → (ricavo−costo)/ricavo' },
    { key: 'revenue', label: 'Ricavo (ordini)', value: s.revenue, unit: '€', target: KPI_TARGETS.monthRevenueMin, status: kpiStatus(s.revenue, KPI_TARGETS.monthRevenueMin), source: 'Ordini attivi → somma totali' },
  ];
  return { items, sales: s, marginPct, targets: KPI_TARGETS, source: 'reports.loadReports (dati reali)', error: null };
}

// ── 2) FORECASTER — proiezione ricavi e incassi da storico reale.
export async function loadForecaster(sb) {
  const f = await safe(intForecast(sb), null);
  if (!f) return { error: new Error('forecast non disponibile'), sufficient: false };
  const vsTargetMin = f.projMonthlyRevenue - KPI_TARGETS.monthRevenueMin;
  return {
    projMonthlyRevenue: f.projMonthlyRevenue, ordersLast90: f.ordersLast90,
    expectedInflow30: f.expectedInflow30, overdueInflow: f.overdueInflow,
    targetMin: KPI_TARGETS.monthRevenueMin, targetMax: KPI_TARGETS.monthRevenueMax,
    gapToMin: r2(vsTargetMin), onTrack: f.projMonthlyRevenue >= KPI_TARGETS.monthRevenueMin,
    sufficient: f.sufficient, reason: f.reason, source: f.source, error: null,
  };
}

// ── 3) OPPORTUNITÀ — azioni concrete a impatto economico, da segnali reali.
export async function loadOpportunities(sb) {
  const [rep, rfm, reord] = await Promise.all([
    safe(loadReports(sb), null), safe(customerRFM(sb), { items: [] }), safe(reorderIntelligence(sb, {}), { items: [] }),
  ]);
  const items = [];
  const sent = rep && rep.sales ? rep.sales.quotes - rep.sales.accepted : 0;
  if (sent > 0) items.push({ title: `${sent} preventivi non convertiti`, impact: 'medium', action: 'Follow-up entro 7 gg (validità preventivo KB)', source: 'Vendite → preventivi non ACCEPTED', link: 'quotes' });
  const champs = (rfm.items || []).filter((r) => r.segment === 'Campione');
  if (champs.length) items.push({ title: `${champs.length} clienti campione`, impact: 'high', action: 'Proposta riordino −10% (sconto riordino KB)', source: 'Customer RFM', link: 'clients' });
  const risk = (rfm.items || []).filter((r) => r.segment === 'A rischio');
  if (risk.length) items.push({ title: `${risk.length} clienti a rischio`, impact: 'high', action: 'Riattivazione: referral 10% (KB)', source: 'Customer RFM → recency alta', link: 'clients' });
  const crit = (reord.items || []).filter((i) => i.urgency === 'critical' || i.urgency === 'high');
  if (crit.length) items.push({ title: `${crit.length} articoli sotto scorta`, impact: 'medium', action: 'Riordino per non perdere vendite', source: 'Reorder Intelligence', link: 'inventory' });
  if (rep && rep.projects.critical.length) items.push({ title: `${rep.projects.critical.length} commesse in perdita`, impact: 'high', action: 'Rivedi prezzo/costi (mai gara al ribasso, KB)', source: 'Commesse → margine < 0', link: 'projects' });
  return { items, source: 'reports + rfm + reorder (dati reali)', error: null };
}

// ── 4) GROWTH ENGINE — sintesi crescita: forecast + opportunità + alert.
export async function loadGrowthEngine(sb) {
  const [fc, opp, alerts] = await Promise.all([
    loadForecaster(sb), loadOpportunities(sb), safe(businessAlerts(sb), { items: [] }),
  ]);
  const score = (() => {
    let s = 50;
    if (fc && fc.onTrack) s += 25; else if (fc && fc.sufficient) s -= 10;
    s += Math.min(20, (opp.items || []).filter((o) => o.impact === 'high').length * 7);
    s -= Math.min(20, (alerts.items || []).filter((a) => a.level === 'danger').length * 7);
    return Math.max(0, Math.min(100, s));
  })();
  return { score, forecaster: fc, opportunities: opp.items || [], alerts: alerts.items || [], source: 'forecaster + opportunità + business alerts', error: null };
}
