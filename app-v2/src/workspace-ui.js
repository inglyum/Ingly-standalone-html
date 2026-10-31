// INGLY OS V2 — Workspace Note UI (live). Idee/Innovazione/Strategia/Fiera su
// una tabella (kind). CRUD reale, premium, no alert nativi.
import * as WS from './workspace.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };
const ST_LABEL = { open: 'Aperto', in_progress: 'In corso', done: 'Fatto', archived: 'Archiviato' };
const PR_COLOR = { low: '#9a9aa2', normal: '#60a5fa', high: '#f87171' };

export function renderRows(list) {
  if (!list || !list.length) return `<tr><td colspan="4"><div class="v2-empty">Nessuna voce. Aggiungine una.</div></td></tr>`;
  return list.map((n) => `<tr>
    <td><b>${esc(n.title)}</b>${n.body ? `<div class="v2-muted" style="font-size:11px">${esc(n.body)}</div>` : ''}</td>
    <td><span class="v2-chip">${esc(ST_LABEL[n.status] || n.status)}</span></td>
    <td style="color:${PR_COLOR[n.priority] || '#9a9aa2'};font-weight:700">${esc(n.priority)}</td>
    <td><button class="v2-btn v2-xs" data-edit="${esc(n.id)}">Modifica</button>
      <button class="v2-btn v2-xs v2-danger" data-del="${esc(n.id)}">🗑</button></td></tr>`).join('');
}

export function renderForm(n) {
  n = n || {};
  const stOpt = WS.NOTE_STATUSES.map((s) => `<option value="${s}" ${n.status === s ? 'selected' : ''}>${esc(ST_LABEL[s])}</option>`).join('');
  const prOpt = WS.NOTE_PRIORITIES.map((p) => `<option value="${p}" ${n.priority === p ? 'selected' : ''}>${esc(p)}</option>`).join('');
  return `<form class="v2-form" data-ws-form="${esc(n.id || '')}">
    <h3>${n.id ? 'Modifica' : 'Nuova voce'}</h3>
    <label>Titolo*<input name="title" required value="${esc(n.title || '')}"></label>
    <label>Dettaglio<textarea name="body">${esc(n.body || '')}</textarea></label>
    <div class="v2-form-row"><label>Stato<select name="status">${stOpt}</select></label>
      <label>Priorità<select name="priority">${prOpt}</select></label></div>
    <label>Tag (virgola)<input name="tags" value="${esc(Array.isArray(n.tags) ? n.tags.join(', ') : '')}"></label>
    <div class="v2-form-actions"><button type="button" class="v2-btn v2-ghost" data-cancel>Annulla</button>
      <button type="submit" class="v2-btn">${n.id ? 'Salva' : 'Crea'}</button></div>
    <div class="v2-form-msg" data-msg></div></form>`;
}

// Fabbrica un mount per uno specifico kind (idea/innovation/strategy/fiera).
function makeMount(kind, rootSel) {
  return function mount(container, { sb, ctx }) {
    if (!container) return;
    const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
    const w = WS.canWrite(role);
    const tenantId = (ctx || {}).activeTenant || null;
    const root = container.querySelector(rootSel) || container;
    root.innerHTML = `<div data-ws-pane>${loading('Carico…')}</div>`;
    const pane = root.querySelector('[data-ws-pane]');

    async function list() {
      pane.innerHTML = loading('Carico…');
      try {
        const rows = await WS.listNotes(sb, kind, {});
        pane.innerHTML = `<div class="v2-toolbar">${w ? '<button class="v2-btn" data-new>+ Nuova voce</button>' : ''}
            <span class="v2-muted">${rows.length} voci · ${esc(WS.NOTE_KINDS[kind])}</span></div>
          <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
            <th>Titolo</th><th>Stato</th><th>Priorità</th><th></th></tr></thead>
            <tbody>${renderRows(rows)}</tbody></table></div>`;
        const nw = pane.querySelector('[data-new]'); if (nw) nw.addEventListener('click', () => form());
        pane.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => { const r = (await WS.listNotes(sb, kind, {})).find((x) => String(x.id) === b.getAttribute('data-edit')); form(r); }));
        pane.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { try { await WS.softDeleteNote(sb, b.getAttribute('data-del')); toast('Eliminata'); list(); } catch (e) { toast(WS.friendlyError(e)); } }));
      } catch (e) { pane.innerHTML = errorBox(WS.friendlyError(e)); }
    }

    function form(n) {
      pane.innerHTML = renderForm(n);
      const f = pane.querySelector('[data-ws-form]');
      pane.querySelector('[data-cancel]').addEventListener('click', list);
      f.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const data = Object.fromEntries(new FormData(f).entries());
        const msg = f.querySelector('[data-msg]');
        try { if (n && n.id) await WS.updateNote(sb, n.id, data); else await WS.createNote(sb, tenantId, kind, data); toast('Salvato'); list(); }
        catch (err) { msg.textContent = WS.friendlyError(err); }
      });
    }
    list();
  };
}

export const mountIdeas = makeMount('idea', '[data-ideas-root]');
export const mountInnovation = makeMount('innovation', '[data-innovation-root]');
export const mountStrategy = makeMount('strategy', '[data-strategy-root]');
export const mountFiera = makeMount('fiera', '[data-fiera-root]');
