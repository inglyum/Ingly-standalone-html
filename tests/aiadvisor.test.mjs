// INGLY OS V2 — test AI Business: briefing, coach, decision engine. "AI"
// deterministica (regole + fonte), nessun modello generativo.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as AI from '../app-v2/src/aiadvisor.js';
import { renderBriefing, renderCoach, renderDecisions } from '../app-v2/src/aiadvisor-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

const store = () => ({
  sales_order: [{ id: 'o1', tenant_id: 't1', status: 'CONFIRMED', total: 30, order_date: new Date().toISOString().slice(0, 10), customer_name: 'Rossi', deleted_at: null }],
  sales_order_line: [{ order_id: 'o1', product_id: 'p1', quantity: 1, line_total: 30 }],
  sales_quote: [{ id: 'q1', tenant_id: 't1', status: 'SENT', total: 30, deleted_at: null }],
  sales_invoice: [], catalog_product: [{ id: 'p1', tenant_id: 't1', name: 'Targa', cost: 20, price: 30, deleted_at: null }],
  purchase_order: [], project: [], stock_movement: [],
});

describe('AI Business — deterministico, con fonte', (s) => {
  it(s, 'loadBriefing: score + mosse + alert con fonte', async () => {
    const d = await AI.loadBriefing(makeMock(store()));
    assert(!d.error, 'nessun errore');
    assert(d.score >= 0 && d.score <= 100, 'score in range');
    assert(Array.isArray(d.nextMoves) && Array.isArray(d.alerts), 'liste');
    assert(d.source.includes('deterministico'), 'fonte deterministica');
  });
  it(s, 'loadCoach: consiglio con regola KB per KPI sotto target', async () => {
    const d = await AI.loadCoach(makeMock(store()));
    assert(!d.error, 'nessun errore');
    // avgTicket 30 < 45 → almeno un tip
    assert(d.tips.length >= 1, 'almeno un consiglio');
    assert(d.tips.every((t) => t.advice && t.source), 'ogni tip ha consiglio+fonte');
  });
  it(s, 'loadDecisions: ordinate per impatto', async () => {
    const d = await AI.loadDecisions(makeMock(store()));
    assert(!d.error && Array.isArray(d.items), 'lista decisioni');
    const rank = { high: 3, medium: 2, low: 1 };
    for (let i = 1; i < d.items.length; i++) assert((rank[d.items[i - 1].impact] || 0) >= (rank[d.items[i].impact] || 0), 'ordine per impatto');
  });
  it(s, 'render non crasha e dichiara "deterministico"', async () => {
    const sb = makeMock(store());
    assert(renderBriefing(await AI.loadBriefing(sb)).includes('deterministic'), 'briefing');
    assert(renderCoach(await AI.loadCoach(sb)).length > 20, 'coach');
    assert(renderDecisions(await AI.loadDecisions(sb)).length > 20, 'decision');
  });
});
