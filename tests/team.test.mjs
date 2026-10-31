// INGLY OS V2 — test Team & HR: CRUD collaboratori, costo orario medio, migr.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as TEAM from '../app-v2/src/team.js';
import { renderRows, renderForm } from '../app-v2/src/team-ui.js';

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

describe('Team & HR — CRUD + costo orario', (s) => {
  it(s, 'createMember: nome obbligatorio, costo orario sanificato', async () => {
    const sb = makeMock({});
    const m = await TEAM.createMember(sb, 't1', { name: 'Marco', role: 'laser', hourly_cost: -5 });
    assertEq(m.hourly_cost, 0); assert(m.active, 'attivo di default');
    let threw = false; try { await TEAM.createMember(sb, 't1', { role: 'x' }); } catch { threw = true; }
    assert(threw, 'nome mancante fallisce');
  });
  it(s, 'avgHourlyCost: media solo attivi con costo>0', async () => {
    assertEq(TEAM.avgHourlyCost([{ active: true, hourly_cost: 18 }, { active: true, hourly_cost: 22 }, { active: false, hourly_cost: 100 }]), 20);
    assertEq(TEAM.avgHourlyCost([]), 0);
  });
  it(s, 'softDelete esclude dalla lista', async () => {
    const store = {}; const sb = makeMock(store);
    const m = await TEAM.createMember(sb, 't1', { name: 'X' });
    await TEAM.softDeleteMember(sb, m.id);
    assertEq((await TEAM.listTeam(sb, {})).length, 0);
  });
});

describe('Team & HR — render + migration 0033', (s) => {
  it(s, 'render', async () => {
    assert(/Nessun collaboratore/.test(renderRows([])), 'empty');
    assert(/Nuovo collaboratore/.test(renderForm(null)), 'form');
  });
  it(s, 'migrazione: tabella + RLS + lettura ristretta HR + trigger', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000033_team_member.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.team_member\b/.test(sql), 'tabella');
    assert(/has_permission\(tenant_id,'system\.team','read'\)/.test(sql), 'RLS read');
    assert(/a\.action = 'read' and r\.key in \('OWNER','ADMIN','MANAGER'\)/.test(sql), 'lettura HR ristretta');
    assert(/crm_enforce_delete_perm\('system\.team'\)/.test(sql), 'trigger');
  });
});
