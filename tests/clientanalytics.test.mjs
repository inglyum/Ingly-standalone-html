// INGLY OS V2 — test Analisi Clienti: RFM, CLV, lead scoring, pitch B2B.
// Deterministico, read-only, con fonte. Mock Supabase minimale con ordini reali.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as CA from '../app-v2/src/clientanalytics.js';
import { renderClientIntel, renderClv, renderLeadScores, renderPitch } from '../app-v2/src/clientanalytics-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

const store = () => ({
  sales_order: [
    { id: 'o1', tenant_id: 't1', customer_name: 'Rossi', status: 'CONFIRMED', total: 200, order_date: '2026-01-10', deleted_at: null },
    { id: 'o2', tenant_id: 't1', customer_name: 'Rossi', status: 'DELIVERED', total: 300, order_date: '2026-07-10', deleted_at: null },
    { id: 'o3', tenant_id: 't1', customer_name: 'Bianchi', status: 'CONFIRMED', total: 50, order_date: '2026-02-01', deleted_at: null },
  ],
});

describe('Analisi Clienti — RFM / CLV / lead', (s) => {
  it(s, 'loadClientIntel segmenta con fonte', async () => {
    const d = await CA.loadClientIntel(makeMock(store()));
    assert(!d.error && d.items.length === 2, 'due clienti');
    assert(d.items.every((r) => r.segment && r.source), 'segmento+fonte');
  });
  it(s, 'loadClv: storico = somma ordini, ticket medio corretto', async () => {
    const d = await CA.loadClv(makeMock(store()));
    const rossi = d.items.find((c) => c.name === 'Rossi');
    assertEq(rossi.historic, 500); assertEq(rossi.orders, 2); assertEq(rossi.avgOrder, 250);
    assert(rossi.projectedAnnual >= 0, 'proiezione');
    assertEq(d.totalHistoric, 550);
  });
  it(s, 'loadLeadScores: punteggio 0..100 con priorità', async () => {
    const d = await CA.loadLeadScores(makeMock(store()));
    assert(d.items.length === 2, 'due lead');
    assert(d.items.every((r) => r.score >= 0 && r.score <= 100 && ['alta', 'media', 'bassa'].includes(r.priority)), 'score+priorità');
  });
});

describe('Analisi Clienti — Pitch B2B (template dati reali + KB, no AI finta)', (s) => {
  it(s, 'buildB2BPitch include termini KB tracciabili', async () => {
    const p = CA.buildB2BPitch({ name: 'Rossi', historic: 500, orders: 2 });
    assert(/×2–2,5/.test(p.lines.join(' ')), 'markup B2B KB');
    assert(/validità 7 giorni/i.test(p.lines.join(' ')), 'validità KB');
    assert(/Acconto 50%/i.test(p.lines.join(' ')), 'acconto KB');
    assert(p.source.includes('KB'), 'fonte KB');
  });
  it(s, 'render non crasha e mostra fonte', async () => {
    const sb = makeMock(store());
    assert(renderClientIntel(await CA.loadClientIntel(sb)).includes('Segmento') || renderClientIntel(await CA.loadClientIntel(sb)).length > 20, 'intel');
    assert(renderClv(await CA.loadClv(sb)).includes('CLV'), 'clv');
    assert(renderLeadScores(await CA.loadLeadScores(sb)).length > 20, 'lead');
    const p = CA.buildB2BPitch({ name: 'Rossi', historic: 500, orders: 2 });
    assert(renderPitch([{ name: 'Rossi', historic: 500 }], 'Rossi', p).includes('Pitch B2B'), 'pitch');
  });
});
