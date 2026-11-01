// INGLY OS V2 — test Relazioni cross-modulo (smart buttons Odoo-like):
// aggregazione deterministica dei record collegati a cliente/prodotto.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as REL from '../app-v2/src/relations.js';
import { renderSmartButtons } from '../app-v2/src/relations-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [] };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit() { return api; }, then(res, rej) { const rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

describe('Relazioni — cliente', (s) => {
  const store = () => ({
    sales_order: [
      { id: 'o1', tenant_id: 't1', customer_id: 'c1', customer_name: 'Rossi', status: 'CONFIRMED', total: 100, deleted_at: null },
      { id: 'o2', tenant_id: 't1', customer_name: 'Rossi', status: 'CANCELLED', total: 50, deleted_at: null },
      { id: 'o3', tenant_id: 't1', customer_name: 'Bianchi', status: 'CONFIRMED', total: 70, deleted_at: null },
    ],
    sales_quote: [{ id: 'q1', tenant_id: 't1', customer_name: 'Rossi', status: 'SENT', total: 80, deleted_at: null }],
    sales_invoice: [{ id: 'i1', tenant_id: 't1', customer_id: 'c1', status: 'ISSUED', total: 122, deleted_at: null }],
    project: [{ id: 'pr1', tenant_id: 't1', customer_id: 'c1', name: 'Commessa', deleted_at: null }],
  });
  it(s, 'aggrega per id o nome, esclude CANCELLED, calcola valore', async () => {
    const d = await REL.customerRelations(makeMock(store()), { id: 'c1', name: 'Rossi' });
    const orders = d.cards.find((c) => c.key === 'orders');
    assertEq(orders.count, 1); // o1 (o2 CANCELLED escluso, o3 altro cliente)
    assertEq(orders.value, 100);
    assertEq(d.cards.find((c) => c.key === 'quotes').count, 1);
    assertEq(d.cards.find((c) => c.key === 'invoices').count, 1);
    assertEq(d.cards.find((c) => c.key === 'projects').count, 1);
  });
  it(s, 'ogni card ha una route di navigazione', async () => {
    const d = await REL.customerRelations(makeMock(store()), { id: 'c1', name: 'Rossi' });
    assert(d.cards.every((c) => c.route), 'route presenti');
    assert(renderSmartButtons(d).includes('data-rel-go'), 'smart button cliccabile');
  });
});

describe('Relazioni — prodotto', (s) => {
  it(s, 'conta righe ordine/preventivo e movimenti del prodotto', async () => {
    const store = {
      sales_order_line: [{ product_id: 'p1', quantity: 2, line_total: 60 }, { product_id: 'p2', quantity: 1, line_total: 10 }],
      sales_quote_line: [{ product_id: 'p1', quantity: 1 }],
      stock_movement: [{ product_id: 'p1', type: 'IN', quantity: 5, deleted_at: null }],
    };
    const d = await REL.productRelations(makeMock(store), { id: 'p1' });
    const sold = d.cards.find((c) => c.key === 'sold');
    assertEq(sold.count, 1); assertEq(sold.value, 60);
    assertEq(d.cards.find((c) => c.key === 'quoted').count, 1);
    assertEq(d.cards.find((c) => c.key === 'moves').count, 1);
  });
});
