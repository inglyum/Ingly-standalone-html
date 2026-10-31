// INGLY OS V2 — test Strumenti Preventivi: calcolatori Laser/3D/Apparel (pure),
// Listino, Template, Quote Intelligence. Deterministico, con fonte.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as QT from '../app-v2/src/quotetools.js';
import { renderListino, renderTemplates, renderQuoteIntel } from '../app-v2/src/quotetools-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

describe('Preventivi — calcolatori deterministici (prezzo ×2 KB)', (s) => {
  it(s, 'calcLaser somma materiale+laser+manodopera e prezza ×2', async () => {
    const r = QT.calcLaser({ mq: 1, sfrido_pct: 0, cost_per_mq: 10, laser_min: 10, cost_per_min: 0.5, labor_min: 60, rate_per_hour: 18 });
    // materiale 10 + laser 5 + manodopera 18 = 33
    assertEq(r.unitCost, 33);
    assert(r.price >= 66 && r.price < 67, 'prezzo ~66 (×2 → ,90)'); // roundTo90(66)=66.90
  });
  it(s, 'calc3D: filamento (g/1000×€/kg) + ore macchina + post-lavoro', async () => {
    const r = QT.calc3D({ grams: 100, cost_per_kg: 20, print_hours: 2, machine_rate: 1, labor_min: 0 });
    // filamento 2 + macchina 2 + 0 = 4
    assertEq(r.unitCost, 4);
  });
  it(s, 'calcApparel: capo + stampa + manodopera', async () => {
    const r = QT.calcApparel({ garment_cost: 6, prints: 1, print_cost: 2.5, labor_min: 0 });
    assertEq(r.unitCost, 8.5);
  });
});

describe('Preventivi — Listino / Template / Quote Intelligence', (s) => {
  it(s, 'loadListino dal catalogo con margine', async () => {
    const d = await QT.loadListino(makeMock({ catalog_product: [{ id: 'p1', tenant_id: 't1', name: 'Targa', cost: 10, price: 20, deleted_at: null }] }));
    assertEq(d.items.length, 1); assertEq(d.items[0].price, 20);
  });
  it(s, 'loadTemplates: preset KB (validità/acconto/express)', async () => {
    const d = QT.loadTemplates();
    assert(d.items.length >= 4, 'almeno 4 template');
    assert(/7 giorni/.test(d.items.map((t) => t.body).join(' ')), 'validità KB');
    assert(/\+25%/.test(d.items.map((t) => t.body).join(' ')), 'express KB');
  });
  it(s, 'loadQuoteIntel: conversione e valore medio dai preventivi reali', async () => {
    const d = await QT.loadQuoteIntel(makeMock({ sales_quote: [
      { id: 'q1', tenant_id: 't1', status: 'ACCEPTED', total: 100, deleted_at: null },
      { id: 'q2', tenant_id: 't1', status: 'SENT', total: 50, deleted_at: null },
    ] }));
    assertEq(d.total, 2); assertEq(d.accepted, 1); assertEq(d.conversion, 50); assertEq(d.avgValue, 75); assertEq(d.open, 1);
  });
  it(s, 'render non crasha', async () => {
    const sb = makeMock({ catalog_product: [{ id: 'p1', tenant_id: 't1', name: 'X', cost: 1, price: 2, deleted_at: null }], sales_quote: [{ id: 'q1', tenant_id: 't1', status: 'ACCEPTED', total: 10, deleted_at: null }] });
    assert(renderListino(await QT.loadListino(sb)).includes('Prodotto'), 'listino');
    assert(renderTemplates(QT.loadTemplates()).length > 50, 'template');
    assert(renderQuoteIntel(await QT.loadQuoteIntel(sb)).includes('Conversione'), 'quoteintel');
  });
});
