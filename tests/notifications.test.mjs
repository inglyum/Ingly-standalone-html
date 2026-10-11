// INGLY OS V2 — test Notification Center: eventi + consegne tracciate + adapter
// MOCK (simulazione, nessun invio reale; wa.me = apertura manuale, mai delivered).
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as NOTIF from '../app-v2/src/notifications.js';
import { renderRows, renderForm } from '../app-v2/src/notifications-ui.js';

function makeMock(store) {
  let uid = 0;
  function builder(table) {
    const st = { table, filters: [], op: 'select', payload: null, lim: null, orderBy: null, asc: true };
    const api = { select() { return api; }, is(c, v) { st.filters.push((r) => r[c] === v || (v === null && r[c] == null)); return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order(c, o) { st.orderBy = c; st.asc = !o || o.ascending; return api; }, limit(n) { st.lim = n; return api; }, insert(row) { st.op = 'insert'; st.payload = row; return api; }, update(row) { st.op = 'update'; st.payload = row; return api; }, single() { return Promise.resolve(run(st, 'single')); }, then(res, rej) { return Promise.resolve(run(st, 'many')).then(res, rej); } };
    return api;
  }
  function run(st, mode) {
    const arr = store[st.table] || (store[st.table] = []);
    if (st.op === 'insert') { const row = { id: 'id' + (++uid), deleted_at: null, ...st.payload }; arr.push(row); return { data: row, error: null }; }
    if (st.op === 'update') { const rows = arr.filter((r) => st.filters.every((f) => f(r))); rows.forEach((r) => Object.assign(r, st.payload)); return { data: rows[0] || null, error: null }; }
    let rows = arr.filter((r) => st.filters.every((f) => f(r)));
    if (st.orderBy) rows = rows.slice().sort((a, b) => { const x = a[st.orderBy], y = b[st.orderBy]; if (x === y) return 0; return (x > y ? 1 : -1) * (st.asc ? 1 : -1); });
    if (st.lim) rows = rows.slice(0, st.lim);
    if (mode === 'single') return { data: rows[0] || null, error: rows[0] ? null : { message: 'no' } };
    return { data: rows, error: null };
  }
  return { from: (t) => builder(t) };
}

describe('Notifiche — eventi e coda', (s) => {
  it(s, 'EVENTS/CHANNELS/STATUSES ufficiali presenti', async () => {
    ['subscription_expiring', 'payment_failed', 'renewal', 'plan_change', 'password_change', 'suspicious_login', 'revoke', 'usage_alert', 'custom']
      .forEach((k) => assert(NOTIF.isKnownEvent(k), 'evento ' + k));
    assertEq(NOTIF.CHANNELS.length, 4);
    assert(NOTIF.STATUSES.includes('accepted') && NOTIF.STATUSES.includes('delivered'), 'accepted≠delivered');
  });
  it(s, 'enqueue mette in coda (status queued); evento ignoto fallisce', async () => {
    const sb = makeMock({});
    const n = await NOTIF.enqueue(sb, 't1', { event: 'renewal', channel: 'email', recipient: 'a@b.it' });
    assertEq(n.status, 'queued'); assertEq(n.attempts, 0);
    let threw = false; try { await NOTIF.enqueue(sb, 't1', { event: 'nope' }); } catch { threw = true; }
    assert(threw, 'evento ignoto rifiutato');
  });
});

describe('Notifiche — adapter MOCK (simulazione, mai invio reale)', (s) => {
  it(s, 'email con destinatario → delivered SIMULATO + traccia transizioni', async () => {
    const store = {}; const sb = makeMock(store);
    const n = await NOTIF.enqueue(sb, 't1', { event: 'renewal', channel: 'email', recipient: 'a@b.it' });
    const out = await NOTIF.processMock(sb, n);
    assertEq(out.status, 'delivered'); assertEq(out.provider, 'mock'); assertEq(out.attempts, 1);
    const d = await NOTIF.listDeliveries(sb, n.id);
    assert(d.some((x) => x.status === 'processing') && d.some((x) => x.status === 'delivered'), 'transizioni tracciate');
    assert(/SIMULATA|mock/i.test(d.find((x) => x.status === 'delivered').detail), 'etichetta simulazione');
  });
  it(s, 'whatsapp → accepted (apertura manuale wa.me), MAI delivered', async () => {
    const sb = makeMock({});
    const n = await NOTIF.enqueue(sb, 't1', { event: 'custom', channel: 'whatsapp', recipient: '+3933' });
    const out = await NOTIF.processMock(sb, n);
    assertEq(out.status, 'accepted');
    assert(out.status !== 'delivered', 'wa.me non è consegna automatica');
  });
  it(s, 'email/webhook senza destinatario → failed con errore esplicito', async () => {
    const sb = makeMock({});
    const n = await NOTIF.enqueue(sb, 't1', { event: 'payment_failed', channel: 'email' });
    const out = await NOTIF.processMock(sb, n);
    assertEq(out.status, 'failed'); assert(out.error && /Destinatario/.test(out.error), 'errore osservabile');
  });
  it(s, 'retry solo su failed; incrementa attempts', async () => {
    const sb = makeMock({});
    const n = await NOTIF.enqueue(sb, 't1', { event: 'payment_failed', channel: 'email' });
    const failed = await NOTIF.processMock(sb, n);
    assertEq(failed.attempts, 1);
    const retried = await NOTIF.retry(sb, { ...failed });
    assertEq(retried.attempts, 2);
  });
  it(s, 'cancel + softDelete escludono dalla lista', async () => {
    const store = {}; const sb = makeMock(store);
    const n = await NOTIF.enqueue(sb, 't1', { event: 'renewal', channel: 'in_app' });
    await NOTIF.cancel(sb, n.id);
    assertEq((await NOTIF.listNotifications(sb, { status: 'cancelled' })).length, 1);
    await NOTIF.softDeleteNotification(sb, n.id);
    assertEq((await NOTIF.listNotifications(sb, {})).length, 0);
  });
});

describe('Notifiche — render', (s) => {
  it(s, 'renderRows: empty + riga con azione mock', async () => {
    assert(/Nessuna notifica/.test(renderRows([])), 'empty');
    const html = renderRows([{ id: 'n1', event: 'renewal', channel: 'email', recipient: 'a@b.it', status: 'queued', attempts: 0 }]);
    assert(/data-send="n1"/.test(html) && /mock/i.test(html), 'azione invia mock');
  });
  it(s, 'renderForm elenca eventi e canali', async () => {
    const f = renderForm();
    assert(/subscription_expiring/.test(f) && /whatsapp/.test(f), 'eventi/canali');
  });
});

describe('Notifiche — migration 0031 (statica)', (s) => {
  const sql = readFileSync(new URL('../supabase/migrations/20260101000031_notification.sql', import.meta.url), 'utf8');
  it(s, 'tabelle + stati distinti + RLS + trigger delete + mock documentato', async () => {
    assert(/create table if not exists public\.notification\b/.test(sql), 'tabella notification');
    assert(/create table if not exists public\.notification_delivery\b/.test(sql), 'tabella consegne');
    assert(/'queued','processing','accepted','delivered','failed','cancelled'/.test(sql), 'stati distinti');
    assert(/has_permission\(tenant_id,'system\.notification','read'\)/.test(sql), 'read perm');
    assert(/crm_enforce_delete_perm\('system\.notification'\)/.test(sql), 'trigger delete');
    assert(/MOCK|simulazione|apertura manuale/i.test(sql), 'mock etichettato come simulazione');
  });
});
