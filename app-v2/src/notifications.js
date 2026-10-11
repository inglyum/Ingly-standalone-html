// INGLY OS V2 — Notification Center (data-layer). Centro notifiche basato su
// EVENTI con CONSEGNE TRACCIATE a stati distinti. La consegna reale passa da
// adapter server-side (email/WhatsApp/webhook): finché i provider non sono
// configurati, l'adapter MOCK SIMULA il workflow ed è etichettato come
// simulazione — nessun invio reale dichiarato (command §6/§12). wa.me =
// apertura MANUALE, mai "delivered" automatico. Deterministico, RLS/RBAC.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

// EVENTI ufficiali del centro notifiche (command §12).
export const EVENTS = [
  { key: 'subscription_expiring', label: 'Abbonamento in scadenza' },
  { key: 'payment_failed', label: 'Pagamento fallito' },
  { key: 'renewal', label: 'Rinnovo abbonamento' },
  { key: 'plan_change', label: 'Cambio piano' },
  { key: 'password_change', label: 'Cambio password' },
  { key: 'suspicious_login', label: 'Accesso sospetto' },
  { key: 'revoke', label: 'Revoca accesso' },
  { key: 'usage_alert', label: 'Avviso utilizzo' },
  { key: 'custom', label: 'Messaggio personalizzato' },
];
export const CHANNELS = ['in_app', 'email', 'whatsapp', 'webhook'];
// Stati del ciclo di vita: una "accettazione" dal provider NON è una consegna.
export const STATUSES = ['queued', 'processing', 'accepted', 'delivered', 'failed', 'cancelled'];

export function eventLabel(key) {
  const e = EVENTS.find((x) => x.key === key);
  return e ? e.label : key;
}
export function isKnownEvent(key) { return EVENTS.some((e) => e.key === key); }

export async function listNotifications(sb, opts = {}) {
  let q = sb.from('notification').select('*').is('deleted_at', null);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.channel) q = q.eq('channel', opts.channel);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(opts.limit || 500);
  if (error) throw error;
  return data || [];
}

export async function listDeliveries(sb, notificationId) {
  const { data, error } = await sb.from('notification_delivery').select('*')
    .eq('notification_id', notificationId).order('at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Conta i non letti/in coda per il badge nav (in_app ancora da consegnare).
export function unreadCount(rows) {
  return (rows || []).filter((r) => !r.deleted_at && r.channel === 'in_app'
    && (r.status === 'queued' || r.status === 'accepted' || r.status === 'delivered')).length;
}

const CLEAN = ['event', 'channel', 'recipient', 'subject', 'body'];
function sanitize(patch) {
  const out = {};
  for (const k of CLEAN) if (k in patch) out[k] = patch[k];
  if ('channel' in out && !CHANNELS.includes(out.channel)) out.channel = 'in_app';
  return out;
}

// Mette in coda una notifica (stato 'queued'). Nessun invio qui.
export async function enqueue(sb, tenantId, data) {
  const row = { tenant_id: tenantId, status: 'queued', channel: 'in_app', attempts: 0, ...sanitize(data || {}) };
  if (!row.event) throw new Error('Evento obbligatorio.');
  if (!isKnownEvent(row.event)) throw new Error('Evento non riconosciuto: ' + row.event);
  const { data: out, error } = await sb.from('notification').insert(row).select().single();
  if (error) throw error;
  return out;
}

async function recordDelivery(sb, notif, status, provider, detail) {
  const { error } = await sb.from('notification_delivery').insert({
    tenant_id: notif.tenant_id, notification_id: notif.id, provider, status, detail,
  });
  if (error) throw error;
}

async function patchNotif(sb, id, patch) {
  const { data, error } = await sb.from('notification').update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ADAPTER MOCK — SIMULAZIONE deterministica del workflow di consegna.
// NON invia nulla realmente. Serve a esercitare e osservare la macchina a stati
// finché i provider reali (email/WhatsApp/webhook) non sono configurati
// server-side. Non dichiara mai una consegna reale riuscita (command §6).
//
// Regole deterministiche (niente random: osservabile e testabile):
//  - channel 'whatsapp' → 'accepted' (apertura MANUALE wa.me, mai 'delivered').
//  - recipient mancante su email/webhook → 'failed' (errore esplicito).
//  - evento 'suspicious_login' via webhook senza recipient → 'failed'.
//  - altrimenti → 'delivered' (SIMULATO: etichettato come mock nel provider).
function mockOutcome(notif) {
  if (notif.channel === 'whatsapp') {
    return { status: 'accepted', detail: 'wa.me: apertura manuale — consegna NON confermata (mock).' };
  }
  const needsRecipient = notif.channel === 'email' || notif.channel === 'webhook';
  if (needsRecipient && !notif.recipient) {
    return { status: 'failed', detail: 'Destinatario mancante per canale ' + notif.channel + ' (mock).' };
  }
  return { status: 'delivered', detail: 'Consegna SIMULATA (mock): nessun invio reale effettuato.' };
}

// Processa una notifica in coda attraverso la macchina a stati, tracciando ogni
// transizione in notification_delivery. provider='mock' esplicito.
export async function processMock(sb, notif) {
  if (!notif || (notif.status !== 'queued' && notif.status !== 'failed')) {
    throw new Error('Solo notifiche in coda o fallite possono essere processate.');
  }
  const provider = 'mock';
  // queued → processing
  await patchNotif(sb, notif.id, { status: 'processing', provider, attempts: (notif.attempts || 0) + 1 });
  await recordDelivery(sb, notif, 'processing', provider, 'Presa in carico (mock).');
  // processing → esito
  const o = mockOutcome(notif);
  const patch = { status: o.status, provider, error: o.status === 'failed' ? o.detail : null };
  const out = await patchNotif(sb, notif.id, patch);
  await recordDelivery(sb, notif, o.status, provider, o.detail);
  return out;
}

// Ritenta una notifica fallita (riusa processMock; incrementa attempts).
export async function retry(sb, notif) {
  if (!notif || notif.status !== 'failed') throw new Error('Solo le notifiche fallite si possono ritentare.');
  return processMock(sb, notif);
}

export async function cancel(sb, id) {
  const { data, error } = await sb.from('notification')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function softDeleteNotification(sb, id) {
  const { error } = await sb.from('notification').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return true;
}
