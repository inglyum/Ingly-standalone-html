// INGLY OS V2 — Booking UI (live). Prenotazioni con stato. CRUD reale, premium.
import * as BK from './booking.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };
const ST = BK.BOOKING_STATUS_LABEL;

export function renderRows(list) {
  if (!list || !list.length) return `<tr><td colspan="5"><div class="v2-empty">Nessuna prenotazione.</div></td></tr>`;
  return list.map((b) => `<tr>
    <td>${esc(b.slot_date || '—')}${b.slot_time ? ' · ' + esc(b.slot_time) : ''}</td>
    <td>${esc(b.customer_name || '—')}</td><td>${esc(b.service || '—')}</td>
    <td><span class="v2-chip">${esc(ST[b.status] || b.status)}</span></td>
    <td><button class="v2-btn v2-xs" data-edit="${esc(b.id)}">Modifica</button>
      <button class="v2-btn v2-xs v2-danger" data-del="${esc(b.id)}">🗑</button></td></tr>`).join('');
}

export function renderForm(b) {
  b = b || {};
  const stOpt = BK.BOOKING_STATUSES.map((s) => `<option value="${s}" ${b.status === s ? 'selected' : ''}>${esc(ST[s])}</option>`).join('');
  return `<form class="v2-form" data-bk-form="${esc(b.id || '')}">
    <h3>${b.id ? 'Modifica prenotazione' : 'Nuova prenotazione'}</h3>
    <div class="v2-form-row"><label>Cliente<input name="customer_name" value="${esc(b.customer_name || '')}"></label>
      <label>Servizio<input name="service" value="${esc(b.service || '')}" placeholder="consulenza/ritiro/sopralluogo"></label></div>
    <div class="v2-form-row"><label>Data<input name="slot_date" type="date" value="${esc(b.slot_date || '')}"></label>
      <label>Orario<input name="slot_time" placeholder="15:30" value="${esc(b.slot_time || '')}"></label></div>
    <label>Stato<select name="status">${stOpt}</select></label>
    <label>Note<textarea name="notes">${esc(b.notes || '')}</textarea></label>
    <div class="v2-form-actions"><button type="button" class="v2-btn v2-ghost" data-cancel>Annulla</button>
      <button type="submit" class="v2-btn">${b.id ? 'Salva' : 'Crea'}</button></div>
    <div class="v2-form-msg" data-msg></div></form>`;
}

export function mount(container, { sb, ctx }) {
  if (!container) return;
  const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
  const w = BK.canWrite(role);
  const tenantId = (ctx || {}).activeTenant || null;
  const root = container.querySelector('[data-booking-root]') || container;
  root.innerHTML = `<div data-bk-pane>${loading('Carico prenotazioni…')}</div>`;
  const pane = root.querySelector('[data-bk-pane]');

  async function list() {
    pane.innerHTML = loading('Carico prenotazioni…');
    try {
      const rows = await BK.listBookings(sb, {});
      pane.innerHTML = `<div class="v2-toolbar">${w ? '<button class="v2-btn" data-new>+ Nuova prenotazione</button>' : ''}
          <span class="v2-muted">${rows.length} prenotazioni</span></div>
        <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
          <th>Quando</th><th>Cliente</th><th>Servizio</th><th>Stato</th><th></th></tr></thead>
          <tbody>${renderRows(rows)}</tbody></table></div>`;
      const nw = pane.querySelector('[data-new]'); if (nw) nw.addEventListener('click', () => form());
      pane.querySelectorAll('[data-edit]').forEach((bn) => bn.addEventListener('click', async () => { const r = (await BK.listBookings(sb, {})).find((x) => String(x.id) === bn.getAttribute('data-edit')); form(r); }));
      pane.querySelectorAll('[data-del]').forEach((bn) => bn.addEventListener('click', async () => { try { await BK.softDeleteBooking(sb, bn.getAttribute('data-del')); toast('Eliminata'); list(); } catch (e) { toast(BK.friendlyError(e)); } }));
    } catch (e) { pane.innerHTML = errorBox(BK.friendlyError(e)); }
  }

  function form(b) {
    pane.innerHTML = renderForm(b);
    const f = pane.querySelector('[data-bk-form]');
    pane.querySelector('[data-cancel]').addEventListener('click', list);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      const msg = f.querySelector('[data-msg]');
      try { if (b && b.id) await BK.updateBooking(sb, b.id, data); else await BK.createBooking(sb, tenantId, data); toast('Salvato'); list(); }
      catch (err) { msg.textContent = BK.friendlyError(err); }
    });
  }
  list();
}
