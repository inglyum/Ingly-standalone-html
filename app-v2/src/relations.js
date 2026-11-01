// INGLY OS V2 — Relazioni cross-modulo (data-layer). Pattern Odoo "smart
// buttons": per un'entità (cliente/prodotto) aggrega i record collegati da TUTTI
// i moduli, con conteggi reali e link. READ-ONLY, deterministico, nessuna
// tabella nuova: legge i data-layer esistenti. Dove un dato manca → 0.
import { listOrders } from './orders.js';
import { listQuotes } from './quotes.js';
import { listInvoices } from './invoices.js';
import { listProjects } from './projects.js';
import { friendlyError } from './crm.js';
export { friendlyError };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// Match robusto cliente: per id quando presente, altrimenti per nome.
function matchCustomer(row, customer) {
  const id = customer.id; const name = (customer.name || '').trim().toLowerCase();
  if (id && (String(row.customer_id) === String(id))) return true;
  const rn = (row.customer_name || '').trim().toLowerCase();
  return !!name && rn === name;
}

// ── RELAZIONI CLIENTE — ordini, preventivi, fatture, commesse collegati.
export async function customerRelations(sb, customer) {
  const c = customer || {};
  const [orders, quotes, invoices, projects] = await Promise.all([
    safe(listOrders(sb, { limit: 3000 }), []), safe(listQuotes(sb, { limit: 3000 }), []),
    safe(listInvoices(sb, { limit: 3000 }), []), safe(listProjects(sb, { limit: 2000 }), []),
  ]);
  const o = orders.filter((x) => x.status !== 'CANCELLED' && matchCustomer(x, c));
  const q = quotes.filter((x) => matchCustomer(x, c));
  const i = invoices.filter((x) => x.status !== 'CANCELLED' && matchCustomer(x, c));
  const p = projects.filter((x) => matchCustomer(x, c) || String(x.customer_id) === String(c.id));
  return {
    cards: [
      { key: 'orders', label: 'Ordini', count: o.length, value: r2(o.reduce((s, x) => s + Number(x.total || 0), 0)), route: 'gestione_ordini', icon: '📦' },
      { key: 'quotes', label: 'Preventivi', count: q.length, value: r2(q.reduce((s, x) => s + Number(x.total || 0), 0)), route: 'quotes', icon: '🧾' },
      { key: 'invoices', label: 'Fatture', count: i.length, value: r2(i.reduce((s, x) => s + Number(x.total || 0), 0)), route: 'invoices', icon: '💶' },
      { key: 'projects', label: 'Commesse', count: p.length, value: null, route: 'projects', icon: '🗂️' },
    ],
    source: 'ordini + preventivi + fatture + commesse collegati (dati reali)', error: null,
  };
}

// ── RELAZIONI PRODOTTO — righe ordine/preventivo che lo usano + movimenti stock.
export async function productRelations(sb, product) {
  const p = product || {}; const pid = String(p.id);
  const [ol, ql, sm] = await Promise.all([
    safe(sb.from('sales_order_line').select('product_id,quantity,line_total').then((r) => r.data || []), []),
    safe(sb.from('sales_quote_line').select('product_id,quantity').then((r) => r.data || []), []),
    safe(sb.from('stock_movement').select('product_id,type,quantity').is('deleted_at', null).then((r) => r.data || []), []),
  ]);
  const inOrders = ol.filter((l) => String(l.product_id) === pid);
  const inQuotes = ql.filter((l) => String(l.product_id) === pid);
  const moves = sm.filter((m) => String(m.product_id) === pid);
  const soldQty = r2(inOrders.reduce((s, l) => s + Number(l.quantity || 0), 0));
  const soldValue = r2(inOrders.reduce((s, l) => s + Number(l.line_total || 0), 0));
  return {
    cards: [
      { key: 'sold', label: 'Venduto (ordini)', count: inOrders.length, value: soldValue, sub: soldQty + ' pz', route: 'gestione_ordini', icon: '📦' },
      { key: 'quoted', label: 'In preventivi', count: inQuotes.length, value: null, route: 'quotes', icon: '🧾' },
      { key: 'moves', label: 'Movimenti stock', count: moves.length, value: null, route: 'inventory', icon: '🏬' },
    ],
    source: 'righe ordine/preventivo + movimenti stock (dati reali)', error: null,
  };
}
