// INGLY OS V2 — test Chatter & Activities (pattern Odoo mail.thread):
// note/messaggi + attività per qualunque record, CRUD + migrazione statica.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as CH from '../app-v2/src/chatter.js';
import { renderChatter } from '../app-v2/src/chatter-ui.js';

function makeMock(store) {
  let uid = 0;
  function builder(table) {
    const st = { table, filters: [], op: 'select', payload: null, lim: null };
    const api = { select() { return api; }, is(c, v) { st.filters.push((r) => r[c] === v || (v === null && r[c] == null)); return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, insert(row) { st.op = 'insert'; st.payload = row; return api; }, update(row) { st.op = 'update'; st.payload = row; return api; }, single() { return Promise.resolve(run(st, 'single')); }, then(res, rej) { return Promise.resolve(run(st, 'many')).then(res, rej); } };
    return api;
  }
  function run(st, mode) {
    const arr = store[st.table] || (store[st.table] = []);
    if (st.op === 'insert') { const row = { id: 'id' + (++uid), deleted_at: null, done: false, ...st.payload }; arr.push(row); return { data: row, error: null }; }
    if (st.op === 'update') { const rows = arr.filter((r) => st.filters.every((f) => f(r))); rows.forEach((r) => Object.assign(r, st.payload)); return { data: rows[0] || null, error: null }; }
    let rows = arr.filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim);
    if (mode === 'single') return { data: rows[0] || null, error: rows[0] ? null : { message: 'no' } };
    return { data: rows, error: null };
  }
  return { from: (t) => builder(t) };
}

describe('Chatter — note e attività per record', (s) => {
  it(s, 'postMessage e listThread filtrano per entità', async () => {
    const store = {}; const sb = makeMock(store);
    await CH.postMessage(sb, 't1', 'customer', 'c1', 'Chiamato, interessato', 'me@x.it');
    await CH.postMessage(sb, 't1', 'order', 'o1', 'Spedito', 'me@x.it');
    assertEq((await CH.listThread(sb, 'customer', 'c1')).length, 1);
    assertEq((await CH.listThread(sb, 'order', 'o1')).length, 1);
    let threw = false; try { await CH.postMessage(sb, 't1', 'customer', 'c1', '  '); } catch { threw = true; }
    assert(threw, 'messaggio vuoto rifiutato');
  });
  it(s, 'scheduleActivity + completeActivity', async () => {
    const store = {}; const sb = makeMock(store);
    const a = await CH.scheduleActivity(sb, 't1', 'customer', 'c1', { activity_type: 'call', body: 'Richiamare', due_date: '2026-11-10' });
    assertEq(a.kind, 'activity'); assertEq(a.activity_type, 'call'); assertEq(a.done, false);
    const done = await CH.completeActivity(sb, a.id);
    assert(done.done && done.done_at, 'completata');
  });
  it(s, 'splitThread separa messaggi, attività aperte (overdue) e completate', async () => {
    const rows = [
      { kind: 'message', body: 'ciao' },
      { kind: 'activity', body: 'scaduta', done: false, due_date: '2020-01-01' },
      { kind: 'activity', body: 'fatta', done: true },
    ];
    const r = CH.splitThread(rows);
    assertEq(r.messages.length, 1); assertEq(r.openActs.length, 1); assertEq(r.doneActs.length, 1);
    assert(r.openActs[0].overdue, 'scaduta marcata overdue');
  });
  it(s, 'listOpenActivities marca le scadute', async () => {
    const store = { record_note: [
      { id: 'a1', tenant_id: 't1', kind: 'activity', done: false, due_date: '2020-01-01', deleted_at: null },
      { id: 'a2', tenant_id: 't1', kind: 'activity', done: false, due_date: '2099-01-01', deleted_at: null },
    ] };
    const open = await CH.listOpenActivities(makeMock(store), {});
    assertEq(open.length, 2);
    assert(open.find((a) => a.id === 'a1').overdue, 'a1 scaduta');
    assert(!open.find((a) => a.id === 'a2').overdue, 'a2 non scaduta');
  });
});

describe('Chatter — render + migration 0037', (s) => {
  it(s, 'renderChatter mostra compose, attività aperte e cronologia', async () => {
    const html = renderChatter([{ kind: 'message', body: 'nota', author: 'me', created_at: '2026-11-01T10:00:00Z' }, { kind: 'activity', body: 'todo', done: false, activity_type: 'todo' }], true);
    assert(/Note & Attività/.test(html), 'titolo');
    assert(/data-ch-post/.test(html), 'compose nota');
    assert(/data-ch-done/.test(html), 'bottone fatto');
  });
  it(s, 'sola lettura: niente compose', async () => {
    const html = renderChatter([], false);
    assert(!/data-ch-post/.test(html), 'niente compose in lettura');
  });
  it(s, 'migrazione: tabella polimorfica + kind + RLS + trigger', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000037_record_note.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.record_note\b/.test(sql), 'tabella');
    assert(/entity_type text not null/.test(sql) && /entity_id text not null/.test(sql), 'polimorfica');
    assert(/kind in \('message','activity'\)/.test(sql), 'kind');
    assert(/crm_enforce_delete_perm\('tools\.chatter'\)/.test(sql), 'trigger');
  });
});
