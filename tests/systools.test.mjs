// INGLY OS V2 — test Sistema & Strumenti: report hub, agenda (scadenze reali),
// risorse laser, brand, legale. Deterministico, con fonte.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as ST from '../app-v2/src/systools.js';
import { renderReportHub, renderAgenda, renderLaserResources, renderBrand, renderLegal } from '../app-v2/src/systools-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

describe('Sistema — Calendario (agenda da scadenze reali)', (s) => {
  it(s, 'include solo scadenze reali di preventivi/fatture aperti, ordinate', async () => {
    const store = {
      sales_quote: [
        { id: 'q1', tenant_id: 't1', number: 'PREV-1', status: 'SENT', valid_until: '2026-12-10', deleted_at: null },
        { id: 'q2', tenant_id: 't1', number: 'PREV-2', status: 'ACCEPTED', valid_until: '2026-11-01', deleted_at: null },
      ],
      sales_invoice: [{ id: 'inv1', tenant_id: 't1', number: 'FAT-1', status: 'ISSUED', total: 100, paid_total: 0, due_date: '2026-12-05', deleted_at: null }],
    };
    const d = await ST.loadAgenda(makeMock(store));
    assertEq(d.events.length, 2); // q1 (SENT) + inv1; q2 ACCEPTED escluso
    assertEq(d.events[0].date, '2026-12-05'); // ordinato: fattura prima
  });
});

describe('Sistema — Brand / Legale (riferimento statico)', (s) => {
  it(s, 'brand espone valori/tecniche con fonte', async () => {
    const d = ST.loadBrand();
    assert(d.brand.name === 'Ingly Design' && d.brand.values.length > 0, 'brand');
    assert(/San Cipirello/.test(d.brand.place), 'luogo');
  });
  it(s, 'legale: modelli con disclaimer non-consulenza', async () => {
    const d = ST.loadLegal();
    assert(d.items.length >= 3, 'almeno 3 modelli');
    assert(/validi 7 giorni/i.test(d.items.map((x) => x.body).join(' ')), 'condizioni KB');
    assert(/non è consulenza/i.test(d.source), 'disclaimer');
  });
});

describe('Sistema — render + report/risorse', (s) => {
  it(s, 'render non crasha', async () => {
    const store = { sales_order: [], sales_quote: [], sales_invoice: [], catalog_product: [], purchase_order: [], project: [], stock_movement: [], equipment: [{ id: 'e1', tenant_id: 't1', name: 'xTool', category: 'laser', cost_per_min: 0.45, deleted_at: null }] };
    const sb = makeMock(store);
    assert(renderReportHub(await ST.loadReportHub(sb)).length > 20, 'report');
    assert(renderAgenda(await ST.loadAgenda(sb)).length > 10, 'agenda');
    assert(renderLaserResources(await ST.loadLaserResources(sb)).includes('Macchine'), 'risorse');
    assert(renderBrand(ST.loadBrand()).includes('Ingly Design'), 'brand');
    assert(renderLegal(ST.loadLegal()).includes('consulenza'), 'legale');
  });
});
