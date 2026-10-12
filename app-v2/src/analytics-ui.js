// INGLY OS V2 — Analisi UI (live). 4 viste BI deterministiche con FONTE:
// KPI, Forecaster, Opportunità, Growth Engine. Read-only, nessun controllo finto.
import * as AN from './analytics.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { maximumFractionDigits: 0 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const impColor = { high: '#f87171', medium: '#fbbf24', low: '#9a9aa2' };
const lvlColor = { danger: '#f87171', warn: '#fbbf24', info: '#9a9aa2' };

export function renderKpi(d) {
  if (d.error || !d.items) return errorBox('Dati KPI non disponibili');
  if (!d.items.length) return `<div class="v2-empty">Nessun dato per calcolare i KPI.</div>`;
  return `<div class="v2-kpi-grid">${d.items.map((k) => `
    <div class="v2-card" title="${esc(k.source)}">
      <div class="v2-muted">${esc(k.label)}</div>
      <div style="font-size:22px;font-weight:800;color:${k.status === 'ok' ? '#22c55e' : '#f87171'}">${k.unit === '€' ? eur(k.value) : k.value + (k.unit === '%' ? '%' : '')}</div>
      <div class="v2-muted" style="font-size:11px">Target ${k.unit === '€' ? eur(k.target) : k.target + (k.unit === '%' ? '%' : '')} · ${k.status === 'ok' ? '✅ raggiunto' : '⚠️ sotto'}</div>
      <div class="v2-muted" style="font-size:10px;margin-top:4px">${esc(k.source)}</div>
    </div>`).join('')}</div>`;
}

export function renderForecaster(d) {
  if (d.error) return errorBox('Forecast non disponibile');
  if (!d.sufficient) return `<div class="v2-empty">Dati insufficienti per una proiezione affidabile (servono ordini recenti).</div>`;
  return `<div class="v2-kpi-grid">
    <div class="v2-card"><div class="v2-muted">Ricavo mensile proiettato</div>
      <div style="font-size:22px;font-weight:800;color:${d.onTrack ? '#22c55e' : '#f87171'}">${eur(d.projMonthlyRevenue)}</div>
      <div class="v2-muted" style="font-size:11px">Target ${eur(d.targetMin)}–${eur(d.targetMax)} · ${d.onTrack ? '✅ in linea' : `⚠️ gap ${eur(Math.abs(d.gapToMin))}`}</div></div>
    <div class="v2-card"><div class="v2-muted">Incasso atteso 30 gg</div><div style="font-size:22px;font-weight:800">${eur(d.expectedInflow30)}</div></div>
    <div class="v2-card"><div class="v2-muted">Scaduto da incassare</div><div style="font-size:22px;font-weight:800;color:${d.overdueInflow > 0 ? '#f87171' : '#22c55e'}">${eur(d.overdueInflow)}</div></div>
    <div class="v2-card"><div class="v2-muted">Ordini ultimi 90 gg</div><div style="font-size:22px;font-weight:800">${d.ordersLast90}</div></div>
  </div><div class="v2-note" style="margin-top:10px">ℹ️ ${esc(d.reason)}<br><span class="v2-muted">Fonte: ${esc(d.source)}</span></div>`;
}

export function renderOpportunities(d) {
  if (d.error) return errorBox('Opportunità non disponibili');
  if (!d.items.length) return `<div class="v2-empty">Nessuna opportunità rilevata ora. Buon segno ✅</div>`;
  return `<div class="rep-alerts">${d.items.map((o) => `<div class="v2-card" ${o.link ? `data-goto="${esc(o.link)}" style="cursor:pointer"` : ''}>
    <div style="display:flex;align-items:center;gap:8px"><b>${esc(o.title)}</b>
      <span style="margin-left:auto;font-size:11px;font-weight:700;color:${impColor[o.impact] || '#9a9aa2'}">${esc(o.impact)}</span></div>
    <div style="margin-top:4px">${esc(o.action)}</div>
    <div class="v2-muted" style="font-size:11px;margin-top:4px">${esc(o.source)}</div></div>`).join('')}</div>`;
}

export function renderGrowth(d) {
  if (d.error) return errorBox('Growth engine non disponibile');
  const col = d.score >= 70 ? '#22c55e' : d.score >= 45 ? '#fbbf24' : '#f87171';
  return `<div class="v2-card" style="text-align:center">
    <div class="v2-muted">Growth Score (deterministico)</div>
    <div style="font-size:40px;font-weight:900;color:${col}">${d.score}<span style="font-size:16px">/100</span></div>
    <div class="v2-muted" style="font-size:11px">${esc(d.source)}</div></div>
    <div style="margin-top:12px"><div class="module-header">Opportunità</div>${renderOpportunities({ items: d.opportunities })}</div>
    <div style="margin-top:12px"><div class="module-header">Alert</div>${d.alerts.length ? `<div class="rep-alerts">${d.alerts.map((a) => `<div class="v2-card" ${a.link ? `data-goto="${esc(a.link)}" style="cursor:pointer"` : ''}><span style="color:${lvlColor[a.level] || '#9a9aa2'};font-weight:700">●</span> ${esc(a.text)}<span class="v2-muted" style="font-size:11px"> · ${esc(a.source)}</span></div>`).join('')}</div>` : '<div class="v2-empty">Nessun alert ✅</div>'}</div>`;
}

function goto(root) {
  root.querySelectorAll('[data-goto]').forEach((el) => el.addEventListener('click', () => {
    const r = el.getAttribute('data-goto'); if (r) location.hash = '#/' + r;
  }));
}

function make(loader, renderer, rootSel, loadMsg) {
  return function mount(container, { sb }) {
    if (!container) return;
    const root = container.querySelector(rootSel) || container;
    root.innerHTML = loading(loadMsg);
    (async () => {
      try { const d = await loader(sb); root.innerHTML = renderer(d); goto(root); }
      catch (e) { root.innerHTML = errorBox(AN.friendlyError(e)); }
    })();
  };
}

export const mountKpi = make(AN.loadKpi, renderKpi, '[data-kpi-root]', 'Calcolo KPI…');
export const mountForecaster = make(AN.loadForecaster, renderForecaster, '[data-forecaster-root]', 'Proiezione…');
export const mountOpportunity = make(AN.loadOpportunities, renderOpportunities, '[data-opportunity-root]', 'Analisi opportunità…');
export const mountGrowth = make(AN.loadGrowthEngine, renderGrowth, '[data-growth-root]', 'Growth engine…');
