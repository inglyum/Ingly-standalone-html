// INGLY OS V2 — Chatter & Activities UI (live), pattern Odoo. Componente
// riusabile: timeline messaggi + attività aperte (con "Fatto") + compose.
// Iniettabile in qualunque scheda record. Premium, no alert nativi.
import * as CH from './chatter.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };
const when = (s) => { try { return new Date(s).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return s || ''; } };

export function renderChatter(rows, w) {
  const { messages, openActs, doneActs } = CH.splitThread(rows);
  const actLi = (a) => `<li class="v2-li-act" style="${a.overdue ? 'color:#f87171' : ''}">
    <span>📌 <b>${esc(CH.ACTIVITY_LABEL[a.activity_type] || 'Da fare')}</b> — ${esc(a.body)}${a.due_date ? ` <span class="v2-muted">(scad. ${esc(a.due_date)}${a.overdue ? ' · scaduta' : ''})</span>` : ''}</span>
    ${w ? `<span class="v2-li-btns"><button class="v2-btn v2-xs" data-ch-done="${esc(a.id)}">✓ Fatto</button></span>` : ''}</li>`;
  const msgLi = (m) => `<li><span class="v2-muted" style="font-size:11px">${esc(m.author || '—')} · ${esc(when(m.created_at))}</span><br>${esc(m.body)}</li>`;
  return `<div class="v2-card"><h3>💬 Note & Attività</h3>
    ${w ? `<div class="v2-chatter-compose">
      <div class="v2-form-row"><input data-ch-msg placeholder="Scrivi una nota…" style="flex:2">
        <button class="v2-btn v2-xs" data-ch-post>Nota</button></div>
      <details style="margin-top:6px"><summary class="v2-muted" style="cursor:pointer;font-size:12px">+ Pianifica attività</summary>
        <div class="v2-form-row" style="margin-top:6px">
          <select data-ch-atype>${CH.ACTIVITY_TYPES.map((t) => `<option value="${t}">${esc(CH.ACTIVITY_LABEL[t])}</option>`).join('')}</select>
          <input data-ch-adesc placeholder="Cosa fare…" style="flex:2">
          <input data-ch-adue type="date">
          <button class="v2-btn v2-xs" data-ch-sched>Pianifica</button></div></details>
    </div>` : ''}
    ${openActs.length ? `<div class="module-header" style="margin-top:10px">Attività aperte (${openActs.length})</div><ul class="v2-list">${openActs.map(actLi).join('')}</ul>` : ''}
    <div class="module-header" style="margin-top:10px">Cronologia</div>
    <ul class="v2-list">${messages.length ? messages.map(msgLi).join('') : '<li class="v2-muted">Nessuna nota ancora.</li>'}</ul>
    ${doneActs.length ? `<details style="margin-top:6px"><summary class="v2-muted" style="cursor:pointer;font-size:12px">Attività completate (${doneActs.length})</summary><ul class="v2-list">${doneActs.map((a) => `<li class="v2-muted">✓ ${esc(a.body)}</li>`).join('')}</ul></details>` : ''}
  </div>`;
}

// Inietta e gestisce il chatter in un placeholder, per un record dato.
export function mountChatter(placeholder, { sb, ctx, entityType, entityId }) {
  if (!placeholder || !entityId) return;
  const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
  const w = CH.canWrite(role);
  const tenantId = (ctx || {}).activeTenant || null;
  const author = (ctx || {}).email || null;
  placeholder.innerHTML = loading('Carico note…');
  async function draw() {
    try {
      const rows = await CH.listThread(sb, entityType, entityId, {});
      placeholder.innerHTML = renderChatter(rows, w);
      const post = placeholder.querySelector('[data-ch-post]');
      if (post) post.addEventListener('click', async () => {
        const inp = placeholder.querySelector('[data-ch-msg]');
        try { await CH.postMessage(sb, tenantId, entityType, entityId, inp.value, author); draw(); }
        catch (e) { toast(CH.friendlyError(e)); }
      });
      const sched = placeholder.querySelector('[data-ch-sched]');
      if (sched) sched.addEventListener('click', async () => {
        try { await CH.scheduleActivity(sb, tenantId, entityType, entityId, { activity_type: placeholder.querySelector('[data-ch-atype]').value, body: placeholder.querySelector('[data-ch-adesc]').value, due_date: placeholder.querySelector('[data-ch-adue]').value || null, author }); toast('Attività pianificata'); draw(); }
        catch (e) { toast(CH.friendlyError(e)); }
      });
      placeholder.querySelectorAll('[data-ch-done]').forEach((b) => b.addEventListener('click', async () => {
        try { await CH.completeActivity(sb, b.getAttribute('data-ch-done')); toast('Attività completata'); draw(); }
        catch (e) { toast(CH.friendlyError(e)); }
      }));
    } catch (e) { placeholder.innerHTML = `<div class="v2-errbox">${esc(CH.friendlyError(e))}</div>`; }
  }
  draw();
}
