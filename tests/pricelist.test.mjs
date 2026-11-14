// INGLY OS V2 — test Listini per cliente: prezzo concordato (fisso/sconto) e
// applicazione automatica nel motore quoter. Pattern v96 client_pricelists.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as PL from '../app-v2/src/pricelist.js';
import * as Q from '../app-v2/src/quoter.js';

function makeMock(store) {
  let uid = 0;
  function builder(table) {
    const st = { table, filters: [], op: 'select', payload: null, lim: null };
    const api = { select() { return api; }, is(c, v) { st.filters.push((r) => r[c] === v || (v === null && r[c] == null)); return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, insert(row) { st.op = 'insert'; st.payload = row; return api; }, update(row) { st.op = 'update'; st.payload = row; return api; }, single() { return Promise.resolve(run(st, 'single')); }, then(res, rej) { return Promise.resolve(run(st, 'many')).then(res, rej); } };
    return api;
  }
  function run(st, mode) {
    const arr = store[st.table] || (store[st.table] = []);
    if (st.op === 'insert') { const row = { id: 'id' + (++uid), deleted_at: null, ...st.payload }; arr.push(row); return { data: row, error: null }; }
    if (st.op === 'update') { const rows = arr.filter((r) => st.filters.every((f) => f(r))); rows.forEach((r) => Object.assign(r, st.payload)); return { data: rows[0] || null, error: null }; }
    let rows = arr.filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim);
    if (mode === 'single') return { data: rows[0] || null, error: rows[0] ? null : { message: 'no' } };
    return { data: rows, error: null };
  }
  return { from: (t) => builder(t) };
}

describe('Listino cliente — prezzo concordato', (s) => {
  it(s, 'agreedUnitPrice: prezzo fisso prevale; altrimenti sconto% sul listino', async () => {
    assertEq(PL.agreedUnitPrice({ agreed_price: 25 }, 40), 25);
    assertEq(PL.agreedUnitPrice({ discount_pct: 10 }, 40), 36);
    assertEq(PL.agreedUnitPrice({ agreed_price: 0, discount_pct: 0 }, 40), null);
    assertEq(PL.agreedUnitPrice(null, 40), null);
  });
  it(s, 'setPrice upsert (un record per cliente+prodotto); removePrice esclude', async () => {
    const store = {}; const sb = makeMock(store);
    await PL.setPrice(sb, 't1', 'c1', 'p1', { agreed_price: 20 });
    await PL.setPrice(sb, 't1', 'c1', 'p1', { discount_pct: 15 }); // stesso prodotto → update
    const list = await PL.listForCustomer(sb, 'c1', {});
    assertEq(list.length, 1); assertEq(list[0].discount_pct, 15); assertEq(list[0].agreed_price, null);
    await PL.removePrice(sb, list[0].id);
    assertEq((await PL.listForCustomer(sb, 'c1', {})).length, 0);
  });
  it(s, 'mapForCustomer indicizza per product_id', async () => {
    const store = {}; const sb = makeMock(store);
    await PL.setPrice(sb, 't1', 'c1', 'p1', { agreed_price: 30 });
    const m = await PL.mapForCustomer(sb, 'c1');
    assertEq(m.p1.agreed_price, 30);
  });
});

describe('Listino cliente — applicazione nel motore quoter', (s) => {
  const base = { product_id: 'p1', workings: [{ category: 'material', mq: 1, cost_per_mq: 10 }], markup_pct: 100, vat_rate: 22, quantity: 1 };
  it(s, 'prezzo fisso concordato sostituisce il prezzo da markup', async () => {
    const c = Q.computeLine(base, { customerPrices: { p1: { agreed_price: 15 } } });
    assertEq(c.agreedPrice, 15); assertEq(c.unitPrice, 15); // non 20,90 da markup
  });
  it(s, 'sconto concordato si applica sul listino da markup', async () => {
    const c0 = Q.computeLine(base, {});
    const c = Q.computeLine(base, { customerPrices: { p1: { discount_pct: 10 } } });
    assertEq(c.agreedPrice, Math.round(c0.listPrice * 0.9 * 100) / 100);
  });
  it(s, 'nessun listino → prezzo normale (retro-compatibile)', async () => {
    const c = Q.computeLine(base, {});
    assertEq(c.agreedPrice, null); assertEq(c.unitPrice, Q.roundTo90(20));
  });
});

describe('Listino cliente — migration 0040 (statica)', (s) => {
  it(s, 'tabella + unique cliente+prodotto + RLS + trigger', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000040_client_pricelist.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.client_pricelist\b/.test(sql), 'tabella');
    assert(/unique \(customer_id, product_id\)/.test(sql), 'unique');
    assert(/has_permission\(tenant_id,'sales\.pricelist','read'\)/.test(sql), 'RLS');
    assert(/crm_enforce_delete_perm\('sales\.pricelist'\)/.test(sql), 'trigger');
  });
});
