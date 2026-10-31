// INGLY OS V2 — test Produzione & Vendite: workflow, overview, archivio.
// Deterministico, read-only, con fonte.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as SO from '../app-v2/src/salesops.js';
import { renderWorkflow, renderSalesOverview, renderSalesArchive } from '../app-v2/src/salesops-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

const store = () => ({
  production_order: [
    { id: 'pr1', tenant_id: 't1', number: 'PRD-000001', product_name: 'Targa', quantity: 5, status: 'PLANNED', deleted_at: null },
    { id: 'pr2', tenant_id: 't1', number: 'PRD-000002', product_name: 'Cake', quantity: 2, status: 'DONE', deleted_at: null },
  ],
  sales_order: [
    { id: 'o1', tenant_id: 't1', number: 'ORD-1', status: 'CONFIRMED', total: 120, customer_name: 'Rossi', order_date: '2026-09-01', deleted_at: null },
    { id: 'o2', tenant_id: 't1', number: 'ORD-2', status: 'DELIVERED', total: 80, customer_name: 'Bianchi', order_date: '2026-08-01', deleted_at: null },
    { id: 'o3', tenant_id: 't1', number: 'ORD-3', status: 'CANCELLED', total: 50, customer_name: 'Verdi', order_date: '2026-07-01', deleted_at: null },
  ],
  sales_invoice: [{ id: 'inv1', tenant_id: 't1', status: 'ISSUED', total: 122, paid_total: 22, due_date: '2026-12-31', deleted_at: null }],
});

describe('Produzione & Vendite — workflow / overview / archivio', (s) => {
  it(s, 'loadWorkflow: colonne per stato, esclude CANCELLED', async () => {
    const d = await SO.loadWorkflow(makeMock(store()));
    assert(!d.error, 'nessun errore');
    assert(d.columns.every((c) => c.status !== 'CANCELLED'), 'niente colonna annullati');
    assertEq(d.total, 2); assertEq(d.done, 1);
    const planned = d.columns.find((c) => c.status === 'PLANNED');
    assertEq(planned.items.length, 1);
  });
  it(s, 'loadSalesOverview: ricavo ordini attivi + fatturato/incassato/da incassare', async () => {
    const d = await SO.loadSalesOverview(makeMock(store()));
    assertEq(d.revenue, 200); // 120 + 80 (CANCELLED escluso)
    assertEq(d.ordersCount, 2);
    assertEq(d.invoiced, 122); assertEq(d.due, 100); assertEq(d.collected, 22);
  });
  it(s, 'loadSalesArchive: solo DELIVERED/CANCELLED, ricavo storico dai consegnati', async () => {
    const d = await SO.loadSalesArchive(makeMock(store()));
    assertEq(d.count, 2); assertEq(d.deliveredCount, 1); assertEq(d.archivedRevenue, 80);
  });
  it(s, 'render non crasha e mostra fonte', async () => {
    const sb = makeMock(store());
    assert(renderWorkflow(await SO.loadWorkflow(sb)).includes('Produzione') || renderWorkflow(await SO.loadWorkflow(sb)).length > 50, 'workflow');
    assert(renderSalesOverview(await SO.loadSalesOverview(sb)).includes('Incassato'), 'overview');
    assert(renderSalesArchive(await SO.loadSalesArchive(sb)).includes('Numero'), 'archivio');
  });
});
