// INGLY OS V2 — Team & HR UI (live). Anagrafica collaboratori, costo orario.
// CRUD reale, premium, no alert nativi. Dati HR: visibili ai ruoli abilitati.
import * as TEAM from './team.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

export function renderRows(list) {
  if (!list || !list.length) return `<tr><td colspan="5"><div class="v2-empty">Nessun collaboratore.</div></td></tr>`;
  return list.map((m) => `<tr>
    <td>${esc(m.name)}</td><td>${esc(m.role || '—')}</td>
    <td>${esc(m.email || '—')}</td>
    <td class="v2-num">${m.hourly_cost != null ? eur(m.hourly_cost) + '/h' : '—'}</td>
    <td><button class="v2-btn v2-xs" data-edit="${esc(m.id)}">Modifica</button>
      <button class="v2-btn v2-xs v2-danger" data-del="${esc(m.id)}">🗑</button></td></tr>`).join('');
}

export function renderForm(m) {
  m = m || {};
  return `<form class="v2-form" data-team-form="${esc(m.id || '')}">
    <h3>${m.id ? 'Modifica collaboratore' : 'Nuovo collaboratore'}</h3>
    <label>Nome*<input name="name" required value="${esc(m.name || '')}"></label>
    <div class="v2-form-row"><label>Ruolo<input name="role" value="${esc(m.role || '')}" placeholder="laser/grafica/vendite"></label>
      <label>Costo €/h<input name="hourly_cost" type="number" step="0.01" value="${esc(m.hourly_cost != null ? m.hourly_cost : '')}"></label></div>
    <div class="v2-form-row"><label>Email<input name="email" type="email" value="${esc(m.email || '')}"></label>
      <label>Telefono<input name="phone" value="${esc(m.phone || '')}"></label></div>
    <label><input type="checkbox" name="active" ${m.active === false ? '' : 'checked'}> Attivo</label>
    <label>Note<textarea name="notes">${esc(m.notes || '')}</textarea></label>
    <div class="v2-form-actions"><button type="button" class="v2-btn v2-ghost" data-cancel>Annulla</button>
      <button type="submit" class="v2-btn">${m.id ? 'Salva' : 'Crea'}</button></div>
    <div class="v2-form-msg" data-msg></div></form>`;
}

export function mount(container, { sb, ctx }) {
  if (!container) return;
  const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
  const w = TEAM.canWrite(role);
  const tenantId = (ctx || {}).activeTenant || null;
  const root = container.querySelector('[data-team-root]') || container;
  root.innerHTML = `<div data-team-pane>${loading('Carico team…')}</div>`;
  const pane = root.querySelector('[data-team-pane]');

  async function list() {
    pane.innerHTML = loading('Carico team…');
    try {
      const rows = await TEAM.listTeam(sb, {});
      pane.innerHTML = `<div class="v2-toolbar">${w ? '<button class="v2-btn" data-new>+ Nuovo collaboratore</button>' : ''}
          <span class="v2-muted">${rows.length} collaboratori · costo orario medio ${eur(TEAM.avgHourlyCost(rows))}/h</span></div>
        <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
          <th>Nome</th><th>Ruolo</th><th>Email</th><th>€/h</th><th></th></tr></thead>
          <tbody>${renderRows(rows)}</tbody></table></div>`;
      const nw = pane.querySelector('[data-new]'); if (nw) nw.addEventListener('click', () => form());
      pane.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => { const r = (await TEAM.listTeam(sb, {})).find((x) => String(x.id) === b.getAttribute('data-edit')); form(r); }));
      pane.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { try { await TEAM.softDeleteMember(sb, b.getAttribute('data-del')); toast('Eliminato'); list(); } catch (e) { toast(TEAM.friendlyError(e)); } }));
    } catch (e) { pane.innerHTML = errorBox(TEAM.friendlyError(e)); }
  }

  function form(m) {
    pane.innerHTML = renderForm(m);
    const f = pane.querySelector('[data-team-form]');
    pane.querySelector('[data-cancel]').addEventListener('click', list);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      data.active = f.querySelector('[name="active"]').checked;
      const msg = f.querySelector('[data-msg]');
      try { if (m && m.id) await TEAM.updateMember(sb, m.id, data); else await TEAM.createMember(sb, tenantId, data); toast('Salvato'); list(); }
      catch (err) { msg.textContent = TEAM.friendlyError(err); }
    });
  }
  list();
}
