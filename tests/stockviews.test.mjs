// INGLY OS V2 — test viste tipizzate magazzino (vernici/componenti/gadget come
// viste sulla master-data materiali) + Supplier Intelligence. Deterministico.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as SV from '../app-v2/src/stockviews.js';
import { renderTyped, renderSupplierIntel } from '../app-v2/src/stockviews-ui.js';

function makeMock(store) {
  function builder(table) {
    const st = { table, filters: [], lim: null };
    const api = { select() { return api; }, is() { return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, or() { return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, then(res, rej) { let rows = (store[st.table] || []).filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim); return Promise.resolve({ data: rows, error: null }).then(res, rej); } };
    return api;
  }
  return { from: (t) => builder(t) };
}

describe('Viste tipizzate — classificatore', (s) => {
  it(s, 'materialMatchesView separa vernice/componente/gadget', async () => {
    assert(SV.materialMatchesView({ material_type: 'vernice spray' }, 'paint'), 'vernice');
    assert(SV.materialMatchesView({ material_type: 'vite M3' }, 'component'), 'componente');
    assert(SV.materialMatchesView({ category: 'LED e minuteria' }, 'gadget'), 'gadget');
    assert(!SV.materialMatchesView({ material_type: 'MDF' }, 'paint'), 'MDF non è vernice');
  });
});

describe('Viste tipizzate — loadTypedStock (stessa master-data)', (s) => {
  const store = () => ({
    catalog_product: [
      { id: 'm1', tenant_id: 't1', name: 'Smalto bianco', kind: 'material', material_type: 'vernice', cost: 8, deleted_at: null },
      { id: 'm2', tenant_id: 't1', name: 'MDF 3mm', kind: 'material', material_type: 'MDF', cost: 12, deleted_at: null },
      { id: 'm3', tenant_id: 't1', name: 'LED strip', kind: 'material', material_type: 'LED', cost: 3, deleted_at: null },
    ],
    stock_movement: [{ id: 'sm1', product_id: 'm1', type: 'IN', quantity: 5, deleted_at: null }],
    sales_order: [], sales_order_line: [],
  });
  it(s, 'vista paint mostra solo le vernici, con fonte "nessuna tabella separata"', async () => {
    const d = await SV.loadTypedStock(makeMock(store()), 'paint');
    assertEq(d.items.length, 1); assertEq(d.items[0].name, 'Smalto bianco');
    assert(/nessuna tabella separata/.test(d.source), 'fonte master-data');
  });
  it(s, 'vista gadget mostra solo LED/gadget', async () => {
    const d = await SV.loadTypedStock(makeMock(store()), 'gadget');
    assertEq(d.items.length, 1); assertEq(d.items[0].name, 'LED strip');
  });
});

describe('Supplier Intelligence — spesa per fornitore', (s) => {
  const store = () => ({
    purchase_order: [
      { id: 'p1', tenant_id: 't1', supplier_name: 'Legnami Belice', status: 'ORDERED', total: 250, order_date: '2026-08-14', deleted_at: null },
      { id: 'p2', tenant_id: 't1', supplier_name: 'Legnami Belice', status: 'RECEIVED', total: 150, order_date: '2026-09-01', deleted_at: null },
      { id: 'p3', tenant_id: 't1', supplier_name: 'Plexi Sud', status: 'ORDERED', total: 100, order_date: '2026-09-05', deleted_at: null },
    ],
    supplier: [{ id: 's1', tenant_id: 't1', name: 'Legnami Belice', deleted_at: null }, { id: 's2', tenant_id: 't1', name: 'Plexi Sud', deleted_at: null }],
  });
  it(s, 'aggrega spesa/ordini/ultimo e calcola concentrazione', async () => {
    const d = await SV.loadSupplierIntel(makeMock(store()));
    assertEq(d.totalSpend, 500);
    const legnami = d.items.find((x) => x.name === 'Legnami Belice');
    assertEq(legnami.spend, 400); assertEq(legnami.orders, 2); assertEq(legnami.avgOrder, 200); assertEq(legnami.last, '2026-09-01');
    assertEq(d.topShare, 80); // 400/500
  });
  it(s, 'render non crasha e mostra fonte', async () => {
    const sb = makeMock(store());
    assert(renderSupplierIntel(await SV.loadSupplierIntel(sb)).includes('Fornitore'), 'tabella');
    assert(renderTyped(await SV.loadTypedStock(sb, 'paint'), 'x').length > 20, 'typed');
  });
});
