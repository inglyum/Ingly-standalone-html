// INGLY OS V2 — Workspace Note (data-layer). Idee/Innovazione/Strategia/Fiera
// come viste tipizzate su UNA tabella workspace_note (kind). CRUD reale,
// RLS/RBAC 'tools.workspace'. Nessuna tabella duplicata. Dipende da migr. 0032.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

export const NOTE_KINDS = {
  idea: 'Idee & Ispirazione', innovation: 'Innovazione', strategy: 'Strategia', fiera: 'Fiera Assistant',
};
export const NOTE_STATUSES = ['open', 'in_progress', 'done', 'archived'];
export const NOTE_PRIORITIES = ['low', 'normal', 'high'];

export async function listNotes(sb, kind, opts = {}) {
  let q = sb.from('workspace_note').select('*').is('deleted_at', null);
  if (kind) q = q.eq('kind', kind);
  if (opts.status) q = q.eq('status', opts.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(opts.limit || 500);
  if (error) throw error;
  return data || [];
}

const CLEAN = ['kind', 'title', 'body', 'status', 'priority', 'tags'];
function sanitize(patch) {
  const out = {};
  for (const k of CLEAN) if (k in patch) out[k] = patch[k];
  if ('status' in out && !NOTE_STATUSES.includes(out.status)) out.status = 'open';
  if ('priority' in out && !NOTE_PRIORITIES.includes(out.priority)) out.priority = 'normal';
  if ('tags' in out && typeof out.tags === 'string') out.tags = out.tags.split(',').map((t) => t.trim()).filter(Boolean);
  return out;
}

export async function createNote(sb, tenantId, kind, data) {
  const row = { tenant_id: tenantId, kind, status: 'open', priority: 'normal', ...sanitize(data || {}) };
  if (!NOTE_KINDS[row.kind]) throw new Error('Tipo nota non valido.');
  if (!row.title) throw new Error('Titolo obbligatorio.');
  const { data: out, error } = await sb.from('workspace_note').insert(row).select().single();
  if (error) throw error; return out;
}

export async function updateNote(sb, id, patch) {
  const { data, error } = await sb.from('workspace_note').update({ ...sanitize(patch || {}), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error; return data;
}

export async function softDeleteNote(sb, id) {
  const { error } = await sb.from('workspace_note').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}
