// INGLY OS V2 — test Automazioni deterministiche: valutazione regole + esecuzione
// esplicita (ordine evaso→fattura, preventivo accettato→ordine, scadenza→promemoria).
import { describe, it, assert, assertEq } from './harness.mjs';
import * as AU from '../app-v2/src/automations.js';
import { renderAutomations } from '../app-v2/src/automations-ui.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function makeMock(store) {
  let uid = 0; const counters = {};
  const HDR = { sales_order_line: ['sales_order', 'order_id'], sales_invoice_line: ['sales_invoice', 'invoice_id'] };
  function onInsert(t, row) {
    if (t === 'sales_order') { const k = t + row.tenant_id; counters[k] = (counters[k] || 0) + 1; row.number = 'ORD-' + counters[k]; row.status = row.status || 'CONFIRMED'; }
    if (t === 'sales_invoice') { const k = t + row.tenant_id; counters[k] = (counters[k] || 0) + 1; row.number = 'FAT-' + counters[k]; row.status = row.status || 'ISSUED'; }
    if (t === 'notification') { row.status = row.status || 'queued'; }
    if (t.endsWith('_line')) row.line_total = r2((row.quantity || 1) * (row.unit_price || 0));
  }
  function builder(table) {
    const st = { table, filters: [], op: 'select', payload: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit() { return api; }, insert(row) { st.op = 'insert'; st.payload = row; return api; }, update(row) { st.op = 'update'; st.payload = row; return api; }, single() { return Promise.resolve(run(st, 'single')); }, maybeSingle() { return Promise.resolve(run(st, 'single')); }, then(res, rej) { return Promise.resolve(run(st, 'many')).then(res, rej); } };
    return api;
  }
  function run(st, mode) {
    const arr = store[st.table] || (store[st.table] = []);
    if (st.op === 'insert') { const row = { id: 'id' + (++uid), deleted_at: null, ...st.payload }; onInsert(st.table, row); arr.push(row); return { data: row, error: null }; }
    if (st.op === 'update') { const rows = arr.filter((r) => st.filters.every((f) => f(r))); rows.forEach((r) => Object.assign(r, st.payload)); return { data: rows[0] || null, error: null }; }
    const rows = arr.filter((r) => st.filters.every((f) => f(r)));
    if (mode === 'single') return { data: rows[0] || null, error: rows[0] ? null : { message: 'no' } };
    return { data: rows, error: null };
  }
  return { from: (t) => builder(t) };
}

const soon = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

function baseStore() {
  return {
    sales_order: [
      { id: 'o1', tenant_id: 't1', number: 'ORD-1', status: 'DELIVERED', customer_name: 'Rossi', total: 100, deleted_at: null },
      { id: 'o2', tenant_id: 't1', number: 'ORD-2', status: 'CONFIRMED', total: 50, deleted_at: null },
    ],
    sales_order_line: [{ order_id: 'o1', product_id: 'p1', quantity: 1, unit_price: 100, line_total: 100 }],
    sales_quote: [
      { id: 'q1', tenant_id: 't1', number: 'PREV-1', status: 'ACCEPTED', customer_name: 'Rossi', deleted_at: null },
      { id: 'q2', tenant_id: 't1', number: 'PREV-2', status: 'SENT', valid_until: soon, deleted_at: null },
    ],
    sales_quote_line: [{ quote_id: 'q1', product_id: 'p1', quantity: 1, unit_price: 80 }],
    sales_invoice: [], notification: [],
  };
}

describe('Automazioni — valutazione regole (dai dati reali)', (s) => {
  it(s, 'rileva ordine consegnato senza fattura, accettato senza ordine, scadenza', async () => {
    const d = await AU.evaluateAutomations(makeMock(baseStore()));
    const types = d.actions.map((a) => a.type);
    assert(types.includes('order_to_invoice'), 'R1 ordine→fattura');
    assert(types.includes('quote_to_order'), 'R2 preventivo→ordine');
    assert(types.includes('quote_reminder'), 'R3 promemoria scadenza');
  });
});

describe('Automazioni — esecuzione esplicita', (s) => {
  it(s, 'order_to_invoice crea la fattura e sparisce dai suggerimenti', async () => {
    const store = baseStore(); const sb = makeMock(store);
    const d = await AU.evaluateAutomations(sb);
    const act = d.actions.find((a) => a.type === 'order_to_invoice');
    const r = await AU.runAutomation(sb, 't1', act);
    assert(r.ok && /Fattura creata/.test(r.message), 'fattura creata');
    assertEq(store.sales_invoice.length, 1);
    const d2 = await AU.evaluateAutomations(sb);
    assert(!d2.actions.some((a) => a.type === 'order_to_invoice'), 'non più suggerita');
  });
  it(s, 'quote_reminder accoda una notifica in_app (nessun invio esterno)', async () => {
    const store = baseStore(); const sb = makeMock(store);
    const d = await AU.evaluateAutomations(sb);
    const act = d.actions.find((a) => a.type === 'quote_reminder');
    const r = await AU.runAutomation(sb, 't1', act);
    assert(r.ok, 'ok');
    assertEq(store.notification.length, 1);
    assertEq(store.notification[0].channel, 'in_app');
    assertEq(store.notification[0].status, 'queued'); // accodata, non "inviata"
  });
  it(s, 'render elenca azioni con pulsante', async () => {
    const d = await AU.evaluateAutomations(makeMock(baseStore()));
    const html = renderAutomations(d);
    assert(/data-auto="0"/.test(html) && /Automazioni applicabili/.test(html), 'render');
    assert(/nessuna azione automatica/i.test(html), 'dichiara esecuzione solo su click');
  });
});
