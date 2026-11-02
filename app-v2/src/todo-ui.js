// INGLY OS V2 — Centro "Cose da fare" (live). Aggrega TUTTE le attività aperte
// (chatter/activities) di ogni record, scadute in evidenza, con "Fatto" e link
// al record. Deterministico, read dai dati reali. Riusa chatter.listOpenActivities.
import * as CH from './chatter.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

// Mappa entity_type → route per aprire il record collegato.
const ROUTE = { customer: 'clients', order: 'gestione_ordini', quote: 'quotes', invoice: 'invoices', project: 'projects', product: 'catalog' };
const ENTITY_LABEL = { customer: 'Cliente', order: 'Ordine', quote: 'Preventivo', invoice: 'Fattura', project: 'Commessa', product: 'Prodotto' };

export function renderTodo(list) {
  if (!list.length) return `<div class="v2-card"><h3>✅ Cose da fare</h3><div class="v2-empty">Nessuna attività aperta. Tutto sotto controllo.</div></div>`;
  const overdue = list.filter((a) => a.overdue);
  const upcoming = list.filter((a) => !a.overdue);
  const row = (a) => `<li class="v2-li-act" style="${a.overdue ? 'color:#f87171' : ''}">
    <span>📌 <b>${esc(CH.ACTIVITY_LABEL[a.activity_type] || 'Da fare')}</b> — ${esc(a.body)}
      <span class="v2-muted">· ${esc(ENTITY_LABEL[a.entity_type] || a.entity_type)}${a.due_date ? ' · scad. ' + esc(a.due_date) : ''}${a.overdue ? ' · SCADUTA' : ''}</span></span>
    <span class="v2-li-btns">${ROUTE[a.entity_type] ? `<button class="v2-btn v2-xs v2-ghost" data-td-go="${esc(a.entity_type)}">Apri</button>` : ''}
      <button class="v2-btn v2-xs" data-td-done="${esc(a.id)}">✓ Fatto</button></span></li>`;
  return `<div class="v2-card"><h3>Cose da fare (${list.length})</h3>
    ${overdue.length ? `<div class="module-header" style="color:#f87171">Scadute (${overdue.length})</div><ul class="v2-list">${overdue.map(row).join('')}</ul>` : ''}
    <div class="module-header" style="margin-top:8px">In programma (${upcoming.length})</div>
    <ul class="v2-list">${upcoming.length ? upcoming.map(row).join('') : '<li class="v2-muted">Nessuna.</li>'}</ul>
    <div class="v2-muted" style="font-size:11px">Attività aperte da tutti i record (chatter) · dati reali</div></div>`;
}

export function mountTodo(host, { sb }) {
  if (!host) return;
  host.innerHTML = `<div class="v2-loading">⏳ Carico attività…</div>`;
  async function draw() {
    try {
      const list = await CH.listOpenActivities(sb, {});
      host.innerHTML = renderTodo(list);
      host.querySelectorAll('[data-td-done]').forEach((b) => b.addEventListener('click', async () => {
        try { await CH.completeActivity(sb, b.getAttribute('data-td-done')); toast('Attività completata'); draw(); } catch (e) { toast(CH.friendlyError(e)); }
      }));
      host.querySelectorAll('[data-td-go]').forEach((b) => b.addEventListener('click', () => { const r = ROUTE[b.getAttribute('data-td-go')]; if (r) location.hash = '#/' + r; }));
    } catch (e) { host.innerHTML = `<div class="v2-errbox">${esc(CH.friendlyError(e))}</div>`; }
  }
  draw();
}
