// INGLY OS V2 — test Strumenti extra: Tax Calendar (date note), Fiscal (stima
// IVA), Laser B2B (markup KB). Deterministico, con limiti dichiarati.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as EX from '../app-v2/src/extratools.js';
import { renderTaxCalendar, renderFiscal } from '../app-v2/src/extratools-ui.js';
import { INTEGRATION_KEYS, renderView } from '../app-v2/src/views.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [] };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit() { return api; }, maybeSingle() { return Promise.resolve({ data: (store[st.table] || [])[0] || null, error: null }); }, single() { return Promise.resolve({ data: (store[st.table] || [])[0] || null, error: null }); }, then(res, rej) { const rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

describe('Tax Calendar — scadenze IT deterministiche', (s) => {
  it(s, 'prossime occorrenze ordinate e nel futuro, con fonte', async () => {
    const d = EX.loadTaxCalendar(new Date('2026-11-01'));
    assert(d.items.length >= 5, 'più scadenze');
    for (let i = 1; i < d.items.length; i++) assert(d.items[i - 1].date <= d.items[i].date, 'ordinate');
    assert(d.items.every((x) => x.daysTo >= 0), 'nel futuro');
    assert(/commercialista/.test(d.source), 'disclaimer');
  });
});

describe('Fiscal — stima IVA sull\'incassato', (s) => {
  it(s, 'scorpora IVA all\'aliquota configurata', async () => {
    const store = { sales_invoice: [], sales_payment: [], supplier_payment: [], tenant_settings: [{ tenant_id: 't1', vat_rate: 22 }] };
    const d = await EX.loadFiscal(makeMock(store), 't1');
    assertEq(d.aliquota, 22);
    assert(/SdI/.test(d.note), 'limite SdI dichiarato');
  });
});

describe('Laser B2B — markup KB ×2.5', (s) => {
  it(s, 'usa markup 150 di default (B2B)', async () => {
    const r = EX.calcLaserB2B({ mq: 1, cost_per_mq: 10, laser_min: 0, labor_min: 0 });
    assertEq(r.unitCost, 10);
    assertEq(r.markupPct, 150); // +150% = ×2.5
  });
});

describe('Integrazione — pannello onesto (no finzione)', (s) => {
  it(s, 'i moduli esterni mostrano "non ancora connesso" + servizio richiesto', async () => {
    assert(INTEGRATION_KEYS.includes('social') && INTEGRATION_KEYS.includes('xmlsdi'), 'chiavi integrazione');
    const html = renderView('social', {});
    assert(/non ancora connesso/i.test(html), 'badge onesto');
    assert(/richiede integrazione|servizio esterno/i.test(html), 'spiega integrazione');
  });
  it(s, 'render non crasha', async () => {
    assert(renderTaxCalendar(EX.loadTaxCalendar()).includes('Scadenza'), 'tax');
    assert(renderFiscal({ aliquota: 22, incassato: 122, imponibileIncassato: 100, ivaIncassata: 22, daIncassare: 0, scaduto: 0, note: 'SdI', source: 'x' }).includes('IVA'), 'fiscal');
  });
});
