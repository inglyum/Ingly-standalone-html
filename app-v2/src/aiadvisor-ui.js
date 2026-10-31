// INGLY OS V2 — AI Business UI (live). Business AI/Briefing, AI Coach, Decision
// Engine, Forecasting: intelligenza DETERMINISTICA con fonte (nessun modello
// generativo). I moduli generativi/esterni (Market Agent, Studio AI) restano
// marcati "richiede integrazione" altrove: qui non si finge nulla.
import * as AI from './aiadvisor.js';
import { renderForecaster } from './analytics-ui.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const impColor = { high: '#f87171', medium: '#fbbf24', low: '#9a9aa2' };
const lvlColor = { danger: '#f87171', warn: '#fbbf24', info: '#9a9aa2' };

function goto(root) { root.querySelectorAll('[data-goto]').forEach((el) => el.addEventListener('click', () => { const r = el.getAttribute('data-goto'); if (r) location.hash = '#/' + r; })); }

export function renderBriefing(d) {
  if (d.error) return errorBox('Briefing non disponibile');
  const col = d.score >= 70 ? '#22c55e' : d.score >= 45 ? '#fbbf24' : '#f87171';
  return `<div class="v2-note">ℹ️ Intelligenza <b>deterministica</b>: ogni voce ha una regola e una fonte, nessun testo generato da modello.</div>
    <div class="v2-card" style="text-align:center;margin-top:8px"><div class="v2-muted">Salute business</div>
      <div style="font-size:36px;font-weight:900;color:${col}">${d.score}/100</div></div>
    <div class="module-header" style="margin-top:12px">Prossime mosse</div>
    ${d.nextMoves.length ? `<div class="rep-alerts">${d.nextMoves.map((o) => `<div class="v2-card" ${o.link ? `data-goto="${esc(o.link)}" style="cursor:pointer"` : ''}>
      <div><b>${esc(o.title)}</b> <span style="color:${impColor[o.impact] || '#9a9aa2'};font-weight:700;font-size:11px">${esc(o.impact)}</span></div>
      <div style="margin-top:3px">${esc(o.action)}</div><div class="v2-muted" style="font-size:11px">${esc(o.source)}</div></div>`).join('')}</div>` : '<div class="v2-empty">Nessuna mossa prioritaria ora ✅</div>'}
    <div class="module-header" style="margin-top:12px">Alert</div>
    ${d.alerts.length ? `<div class="rep-alerts">${d.alerts.map((a) => `<div class="v2-card" ${a.link ? `data-goto="${esc(a.link)}" style="cursor:pointer"` : ''}><span style="color:${lvlColor[a.level] || '#9a9aa2'};font-weight:700">●</span> ${esc(a.text)} <span class="v2-muted" style="font-size:11px">· ${esc(a.source)}</span></div>`).join('')}</div>` : '<div class="v2-empty">Nessun alert ✅</div>'}
    <div class="v2-note" style="margin-top:8px">Fonte: ${esc(d.source)}</div>`;
}

export function renderCoach(d) {
  if (d.error) return errorBox('Coach non disponibile');
  if (d.allOk) return `<div class="v2-empty">Tutti i KPI sono in linea con la KB ✅ Ottimo lavoro.</div>`;
  return `<div class="rep-alerts">${d.tips.map((t) => `<div class="v2-card" title="${esc(t.source)}">
    <div><b>${esc(t.kpi)}</b>: ${t.unit === '€' ? '€' + t.value : t.value + t.unit} <span class="v2-muted">(target ${t.unit === '€' ? '€' + t.target : t.target + t.unit})</span></div>
    <div style="margin-top:4px">💡 ${esc(t.advice)}</div>
    <div class="v2-muted" style="font-size:11px;margin-top:3px">${esc(t.source)}</div></div>`).join('')}</div>`;
}

export function renderDecisions(d) {
  if (d.error) return errorBox('Decision engine non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Nessuna decisione urgente ora ✅</div>`;
  return `<div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Decisione</th><th>Perché</th><th>Impatto</th></tr></thead>
    <tbody>${d.items.map((x) => `<tr ${x.link ? `data-goto="${esc(x.link)}" style="cursor:pointer"` : ''} title="${esc(x.source)}">
      <td><b>${esc(x.decision)}</b></td><td>${esc(x.why)}</td>
      <td style="color:${impColor[x.impact] || '#9a9aa2'};font-weight:700">${esc(x.impact)}</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

const mk = (loader, renderer, rootSel, msg) => function mount(container, { sb }) {
  if (!container) return;
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = loading(msg);
  (async () => { try { root.innerHTML = renderer(await loader(sb)); goto(root); } catch (e) { root.innerHTML = errorBox(AI.friendlyError(e)); } })();
};

export const mountBriefing = mk(AI.loadBriefing, renderBriefing, '[data-ai-root]', 'Preparo il briefing…');
export const mountBizAi = mk(AI.loadBriefing, renderBriefing, '[data-bizai-root]', 'Preparo il briefing…');
export const mountCoach = mk(AI.loadCoach, renderCoach, '[data-aicoach-root]', 'Analizzo i KPI…');
export const mountDecision = mk(AI.loadDecisions, renderDecisions, '[data-decision-root]', 'Valuto le decisioni…');
export const mountForecasting = mk(AI.loadForecaster, renderForecaster, '[data-forecasting-root]', 'Proiezione…');
