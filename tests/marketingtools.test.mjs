// INGLY OS V2 — test Marketing reale: Marketing Pro (dai dati reali) ed Etsy
// SEO Wizard (deterministico, regole Etsy). Nessuna AI finta.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as MK from '../app-v2/src/marketingtools.js';
import { renderMarketingPlan, renderEtsySeo } from '../app-v2/src/marketingtools-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

describe('Marketing Pro — piano dai dati reali', (s) => {
  it(s, 'loadMarketingPlan produce azioni e calendario con fonte', async () => {
    const store = {
      catalog_product: [{ id: 'p1', tenant_id: 't1', name: 'Targa', price: 30, cost: 10, deleted_at: null }],
      sales_order_line: [{ product_id: 'p1', quantity: 5 }],
      stock_movement: [],
    };
    const d = await MK.loadMarketingPlan(makeMock(store));
    assert(!d.error, 'nessun errore');
    assert(Array.isArray(d.actions) && d.calendar.length === 4, 'azioni + 4 giorni');
    assert(d.source.includes('reali'), 'fonte dati reali');
  });
});

describe('Etsy SEO Wizard — regole Etsy deterministiche', (s) => {
  it(s, 'titolo capato a 140, tag ≤20 char e max 13', async () => {
    const r = MK.etsySeo({ title: 'x'.repeat(200), material: 'legno', occasion: 'matrimonio', keywords: 'targa, incisione laser, personalizzato, regalo, casa, nome, data, cuore, fiori, legno massello premium extra lungo tag, uno, due, tre, quattro' });
    assert(r.titleLen <= MK.ETSY.TITLE_MAX, 'titolo ≤140');
    assert(r.titleTrunc, 'segnala troncamento');
    assert(r.tags.length <= MK.ETSY.TAGS_MAX, 'max 13 tag');
    assert(r.tags.every((t) => t.length <= MK.ETSY.TAG_MAX), 'ogni tag ≤20');
  });
  it(s, 'score e checklist deterministici; senza input score basso', async () => {
    const empty = MK.etsySeo({});
    assert(empty.score < 50, 'score basso senza input');
    const good = MK.etsySeo({ title: 'Targa matrimonio', material: 'legno', occasion: 'matrimonio', keywords: 'targa, incisione, regalo, nome, data, cuore, legno, personalizzato' });
    assert(good.score > empty.score, 'score migliora con input');
  });
  it(s, 'render non crasha', async () => {
    const store = { catalog_product: [], sales_order_line: [], stock_movement: [] };
    assert(renderMarketingPlan(await MK.loadMarketingPlan(makeMock(store))).includes('Calendario'), 'piano');
    assert(renderEtsySeo(MK.etsySeo({ title: 'Targa', material: 'legno' })).includes('Checklist'), 'seo');
  });
});
