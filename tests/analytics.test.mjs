// INGLY OS V2 — test Analisi (KPI/Forecaster/Opportunità/Growth): deterministico,
// read-only, con fonte. Usa un mock Supabase minimale con dati reali.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as AN from '../app-v2/src/analytics.js';
import { renderKpi, renderForecaster, renderOpportunities, renderGrowth } from '../app-v2/src/analytics-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, gte() { return api; }, lte() { return api; }, limit(n) { st.lim = n; return api; }, single() { return Promise.resolve({ data: (store[st.table] || [])[0] || null, error: null }); }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

const baseStore = () => ({
  customers: [{ id: 'c1', tenant_id: 't1', name: 'Rossi', deleted_at: null }],
  sales_quote: [
    { id: 'q1', tenant_id: 't1', status: 'ACCEPTED', total: 100, deleted_at: null },
    { id: 'q2', tenant_id: 't1', status: 'SENT', total: 80, deleted_at: null },
  ],
  sales_order: [{ id: 'o1', tenant_id: 't1', status: 'CONFIRMED', total: 120, order_date: new Date().toISOString().slice(0, 10), deleted_at: null }],
  sales_order_line: [{ order_id: 'o1', product_id: 'p1', quantity: 2, line_total: 120 }],
  sales_invoice: [], catalog_product: [{ id: 'p1', tenant_id: 't1', name: 'Targa', deleted_at: null }],
  purchase_order: [], project: [], stock_movement: [],
});

describe('Analisi — KPI (reali vs target KB)', (s) => {
  it(s, 'loadKpi produce item con stato ok/under e fonte', async () => {
    const d = await AN.loadKpi(makeMock(baseStore()));
    assert(!d.error, 'nessun errore');
    assert(d.items.length >= 3, 'almeno 3 kpi');
    assert(d.items.every((k) => ['ok', 'under'].includes(k.status)), 'stati validi');
    assert(d.items.every((k) => k.source), 'ogni kpi ha fonte');
    const conv = d.items.find((k) => k.key === 'conversion');
    assertEq(conv.value, 50); // 1 ACCEPTED / 2 quotes = 50%
  });
  it(s, 'target KB corretti', async () => {
    assertEq(AN.KPI_TARGETS.avgTicket, 45);
    assertEq(AN.KPI_TARGETS.monthMargin, 60);
    assertEq(AN.KPI_TARGETS.monthRevenueMin, 1500);
  });
});

describe('Analisi — Forecaster / Opportunità / Growth', (s) => {
  it(s, 'loadForecaster proietta dal recente e confronta col target', async () => {
    const d = await AN.loadForecaster(makeMock(baseStore()));
    assert(!d.error, 'nessun errore');
    assert(typeof d.projMonthlyRevenue === 'number', 'proiezione numerica');
    assertEq(d.targetMin, 1500);
    assert(d.source && d.reason, 'fonte+motivo');
  });
  it(s, 'loadOpportunities suggerisce azioni con fonte (preventivo SENT non convertito)', async () => {
    const d = await AN.loadOpportunities(makeMock(baseStore()));
    assert(!d.error, 'nessun errore');
    assert(d.items.some((o) => /non convertit/i.test(o.title)), 'opportunità follow-up');
    assert(d.items.every((o) => o.source && o.action), 'ogni opp ha fonte+azione');
  });
  it(s, 'loadGrowthEngine produce score 0..100 deterministico', async () => {
    const d = await AN.loadGrowthEngine(makeMock(baseStore()));
    assert(!d.error, 'nessun errore');
    assert(d.score >= 0 && d.score <= 100, 'score in range');
    assert(Array.isArray(d.opportunities) && Array.isArray(d.alerts), 'liste presenti');
  });
});

describe('Analisi — render (no crash, con fonte)', (s) => {
  it(s, 'renderKpi/Forecaster/Opportunities/Growth producono HTML', async () => {
    const sb = makeMock(baseStore());
    assert(renderKpi(await AN.loadKpi(sb)).includes('Target'), 'kpi');
    assert(renderForecaster(await AN.loadForecaster(sb)).length > 50, 'forecaster');
    assert(renderOpportunities(await AN.loadOpportunities(sb)).length > 20, 'opportunità');
    assert(renderGrowth(await AN.loadGrowthEngine(sb)).includes('Growth Score'), 'growth');
  });
});
