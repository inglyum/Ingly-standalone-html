// INGLY OS V2 — Produzione & Vendite (data-layer). Viste DETERMINISTICHE su dati
// reali: Workflow Overview (ordini di produzione per stato), Vendite & Fatture
// (ordini+fatture), Archivio Vendite (storico consegnati/annullati). Nessuna
// tabella nuova, nessun dato finto, ogni numero con fonte.
import { listProductionOrders, PRODUCTION_STATUSES } from './production.js';
import { listOrders, ORDER_STATUSES } from './orders.js';
import { listInvoices, balanceDue } from './invoices.js';
import { friendlyError } from './crm.js';
export { friendlyError, PRODUCTION_STATUSES, ORDER_STATUSES };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

const STATUS_LABEL = {
  PLANNED: 'Pianificato', IN_PROGRESS: 'In lavorazione', DONE: 'Completato', CANCELLED: 'Annullato',
  CONFIRMED: 'Confermato', IN_PRODUCTION: 'In produzione', READY: 'Pronto', DELIVERED: 'Consegnato',
};
export function statusLabel(s) { return STATUS_LABEL[s] || s; }

// ── 1) WORKFLOW OVERVIEW — ordini di produzione per stato (kanban deterministico).
export async function loadWorkflow(sb) {
  const pos = await safe(listProductionOrders(sb, { limit: 2000 }), []);
  const columns = PRODUCTION_STATUSES.filter((s) => s !== 'CANCELLED').map((s) => ({
    status: s, label: statusLabel(s),
    items: pos.filter((o) => o.status === s).map((o) => ({ number: o.number, product: o.product_name || o.product_id || '—', qty: o.quantity })),
  }));
  const total = pos.filter((o) => o.status !== 'CANCELLED').length;
  const done = pos.filter((o) => o.status === 'DONE').length;
  return { columns, total, done, source: 'production_order per stato (dati reali)', error: null };
}

// ── 2) VENDITE & FATTURE — sintesi ordini e fatture con incassato/da incassare.
export async function loadSalesOverview(sb) {
  const [orders, invoices] = await Promise.all([
    safe(listOrders(sb, { limit: 3000 }), []), safe(listInvoices(sb, { limit: 3000 }), []),
  ]);
  const active = orders.filter((o) => o.status !== 'CANCELLED');
  const revenue = r2(active.reduce((s, o) => s + Number(o.total || 0), 0));
  const ordersByStatus = {};
  for (const o of active) ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  const activeInv = invoices.filter((i) => i.status !== 'CANCELLED');
  const invoiced = r2(activeInv.reduce((s, i) => s + Number(i.total || 0), 0));
  const due = r2(activeInv.reduce((s, i) => s + Math.max(0, balanceDue(i)), 0));
  const collected = r2(invoiced - due);
  return {
    revenue, ordersCount: active.length, ordersByStatus,
    invoiced, collected, due, invoicesCount: activeInv.length,
    source: 'sales_order + sales_invoice (dati reali)', error: null,
  };
}

// ── 3) ARCHIVIO VENDITE — storico ordini consegnati o annullati (sola lettura).
export async function loadSalesArchive(sb) {
  const orders = await safe(listOrders(sb, { limit: 5000 }), []);
  const items = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED')
    .map((o) => ({ number: o.number, customer: o.customer_name || '—', status: o.status, statusLabel: statusLabel(o.status), total: r2(o.total || 0), date: o.order_date || null }))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const delivered = items.filter((o) => o.status === 'DELIVERED');
  const archivedRevenue = r2(delivered.reduce((s, o) => s + o.total, 0));
  return { items, count: items.length, deliveredCount: delivered.length, archivedRevenue, source: 'sales_order storici (DELIVERED/CANCELLED)', error: null };
}
