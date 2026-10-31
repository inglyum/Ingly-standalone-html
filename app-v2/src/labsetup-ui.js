// INGLY OS V2 — Lab & Lista Acquisti UI (live). Lista acquisti con costo e stato
// comprato, totale da acquistare. CRUD reale, premium, no alert nativi.
import * as LAB from './labsetup.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };
const PR_COLOR = { low: '#9a9aa2', normal: '#60a5fa', high: '#f87171' };

export function renderRows(list) {
  if (!list || !list.length) return `<tr><td colspan="6"><div class="v2-empty">Lista vuota. Aggiungi ciò che serve al lab.</div></td></tr>`;
  return list.map((i) => `<tr style="${i.bought ? 'opacity:.55' : ''}">
    <td>${esc(i.name)}</td><td>${esc(i.category || '—')}</td>
    <td class="v2-num">${i.quantity}</td><td class="v2-num">${eur(Number(i.quantity || 0) * Number(i.unit_cost || 0))}</td>
    <td>${i.bought ? '<span class="v2-chip v2-ok">Comprato</span>' : `<span style="color:${PR_COLOR[i.priority] || '#9a9aa2'};font-weight:700">${esc(i.priority)}</span>`}</td>
    <td><button class="v2-btn v2-xs" data-toggle="${esc(i.id)}">${i.bought ? '↩︎' : '✓'}</button>
      <button class="v2-btn v2-xs" data-edit="${esc(i.id)}">Modifica</button>
      <button class="v2-btn v2-xs v2-danger" data-del="${esc(i.id)}">🗑</button></td></tr>`).join('');
}

export function renderForm(i) {
  i = i || {};
  const prOpt = LAB.LAB_PRIORITIES.map((p) => `<option value="${p}" ${i.priority === p ? 'selected' : ''}>${esc(p)}</option>`).join('');
  return `<form class="v2-form" data-lab-form="${esc(i.id || '')}">
    <h3>${i.id ? 'Modifica articolo' : 'Nuovo articolo'}</h3>
    <label>Nome*<input name="name" required value="${esc(i.name || '')}"></label>
    <div class="v2-form-row"><label>Categoria<input name="category" value="${esc(i.category || '')}" placeholder="utensili/consumabili"></label>
      <label>Priorità<select name="priority">${prOpt}</select></label></div>
    <div class="v2-form-row"><label>Quantità<input name="quantity" type="number" step="1" value="${esc(i.quantity != null ? i.quantity : 1)}"></label>
      <label>Costo unitario €<input name="unit_cost" type="number" step="0.01" value="${esc(i.unit_cost != null ? i.unit_cost : 0)}"></label></div>
    <label><input type="checkbox" name="bought" ${i.bought ? 'checked' : ''}> Già comprato</label>
    <label>Note<textarea name="notes">${esc(i.notes || '')}</textarea></label>
    <div class="v2-form-actions"><button type="button" class="v2-btn v2-ghost" data-cancel>Annulla</button>
      <button type="submit" class="v2-btn">${i.id ? 'Salva' : 'Crea'}</button></div>
    <div class="v2-form-msg" data-msg></div></form>`;
}

export function mount(container, { sb, ctx }) {
  if (!container) return;
  const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
  const w = LAB.canWrite(role);
  const tenantId = (ctx || {}).activeTenant || null;
  const root = container.querySelector('[data-lab_setup-root]') || container;
  root.innerHTML = `<div data-lab-pane>${loading('Carico lista…')}</div>`;
  const pane = root.querySelector('[data-lab-pane]');

  async function list() {
    pane.innerHTML = loading('Carico lista…');
    try {
      const rows = await LAB.listLabItems(sb, {});
      pane.innerHTML = `<div class="v2-toolbar">${w ? '<button class="v2-btn" data-new>+ Nuovo articolo</button>' : ''}
          <span class="v2-muted">Ancora da acquistare: <b>${eur(LAB.remainingCost(rows))}</b></span></div>
        <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
          <th>Articolo</th><th>Categoria</th><th>Qtà</th><th>Totale</th><th>Stato</th><th></th></tr></thead>
          <tbody>${renderRows(rows)}</tbody></table></div>`;
      const nw = pane.querySelector('[data-new]'); if (nw) nw.addEventListener('click', () => form());
      pane.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', async () => { try { const r = (await LAB.listLabItems(sb, {})).find((x) => String(x.id) === b.getAttribute('data-toggle')); await LAB.updateLabItem(sb, r.id, { bought: !r.bought }); list(); } catch (e) { toast(LAB.friendlyError(e)); } }));
      pane.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => { const r = (await LAB.listLabItems(sb, {})).find((x) => String(x.id) === b.getAttribute('data-edit')); form(r); }));
      pane.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { try { await LAB.softDeleteLabItem(sb, b.getAttribute('data-del')); toast('Eliminato'); list(); } catch (e) { toast(LAB.friendlyError(e)); } }));
    } catch (e) { pane.innerHTML = errorBox(LAB.friendlyError(e)); }
  }

  function form(i) {
    pane.innerHTML = renderForm(i);
    const f = pane.querySelector('[data-lab-form]');
    pane.querySelector('[data-cancel]').addEventListener('click', list);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      data.bought = f.querySelector('[name="bought"]').checked;
      const msg = f.querySelector('[data-msg]');
      try { if (i && i.id) await LAB.updateLabItem(sb, i.id, data); else await LAB.createLabItem(sb, tenantId, data); toast('Salvato'); list(); }
      catch (err) { msg.textContent = LAB.friendlyError(err); }
    });
  }
  list();
}
