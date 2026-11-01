// INGLY OS V2 — Automazioni UI (live). Elenco di automazioni APPLICABILI con un
// pulsante per eseguirle (una alla volta, su click esplicito). Nessuna azione
// automatica: l'utente decide. Mostrabile come card in qualunque pagina.
import * as AU from './automations.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); };

export function renderAutomations(d) {
  if (d.error) return '<div class="v2-errbox">Automazioni non disponibili</div>';
  if (!d.actions.length) return `<div class="v2-card"><h3>⚙️ Automazioni</h3><div class="v2-empty">Nessuna automazione da applicare ora ✅</div>
    <div class="v2-muted" style="font-size:11px">${esc(d.source)}</div></div>`;
  return `<div class="v2-card"><h3>⚙️ Automazioni applicabili (${d.actions.length})</h3>
    <div class="v2-muted" style="font-size:11px;margin-bottom:6px">Suggerite dai dati reali · si eseguono solo se clicchi tu (nessuna azione automatica).</div>
    <div class="rep-alerts">${d.actions.map((a, i) => `<div class="v2-card" style="display:flex;align-items:center;gap:8px">
      <div style="flex:1"><b>${esc(a.title)}</b><div class="v2-muted" style="font-size:11px">${esc(a.rule)} · ${esc(a.source)}</div></div>
      <button class="v2-btn v2-xs" data-auto="${i}">${esc(a.action)}</button></div>`).join('')}</div></div>`;
}

// Monta il pannello automazioni in un host dato. Ricarica dopo ogni esecuzione.
export function mountAutomations(host, { sb, ctx }) {
  if (!host) return;
  const tenantId = (ctx || {}).activeTenant || null;
  async function draw() {
    host.innerHTML = '<div class="v2-loading">⏳ Valuto automazioni…</div>';
    let d;
    try { d = await AU.evaluateAutomations(sb); } catch (e) { host.innerHTML = '<div class="v2-errbox">' + esc(AU.friendlyError(e)) + '</div>'; return; }
    host.innerHTML = renderAutomations(d);
    host.querySelectorAll('[data-auto]').forEach((b) => b.addEventListener('click', async () => {
      const act = d.actions[Number(b.getAttribute('data-auto'))];
      b.disabled = true;
      try { const r = await AU.runAutomation(sb, tenantId, act); toast(r.message); draw(); }
      catch (e) { toast(AU.friendlyError(e)); b.disabled = false; }
    }));
  }
  draw();
}
