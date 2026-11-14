// INGLY OS V2 — test DB locale (IndexedDB adapter): contratto Supabase +
// numerazione + filtri. Rende il tool indipendente e gratis (offline).
import { describe, it, assert, assertEq } from './harness.mjs';
import { makeClient } from '../app-v2/src/localdb.js';

function client() { const store = {}; let saves = 0; const sb = makeClient(store, () => { saves += 1; }); sb._saves = () => saves; return sb; }

describe('LocalDB — contratto Supabase', (s) => {
  it(s, 'insert assegna id/created_at/deleted_at e persiste', async () => {
    const sb = client();
    const { data } = await sb.from('customer').insert({ tenant_id: 't1', name: 'Rossi' }).select().single();
    assert(data.id && data.created_at && data.deleted_at === null, 'default inseriti');
    assert(sb._saves() >= 1, 'persist chiamato');
  });
  it(s, 'eq/is/order/limit/then', async () => {
    const sb = client();
    await sb.from('p').insert({ tenant_id: 't1', name: 'B', n: 2, deleted_at: null });
    await sb.from('p').insert({ tenant_id: 't1', name: 'A', n: 1, deleted_at: null });
    await sb.from('p').insert({ tenant_id: 't1', name: 'X', n: 9, deleted_at: 'x' });
    const { data } = await sb.from('p').select('*').is('deleted_at', null).order('n', { ascending: true }).limit(5);
    assertEq(data.length, 2); assertEq(data[0].name, 'A'); // ordinato per n asc
  });
  it(s, 'update su filtro; single/maybeSingle', async () => {
    const sb = client();
    const ins = await sb.from('o').insert({ tenant_id: 't1', status: 'DRAFT' }).select().single();
    await sb.from('o').update({ status: 'SENT' }).eq('id', ins.data.id);
    const one = await sb.from('o').select('*').eq('id', ins.data.id).single();
    assertEq(one.data.status, 'SENT');
    const none = await sb.from('o').select('*').eq('id', 'zzz').maybeSingle();
    assertEq(none.data, null); assertEq(none.error, null);
    const nf = await sb.from('o').select('*').eq('id', 'zzz').single();
    assert(nf.error, 'single su assente → error');
  });
  it(s, 'delete rimuove le righe filtrate', async () => {
    const sb = client();
    const r = await sb.from('d').insert({ tenant_id: 't1', k: 1 }).select().single();
    await sb.from('d').delete().eq('id', r.data.id);
    const { data } = await sb.from('d').select('*');
    assertEq(data.length, 0);
  });
  it(s, 'or(ilike) fa ricerca case-insensitive su più colonne', async () => {
    const sb = client();
    await sb.from('c').insert({ tenant_id: 't1', name: 'Mario Rossi', email: 'm@x.it', deleted_at: null });
    await sb.from('c').insert({ tenant_id: 't1', name: 'Anna Bianchi', email: 'rossi@y.it', deleted_at: null });
    const { data } = await sb.from('c').select('*').or('name.ilike.%rossi%,email.ilike.%rossi%');
    assertEq(data.length, 2); // Mario (name) + Anna (email contiene rossi)
  });
});

describe('LocalDB — numerazione documenti', (s) => {
  it(s, 'sales_quote/sales_order ricevono numero progressivo e stato default', async () => {
    const sb = client();
    const q1 = await sb.from('sales_quote').insert({ tenant_id: 't1' }).select().single();
    const q2 = await sb.from('sales_quote').insert({ tenant_id: 't1' }).select().single();
    assertEq(q1.data.number, 'PREV-000001'); assertEq(q2.data.number, 'PREV-000002');
    assertEq(q1.data.status, 'DRAFT');
    const o1 = await sb.from('sales_order').insert({ tenant_id: 't1' }).select().single();
    assertEq(o1.data.number, 'ORD-000001'); assertEq(o1.data.status, 'CONFIRMED');
  });
  it(s, 'numero esplicito non viene sovrascritto', async () => {
    const sb = client();
    const q = await sb.from('sales_quote').insert({ tenant_id: 't1', number: 'MIO-1' }).select().single();
    assertEq(q.data.number, 'MIO-1');
  });
});
