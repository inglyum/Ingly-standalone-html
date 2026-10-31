// INGLY OS V2 — test Bank & Funds + Lab & Lista Acquisti: CRUD + migrazioni.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as BF from '../app-v2/src/bankfunds.js';
import * as LAB from '../app-v2/src/labsetup.js';
import { renderRows as bankRows, renderForm as bankForm } from '../app-v2/src/bankfunds-ui.js';
import { renderRows as labRows, renderForm as labForm } from '../app-v2/src/labsetup-ui.js';

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

describe('Bank & Funds — CRUD + liquidità', (s) => {
  it(s, 'createAccount + totalLiquidity (solo attivi)', async () => {
    const sb = makeMock({});
    await BF.createAccount(sb, 't1', { name: 'Conto Intesa', kind: 'bank', balance: 1000 });
    await BF.createAccount(sb, 't1', { name: 'Cassa', kind: 'cash', balance: 200 });
    const rows = await BF.listAccounts(sb, {});
    assertEq(BF.totalLiquidity(rows), 1200);
    assertEq(BF.totalLiquidity([{ active: false, balance: 999 }, { active: true, balance: 10 }]), 10);
  });
  it(s, 'nome obbligatorio; render', async () => {
    const sb = makeMock({});
    let threw = false; try { await BF.createAccount(sb, 't1', { balance: 5 }); } catch { threw = true; }
    assert(threw, 'nome obbligatorio');
    assert(/Nessun conto/.test(bankRows([])) && /Nuovo conto/.test(bankForm(null)), 'render');
  });
});

describe('Lab & Lista Acquisti — CRUD + totale', (s) => {
  it(s, 'createLabItem + remainingCost (solo non comprati)', async () => {
    const sb = makeMock({});
    await LAB.createLabItem(sb, 't1', { name: 'Fresa', quantity: 2, unit_cost: 15 });
    await LAB.createLabItem(sb, 't1', { name: 'Occhiali', quantity: 1, unit_cost: 20, bought: true });
    const rows = await LAB.listLabItems(sb, {});
    assertEq(LAB.remainingCost(rows), 30); // solo Fresa 2×15; Occhiali comprato escluso
  });
  it(s, 'toggle bought + render', async () => {
    const sb = makeMock({});
    const i = await LAB.createLabItem(sb, 't1', { name: 'X' });
    const u = await LAB.updateLabItem(sb, i.id, { bought: true });
    assert(u.bought, 'comprato');
    assert(/Lista vuota/.test(labRows([])) && /Nuovo articolo/.test(labForm(null)), 'render');
  });
});

describe('Bank & Lab — migrazioni 0035/0036', (s) => {
  it(s, 'bank_account: tabella + RLS finanziaria ristretta + trigger', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000035_bank_account.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.bank_account\b/.test(sql), 'tabella');
    assert(/a\.action = 'read' and r\.key in \('OWNER','ADMIN','MANAGER'\)/.test(sql), 'lettura ristretta');
    assert(/crm_enforce_delete_perm\('finance\.bank'\)/.test(sql), 'trigger');
  });
  it(s, 'lab_item: tabella + RLS + trigger', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000036_lab_item.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.lab_item\b/.test(sql), 'tabella');
    assert(/has_permission\(tenant_id,'tools\.lab','read'\)/.test(sql), 'RLS');
    assert(/crm_enforce_delete_perm\('tools\.lab'\)/.test(sql), 'trigger');
  });
});
