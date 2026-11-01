// INGLY OS V2 — Automazioni deterministiche (data-layer). Pattern Odoo "server
// actions", ma SEMPRE opt-in: il motore SUGGERISCE azioni concrete dai dati
// reali (regole esplicite, nessuna AI) e le esegue SOLO su richiesta esplicita
// (runAutomation). Nessuna esecuzione silenziosa, nessuna modifica automatica
// dei dati (command §6: reversibilità, no effetti nascosti).
import { listOrders } from './orders.js';
import { listQuotes } from './quotes.js';
import { listInvoices } from './invoices.js';
import { convertOrderToInvoice } from './invoices.js';
import { convertQuoteToOrder } from './orders.js';
import { enqueue } from './notifications.js';
import { friendlyError } from './crm.js';
export { friendlyError };

const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

// Valuta le regole sui dati reali e ritorna le azioni APPLICABILI (non eseguite).
export async function evaluateAutomations(sb) {
  const [orders, quotes, invoices] = await Promise.all([
    safe(listOrders(sb, { limit: 3000 }), []), safe(listQuotes(sb, { limit: 3000 }), []),
    safe(listInvoices(sb, { limit: 3000 }), []),
  ]);
  const invByOrder = new Set(invoices.filter((i) => i.order_id).map((i) => String(i.order_id)));
  const orderByQuote = new Set(orders.filter((o) => o.quote_id).map((o) => String(o.quote_id)));
  const actions = [];

  // R1: ordine consegnato (o pronto) senza fattura → crea bozza fattura.
  for (const o of orders) {
    if (o.status === 'CANCELLED') continue;
    if ((o.status === 'DELIVERED' || o.status === 'READY') && !invByOrder.has(String(o.id))) {
      actions.push({ type: 'order_to_invoice', entityId: o.id, title: `Ordine ${o.number || o.id} ${o.status === 'DELIVERED' ? 'consegnato' : 'pronto'} senza fattura`, action: 'Crea fattura', rule: 'R1 · ordine evaso → fattura', source: 'sales_order + sales_invoice' });
    }
  }
  // R2: preventivo accettato senza ordine → crea ordine.
  for (const q of quotes) {
    if (q.status === 'ACCEPTED' && !orderByQuote.has(String(q.id))) {
      actions.push({ type: 'quote_to_order', entityId: q.id, title: `Preventivo ${q.number || q.id} accettato senza ordine`, action: 'Crea ordine', rule: 'R2 · preventivo accettato → ordine', source: 'sales_quote + sales_order' });
    }
  }
  // R3: preventivo inviato in scadenza entro 3 gg → promemoria (notifica in_app).
  const soon = addDays(3); const t = today();
  for (const q of quotes) {
    if (q.status === 'SENT' && q.valid_until && q.valid_until >= t && q.valid_until <= soon) {
      actions.push({ type: 'quote_reminder', entityId: q.id, title: `Preventivo ${q.number || q.id} in scadenza il ${q.valid_until}`, action: 'Crea promemoria', rule: 'R3 · preventivo in scadenza → promemoria', source: 'sales_quote.valid_until', meta: { number: q.number, customer: q.customer_name, valid_until: q.valid_until } });
    }
  }
  return { actions, source: 'regole deterministiche su ordini/preventivi/fatture reali', error: null };
}

// Esegue UNA automazione, su richiesta esplicita dell'utente. Ritorna il
// risultato (record creato / notifica accodata). Nessun effetto implicito.
export async function runAutomation(sb, tenantId, act) {
  if (!act || !act.type) throw new Error('Azione non valida.');
  if (act.type === 'order_to_invoice') { const inv = await convertOrderToInvoice(sb, tenantId, act.entityId); return { ok: true, message: 'Fattura creata: ' + (inv.number || inv.id), goto: 'invoices' }; }
  if (act.type === 'quote_to_order') { const o = await convertQuoteToOrder(sb, tenantId, act.entityId); return { ok: true, message: 'Ordine creato: ' + (o.number || o.id), goto: 'gestione_ordini' }; }
  if (act.type === 'quote_reminder') {
    const m = act.meta || {};
    const n = await enqueue(sb, tenantId, { event: 'subscription_expiring', channel: 'in_app', subject: 'Preventivo in scadenza', body: `Il preventivo ${m.number || ''} (${m.customer || ''}) scade il ${m.valid_until || ''}. Ricontatta il cliente (follow-up 7 gg KB).` });
    return { ok: true, message: 'Promemoria creato (notifica in-app)', goto: 'smartnotif', id: n.id };
  }
  throw new Error('Tipo azione sconosciuto: ' + act.type);
}
