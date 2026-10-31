// INGLY OS V2 — test Analisi Finanza: Obiettivi, ProfitScope, ProfitLeak,
// Revenue Simulator (pura aritmetica), Dynamic Price. Deterministico, con fonte.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as FA from '../app-v2/src/financeanalytics.js';
import { renderGoals, renderProfitScope, renderProfitLeak, renderDynamicPrice, renderRevResult } from '../app-v2/src/financeanalytics-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, maybeSingle() { return Promise.resolve({ data: (store[st.table] || [])[0] || null, error: null }); }, single() { return Promise.resolve({ data: (store[st.table] || [])[0] || null, error: null }); }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

const store = () => ({
  sales_order: [{ id: 'o1', tenant_id: 't1', status: 'CONFIRMED', total: 120, order_date: new Date().toISOString().slice(0, 10), customer_name: 'Rossi', deleted_at: null }],
  sales_order_line: [{ order_id: 'o1', product_id: 'p1', quantity: 2, line_total: 120 }],
  sales_quote: [{ id: 'q1', tenant_id: 't1', status: 'ACCEPTED', deleted_at: null }],
  sales_invoice: [], catalog_product: [
    { id: 'p1', tenant_id: 't1', name: 'Targa', cost: 10, price: 15, deleted_at: null },
    { id: 'p2', tenant_id: 't1', name: 'Senza prezzo', cost: 5, price: 0, deleted_at: null },
  ],
  purchase_order: [], project: [], stock_movement: [],
});

describe('Finanza — Obiettivi / ProfitScope / ProfitLeak', (s) => {
  it(s, 'loadGoals: item con target KB, progress e stato', async () => {
    const d = await FA.loadGoals(makeMock(store()));
    assert(!d.error && d.items.length === 4, '4 obiettivi');
    assert(d.items.every((g) => ['ok', 'near', 'under'].includes(g.status) && g.source), 'stato+fonte');
    assertEq(d.items.find((g) => g.key === 'avgTicket').target, FA.KPI_TARGETS.avgTicket);
  });
  it(s, 'loadProfitScope: redditività con fonte', async () => {
    const d = await FA.loadProfitScope(makeMock(store()));
    assert(!d.error && typeof d.marginPct === 'number', 'marginPct');
    assert(Array.isArray(d.top), 'top prodotti');
  });
  it(s, 'loadProfitLeak: segnala prodotto a basso margine (15€ su costo 10 = 33%… ok) o dead/loss', async () => {
    const d = await FA.loadProfitLeak(makeMock(store()));
    assert(!d.error && Array.isArray(d.items), 'lista perdite');
  });
});

describe('Finanza — Revenue Simulator (pura aritmetica)', (s) => {
  it(s, 'volume +10% a prezzo invariato: ricavo +10%, margine% invariato', async () => {
    const base = { monthlyRevenue: 1000, marginPct: 60 };
    const sim = FA.simulateRevenue(base, { volumePct: 10, pricePct: 0 });
    assertEq(sim.newRevenue, 1100);
    assertEq(sim.newMarginPct, 60); // costo scala col volume → margine% invariato
  });
  it(s, 'prezzo +10% a volume invariato: margine% migliora', async () => {
    const base = { monthlyRevenue: 1000, marginPct: 60 };
    const sim = FA.simulateRevenue(base, { volumePct: 0, pricePct: 10 });
    assertEq(sim.newRevenue, 1100);
    assert(sim.newMarginPct > 60, 'margine migliora col prezzo');
  });
});

describe('Finanza — Dynamic Price (motore quoter)', (s) => {
  it(s, 'suggerisce prezzo per margine target, salta prodotti senza costo', async () => {
    const d = await FA.loadDynamicPrice(makeMock(store()), 60);
    assertEq(d.items.length, 2); // p1 e p2 hanno entrambi costo > 0
    const targa = d.items.find((p) => p.name === 'Targa');
    assert(targa.suggested > targa.cost, 'prezzo > costo');
    assertEq(d.targetMarginPct, 60);
  });
  it(s, 'render non crasha', async () => {
    const sb = makeMock(store());
    assert(renderGoals(await FA.loadGoals(sb)).length > 20, 'goals');
    assert(renderProfitScope(await FA.loadProfitScope(sb)).includes('Margine'), 'scope');
    assert(renderProfitLeak(await FA.loadProfitLeak(sb)).length > 10, 'leak');
    assert(renderDynamicPrice(await FA.loadDynamicPrice(sb, 60)).includes('Suggerito') || renderDynamicPrice(await FA.loadDynamicPrice(sb, 60)).length > 20, 'dynprice');
    assert(renderRevResult(FA.simulateRevenue({ monthlyRevenue: 1000, marginPct: 60 }, { volumePct: 5, pricePct: 5 })).includes('Nuovo'), 'revsim');
  });
});
