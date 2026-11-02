// INGLY OS V2 — Chatter & Activities (data-layer), pattern Odoo mail.thread.
// Note/messaggi e attività (to-do con scadenza) su QUALUNQUE record via
// (entity_type, entity_id). CRUD reale, RLS/RBAC 'tools.chatter'. Migr. 0037.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

export const ACTIVITY_TYPES = ['todo', 'call', 'email', 'meeting'];
export const ACTIVITY_LABEL = { todo: 'Da fare', call: 'Chiamata', email: 'Email', meeting: 'Incontro' };
const today = () => new Date().toISOString().slice(0, 10);

// Timeline di un record: messaggi + attività, più recenti prima.
export async function listThread(sb, entityType, entityId, opts = {}) {
  const { data, error } = await sb.from('record_note').select('*')
    .eq('entity_type', entityType).eq('entity_id', String(entityId)).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(opts.limit || 200);
  if (error) throw error;
  return data || [];
}

export async function postMessage(sb, tenantId, entityType, entityId, body, author) {
  if (!body || !String(body).trim()) throw new Error('Messaggio vuoto.');
  const row = { tenant_id: tenantId, entity_type: entityType, entity_id: String(entityId), kind: 'message', body: String(body).trim(), author: author || null };
  const { data, error } = await sb.from('record_note').insert(row).select().single();
  if (error) throw error; return data;
}

export async function scheduleActivity(sb, tenantId, entityType, entityId, data) {
  const d = data || {};
  if (!d.body || !String(d.body).trim()) throw new Error('Descrizione attività obbligatoria.');
  const at = ACTIVITY_TYPES.includes(d.activity_type) ? d.activity_type : 'todo';
  const row = { tenant_id: tenantId, entity_type: entityType, entity_id: String(entityId), kind: 'activity', body: String(d.body).trim(), activity_type: at, due_date: d.due_date || null, done: false, author: d.author || null };
  const { data: out, error } = await sb.from('record_note').insert(row).select().single();
  if (error) throw error; return out;
}

export async function completeActivity(sb, id) {
  const { data, error } = await sb.from('record_note').update({ done: true, done_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error; return data;
}

export async function softDeleteNote(sb, id) {
  const { error } = await sb.from('record_note').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}

// Attività aperte del tenant (per il centro "Cose da fare"): scadute e prossime.
export async function listOpenActivities(sb, opts = {}) {
  const { data, error } = await sb.from('record_note').select('*')
    .eq('kind', 'activity').eq('done', false).is('deleted_at', null)
    .order('due_date', { ascending: true }).limit(opts.limit || 200);
  if (error) throw error;
  const rows = data || []; const t = today();
  return rows.map((a) => ({ ...a, overdue: !!a.due_date && a.due_date < t }));
}

// Divide una timeline in messaggi e attività (per il rendering).
export function splitThread(rows) {
  const messages = (rows || []).filter((r) => r.kind === 'message');
  const activities = (rows || []).filter((r) => r.kind === 'activity');
  const t = today();
  const openActs = activities.filter((a) => !a.done).map((a) => ({ ...a, overdue: !!a.due_date && a.due_date < t }));
  const doneActs = activities.filter((a) => a.done);
  return { messages, openActs, doneActs };
}
