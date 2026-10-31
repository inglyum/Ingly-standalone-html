// INGLY OS V2 — test Booking: CRUD prenotazioni + migrazione statica.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as BK from '../app-v2/src/booking.js';
import { renderRows, renderForm } from '../app-v2/src/booking-ui.js';

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

describe('Booking — CRUD', (s) => {
  it(s, 'createBooking: serve cliente o servizio; stato default requested', async () => {
    const sb = makeMock({});
    const b = await BK.createBooking(sb, 't1', { customer_name: 'Rossi', service: 'sopralluogo', slot_date: '2026-11-10', slot_time: '15:30' });
    assertEq(b.status, 'requested');
    let threw = false; try { await BK.createBooking(sb, 't1', {}); } catch { threw = true; }
    assert(threw, 'né cliente né servizio fallisce');
  });
  it(s, 'update stato + softDelete', async () => {
    const store = {}; const sb = makeMock(store);
    const b = await BK.createBooking(sb, 't1', { customer_name: 'X' });
    const u = await BK.updateBooking(sb, b.id, { status: 'confirmed' });
    assertEq(u.status, 'confirmed');
    await BK.softDeleteBooking(sb, b.id);
    assertEq((await BK.listBookings(sb, {})).length, 0);
  });
});

describe('Booking — render + migration 0034', (s) => {
  it(s, 'render', async () => {
    assert(/Nessuna prenotazione/.test(renderRows([])), 'empty');
    assert(/Nuova prenotazione/.test(renderForm(null)), 'form');
  });
  it(s, 'migrazione: tabella + stati + RLS + trigger', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000034_booking.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.booking\b/.test(sql), 'tabella');
    assert(/'requested','confirmed','done','cancelled'/.test(sql), 'stati');
    assert(/has_permission\(tenant_id,'ops\.booking','read'\)/.test(sql), 'RLS');
    assert(/crm_enforce_delete_perm\('ops\.booking'\)/.test(sql), 'trigger');
  });
});
