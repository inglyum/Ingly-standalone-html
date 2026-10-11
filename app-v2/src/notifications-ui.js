// INGLY OS V2 — Notification Center UI (live). Centro notifiche a EVENTI con
// consegne tracciate. L'adapter è MOCK: SIMULA il workflow, NON invia nulla.
// Ogni esito è etichettato come simulazione; wa.me = apertura manuale (mai
// "delivered" automatico). Premium, no alert/confirm nativi (command §6/§12).
import * as NOTIF from './notifications.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

const STATUS_CHIP = {
  queued: '<span class="v2-chip">In coda</span>',
  processing: '<span class="v2-chip">In lavorazione</span>',
  accepted: '<span class="v2-chip v2-warn">Accettata (non confermata)</span>',
  delivered: '<span class="v2-chip v2-ok">Consegnata (simulata)</span>',
  failed: '<span class="v2-chip v2-danger">Fallita</span>',
  cancelled: '<span class="v2-chip">Annullata</span>',
};

export function renderRows(list) {
  if (!list || !list.length) return `<tr><td colspan="6"><div class="v2-empty">Nessuna notifica. Creane una per esercitare il workflow (mock).</div></td></tr>`;
  return list.map((n) => `<tr>
    <td>${esc(NOTIF.eventLabel(n.event))}</td>
    <td>${esc(n.channel)}</td>
    <td>${esc(n.recipient || '—')}</td>
    <td>${STATUS_CHIP[n.status] || esc(n.status)}</td>
    <td class="v2-num">${esc(n.attempts || 0)}</td>
    <td>
      ${(n.status === 'queued' || n.status === 'failed') ? `<button class="v2-btn v2-xs" data-send="${esc(n.id)}">${n.status === 'failed' ? 'Ritenta (mock)' : 'Invia (mock)'}</button>` : ''}
      <button class="v2-btn v2-xs v2-ghost" data-log="${esc(n.id)}">Dettaglio</button>
      ${(n.status === 'queued') ? `<button class="v2-btn v2-xs v2-ghost" data-cancel="${esc(n.id)}">Annulla</button>` : ''}
      <button class="v2-btn v2-xs v2-danger" data-del="${esc(n.id)}">🗑</button></td></tr>`).join('');
}

export function renderForm() {
  const ev = NOTIF.EVENTS.map((e) => `<option value="${esc(e.key)}">${esc(e.label)}</option>`).join('');
  const ch = NOTIF.CHANNELS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  return `<form class="v2-form" data-notif-form>
    <h3>Nuova notifica</h3>
    <div class="v2-form-row">
      <label>Evento*<select name="event" required>${ev}</select></label>
      <label>Canale*<select name="channel" required>${ch}</select></label></div>
    <label>Destinatario<input name="recipient" placeholder="email / telefono / url webhook"></label>
    <label>Oggetto<input name="subject" placeholder="Oggetto notifica"></label>
    <label>Messaggio<textarea name="body"></textarea></label>
    <div class="v2-form-actions"><button type="button" class="v2-btn v2-ghost" data-cancel>Annulla</button>
      <button type="submit" class="v2-btn">Metti in coda</button></div>
    <div class="v2-form-msg" data-msg></div></form>`;
}

export function mount(container, { sb, ctx }) {
  if (!container) return;
  const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
  const w = NOTIF.canWrite(role);
  const tenantId = (ctx || {}).activeTenant || null;
  const root = container.querySelector('[data-notifications-root]') || container;
  root.innerHTML = `<div data-notif-pane>${loading('Carico notifiche…')}</div>`;
  const pane = root.querySelector('[data-notif-pane]');

  async function list() {
    pane.innerHTML = loading('Carico notifiche…');
    try {
      const rows = await NOTIF.listNotifications(sb, {});
      pane.innerHTML = `
        <div class="v2-note">ℹ️ Adapter <strong>MOCK</strong>: il workflow è <strong>simulato</strong>, nessun invio reale. I provider (email/WhatsApp/webhook) vanno configurati server-side. <em>wa.me</em> = apertura manuale, mai consegna automatica.</div>
        <div class="v2-toolbar">${w ? '<button class="v2-btn" data-new>+ Nuova notifica</button>' : ''}
          <span class="v2-muted">${rows.length} notifiche · consegne tracciate a stati</span></div>
        <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
          <th>Evento</th><th>Canale</th><th>Destinatario</th><th>Stato</th><th>Tentativi</th><th></th></tr></thead>
          <tbody>${renderRows(rows)}</tbody></table></div>
        <div data-notif-detail></div>`;
      const nw = pane.querySelector('[data-new]'); if (nw) nw.addEventListener('click', form);
      pane.querySelectorAll('[data-send]').forEach((b) => b.addEventListener('click', async () => {
        try { const n = (await NOTIF.listNotifications(sb, {})).find((x) => String(x.id) === b.getAttribute('data-send'));
          const out = n.status === 'failed' ? await NOTIF.retry(sb, n) : await NOTIF.processMock(sb, n);
          toast(out.status === 'delivered' ? 'Consegna simulata (mock)' : out.status === 'accepted' ? 'Accettata — consegna non confermata' : 'Fallita: ' + (out.error || '')); list();
        } catch (e) { toast(NOTIF.friendlyError(e)); } }));
      pane.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => { try { await NOTIF.cancel(sb, b.getAttribute('data-cancel')); toast('Annullata'); list(); } catch (e) { toast(NOTIF.friendlyError(e)); } }));
      pane.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { try { await NOTIF.softDeleteNotification(sb, b.getAttribute('data-del')); toast('Eliminata'); list(); } catch (e) { toast(NOTIF.friendlyError(e)); } }));
      pane.querySelectorAll('[data-log]').forEach((b) => b.addEventListener('click', () => detail(b.getAttribute('data-log'))));
    } catch (e) { pane.innerHTML = errorBox(NOTIF.friendlyError(e)); }
  }

  async function detail(id) {
    const box = pane.querySelector('[data-notif-detail]');
    if (!box) return;
    box.innerHTML = loading('Carico tentativi…');
    try {
      const d = await NOTIF.listDeliveries(sb, id);
      box.innerHTML = `<div class="v2-card"><h4>Registro tentativi di consegna (mock)</h4>
        ${d.length ? `<ul class="v2-timeline">${d.map((x) => `<li><strong>${esc(x.status)}</strong> · ${esc(x.provider || '—')} · <span class="v2-muted">${esc(x.at)}</span><br>${esc(x.detail || '')}</li>`).join('')}</ul>` : '<div class="v2-empty">Nessun tentativo ancora.</div>'}</div>`;
    } catch (e) { box.innerHTML = errorBox(NOTIF.friendlyError(e)); }
  }

  function form() {
    pane.innerHTML = renderForm();
    const f = pane.querySelector('[data-notif-form]');
    pane.querySelector('[data-cancel]').addEventListener('click', list);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      const msg = f.querySelector('[data-msg]');
      try { await NOTIF.enqueue(sb, tenantId, data); toast('In coda'); list(); }
      catch (err) { msg.textContent = NOTIF.friendlyError(err); }
    });
  }
  list();
}
