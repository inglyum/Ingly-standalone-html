// INGLY OS V2 — test Workspace Note: idee/innovazione/strategia/fiera su UNA
// tabella tipizzata (kind). CRUD reale + migrazione statica.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as WS from '../app-v2/src/workspace.js';
import { renderRows, renderForm } from '../app-v2/src/workspace-ui.js';

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

describe('Workspace Note — CRUD tipizzato', (s) => {
  it(s, 'createNote con kind valido; kind errato fallisce', async () => {
    const sb = makeMock({});
    const n = await WS.createNote(sb, 't1', 'idea', { title: 'Nuova linea targhe' });
    assertEq(n.kind, 'idea'); assertEq(n.status, 'open');
    let threw = false; try { await WS.createNote(sb, 't1', 'nope', { title: 'x' }); } catch { threw = true; }
    assert(threw, 'kind non valido rifiutato');
    let threw2 = false; try { await WS.createNote(sb, 't1', 'idea', {}); } catch { threw2 = true; }
    assert(threw2, 'titolo obbligatorio');
  });
  it(s, 'listNotes filtra per kind; softDelete esclude', async () => {
    const store = {}; const sb = makeMock(store);
    await WS.createNote(sb, 't1', 'idea', { title: 'A' });
    await WS.createNote(sb, 't1', 'strategy', { title: 'B' });
    assertEq((await WS.listNotes(sb, 'idea', {})).length, 1);
    assertEq((await WS.listNotes(sb, 'strategy', {})).length, 1);
    const n = (await WS.listNotes(sb, 'idea', {}))[0];
    await WS.softDeleteNote(sb, n.id);
    assertEq((await WS.listNotes(sb, 'idea', {})).length, 0);
  });
  it(s, 'tags da stringa → array', async () => {
    const sb = makeMock({});
    const n = await WS.createNote(sb, 't1', 'fiera', { title: 'Checklist', tags: 'stand, flyer, qr' });
    assertEq(JSON.stringify(n.tags), JSON.stringify(['stand', 'flyer', 'qr']));
  });
});

describe('Workspace Note — render + migration 0032 (statica)', (s) => {
  it(s, 'renderRows/Form', async () => {
    assert(/Nessuna voce/.test(renderRows([])), 'empty');
    assert(/data-edit="n1"/.test(renderRows([{ id: 'n1', title: 'X', status: 'open', priority: 'high' }])), 'riga');
    assert(/Nuova voce/.test(renderForm(null)), 'nuovo');
  });
  it(s, 'migrazione: tabella unica con kind in check, RLS, trigger delete', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000032_workspace_note.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.workspace_note\b/.test(sql), 'tabella');
    assert(/kind in \('idea','innovation','strategy','fiera'\)/.test(sql), 'kind check');
    assert(/has_permission\(tenant_id,'tools\.workspace','read'\)/.test(sql), 'RLS read');
    assert(/crm_enforce_delete_perm\('tools\.workspace'\)/.test(sql), 'trigger delete');
  });
});
