// INGLY OS V2 — Statusbar unificata (Odoo-like). Rende la linea di stato con lo
// stato corrente evidenziato e i prossimi stati AMMESSI come pulsanti. Usa il
// motore workflow.js per la validazione. onChange(to) è fornito dal chiamante.
import * as WF from './workflow.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Statusbar: pill lineari (grigie→verde fino allo stato attuale) + pulsanti
// "avanza a" solo per gli stati ammessi. `writable` abilita i pulsanti.
export function renderStatusbar(entity, current, writable) {
  const f = WF.flow(entity); if (!f) return '';
  const linear = f.states.filter((s) => !/cancel|reject|expire/i.test(s));
  const curIdx = WF.progressIndex(entity, current);
  const pills = linear.map((s, i) => {
    const done = curIdx >= 0 && i <= curIdx;
    const isCur = s === current;
    return `<span class="v2-sb-pill${done ? ' v2-sb-done' : ''}${isCur ? ' v2-sb-cur' : ''}" style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;background:${isCur ? '#22c55e' : done ? 'rgba(34,197,94,.25)' : 'var(--bg-card2,#222)'};color:${isCur ? '#06240f' : 'inherit'}">${esc(f.labels[s] || s)}</span>`;
  }).join('<span style="opacity:.4">→</span>');
  const offLine = !linear.includes(current);
  const cur = offLine ? `<span class="v2-sb-pill v2-sb-cur" style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#f87171;color:#2a0b0b">${esc(f.labels[current] || current)}</span>` : '';
  const nexts = writable ? WF.nextStates(entity, current) : [];
  const btns = nexts.map((s) => `<button class="v2-btn v2-xs" data-wf-to="${esc(s)}">→ ${esc(f.labels[s] || s)}</button>`).join(' ');
  return `<div class="v2-statusbar" data-wf="${esc(entity)}" data-wf-cur="${esc(current)}" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0">
    ${cur}${pills}${btns ? `<span style="flex:1"></span>${btns}` : ''}</div>`;
}

// Collega i pulsanti "avanza a": valida e chiama onChange(to) solo se ammessa.
export function wireStatusbar(hostEl, entity, current, onChange, onInvalid) {
  if (!hostEl) return;
  hostEl.querySelectorAll('[data-wf-to]').forEach((b) => b.addEventListener('click', () => {
    const to = b.getAttribute('data-wf-to');
    const v = WF.validateTransition(entity, current, to);
    if (!v.ok) { if (onInvalid) onInvalid(v.reason); return; }
    onChange(to);
  }));
}
