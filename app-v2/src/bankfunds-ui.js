// INGLY OS V2 — Bank & Funds UI (live). Conti/fondi con saldo + liquidità totale.
// CRUD reale, premium, no alert nativi. Accesso riservato (RBAC finance.bank).
import * as BF from './bankfunds.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

export function renderRows(list) {
  if (!list || !list.length) return `<tr><td colspan="4"><div class="v2-empty">Nessun conto/fondo.</div></td></tr>`;
  return list.map((a) => `<tr>
    <td>${esc(a.name)}</td><td>${esc(BF.BANK_KIND_LABEL[a.kind] || a.kind)}</td>
    <td class="v2-num"${Number(a.balance) < 0 ? ' style="color:#f87171"' : ''}>${eur(a.balance)}</td>
    <td><button class="v2-btn v2-xs" data-edit="${esc(a.id)}">Modifica</button>
      <button class="v2-btn v2-xs v2-danger" data-del="${esc(a.id)}">🗑</button></td></tr>`).join('');
}

export function renderForm(a) {
  a = a || {};
  const kOpt = BF.BANK_KINDS.map((k) => `<option value="${k}" ${a.kind === k ? 'selected' : ''}>${esc(BF.BANK_KIND_LABEL[k])}</option>`).join('');
  return `<form class="v2-form" data-bf-form="${esc(a.id || '')}">
    <h3>${a.id ? 'Modifica conto' : 'Nuovo conto / fondo'}</h3>
    <label>Nome*<input name="name" required value="${esc(a.name || '')}"></label>
    <div class="v2-form-row"><label>Tipo<select name="kind">${kOpt}</select></label>
      <label>Saldo €<input name="balance" type="number" step="0.01" value="${esc(a.balance != null ? a.balance : 0)}"></label></div>
    <label><input type="checkbox" name="active" ${a.active === false ? '' : 'checked'}> Attivo</label>
    <label>Note<textarea name="notes">${esc(a.notes || '')}</textarea></label>
    <div class="v2-form-actions"><button type="button" class="v2-btn v2-ghost" data-cancel>Annulla</button>
      <button type="submit" class="v2-btn">${a.id ? 'Salva' : 'Crea'}</button></div>
    <div class="v2-form-msg" data-msg></div></form>`;
}

export function mount(container, { sb, ctx }) {
  if (!container) return;
  const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
  const w = BF.canWrite(role);
  const tenantId = (ctx || {}).activeTenant || null;
  const root = container.querySelector('[data-bank_funds-root]') || container;
  root.innerHTML = `<div data-bf-pane>${loading('Carico conti…')}</div>`;
  const pane = root.querySelector('[data-bf-pane]');

  async function list() {
    pane.innerHTML = loading('Carico conti…');
    try {
      const rows = await BF.listAccounts(sb, {});
      pane.innerHTML = `<div class="v2-toolbar">${w ? '<button class="v2-btn" data-new>+ Nuovo conto</button>' : ''}
          <span class="v2-muted">Liquidità totale: <b>${eur(BF.totalLiquidity(rows))}</b></span></div>
        <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
          <th>Nome</th><th>Tipo</th><th>Saldo</th><th></th></tr></thead>
          <tbody>${renderRows(rows)}</tbody></table></div>`;
      const nw = pane.querySelector('[data-new]'); if (nw) nw.addEventListener('click', () => form());
      pane.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => { const r = (await BF.listAccounts(sb, {})).find((x) => String(x.id) === b.getAttribute('data-edit')); form(r); }));
      pane.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { try { await BF.softDeleteAccount(sb, b.getAttribute('data-del')); toast('Eliminato'); list(); } catch (e) { toast(BF.friendlyError(e)); } }));
    } catch (e) { pane.innerHTML = errorBox(BF.friendlyError(e)); }
  }

  function form(a) {
    pane.innerHTML = renderForm(a);
    const f = pane.querySelector('[data-bf-form]');
    pane.querySelector('[data-cancel]').addEventListener('click', list);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      data.active = f.querySelector('[name="active"]').checked;
      const msg = f.querySelector('[data-msg]');
      try { if (a && a.id) await BF.updateAccount(sb, a.id, data); else await BF.createAccount(sb, tenantId, data); toast('Salvato'); list(); }
      catch (err) { msg.textContent = BF.friendlyError(err); }
    });
  }
  list();
}
