// INGLY OS V2 — Analisi Finanza UI (live). 5 viste deterministiche con FONTE:
// Obiettivi, ProfitScope, ProfitLeak, Revenue Simulator, Dynamic Price.
// Read-only (il simulatore ha solo input locali, non scrive nulla).
import * as FA from './financeanalytics.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { maximumFractionDigits: 0 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const stCol = { ok: '#22c55e', near: '#fbbf24', under: '#f87171' };

export function renderGoals(d) {
  if (d.error) return errorBox('Obiettivi non disponibili');
  return `<div class="v2-kpi-grid">${d.items.map((g) => `
    <div class="v2-card" title="${esc(g.source)}">
      <div class="v2-muted">${esc(g.label)}</div>
      <div style="font-size:20px;font-weight:800">${g.unit === '€' ? eur(g.value) : g.value + g.unit}<span class="v2-muted" style="font-size:12px"> / ${g.unit === '€' ? eur(g.target) : g.target + g.unit}</span></div>
      <div style="height:8px;background:var(--bg-card2,#222);border-radius:4px;overflow:hidden;margin-top:6px">
        <div style="height:100%;width:${Math.min(100, g.progress)}%;background:${stCol[g.status]}"></div></div>
      <div class="v2-muted" style="font-size:11px;margin-top:3px">${g.progress}% · ${g.status === 'ok' ? '✅' : g.status === 'near' ? '🔸' : '⚠️'}</div>
    </div>`).join('')}</div><div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderProfitScope(d) {
  if (d.error) return errorBox('ProfitScope non disponibile');
  return `<div class="v2-kpi-grid">
    <div class="v2-card"><div class="v2-muted">Ricavo commesse</div><div style="font-size:20px;font-weight:800">${eur(d.revenue)}</div></div>
    <div class="v2-card"><div class="v2-muted">Costo</div><div style="font-size:20px;font-weight:800;color:#f87171">${eur(d.cost)}</div></div>
    <div class="v2-card"><div class="v2-muted">Margine</div><div style="font-size:20px;font-weight:800;color:${d.marginPct >= 60 ? '#22c55e' : '#fbbf24'}">${eur(d.margin)} · ${d.marginPct}%</div></div>
  </div>
  <div class="module-header" style="margin-top:12px">Top prodotti per valore</div>
  ${d.top.length ? `<div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Prodotto</th><th>Qtà</th><th>Valore</th></tr></thead>
    <tbody>${d.top.map((p) => `<tr><td>${esc(p.name)}</td><td class="v2-num">${p.qty}</td><td class="v2-num">${eur(p.value)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="v2-empty">Nessuna vendita per prodotto.</div>'}
  <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderProfitLeak(d) {
  if (d.error) return errorBox('ProfitLeak non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Nessuna perdita di margine rilevata ✅</div>`;
  return `<div class="rep-alerts">${d.items.map((l) => `<div class="v2-card">
    <div><b>${esc(l.type)}:</b> ${esc(l.entity)} — ${esc(l.detail)}</div>
    <div style="margin-top:3px">→ ${esc(l.action)}</div>
    <div class="v2-muted" style="font-size:11px;margin-top:3px">${esc(l.source)}</div></div>`).join('')}</div>`;
}

export function renderRevResult(sim) {
  return `<div class="v2-kpi-grid">
      <div class="v2-card"><div class="v2-muted">Nuovo ricavo</div><div style="font-size:20px;font-weight:800">${eur(sim.newRevenue)}</div>
        <div class="v2-muted" style="font-size:11px">${sim.deltaRevenue >= 0 ? '+' : ''}${eur(sim.deltaRevenue)}</div></div>
      <div class="v2-card"><div class="v2-muted">Nuovo margine</div><div style="font-size:20px;font-weight:800;color:${sim.newMarginPct >= 60 ? '#22c55e' : '#fbbf24'}">${eur(sim.newMargin)} · ${sim.newMarginPct}%</div></div>
    </div><div class="v2-note" style="margin-top:8px">ℹ️ ${esc(sim.source)}</div>`;
}

export function renderRevSim(base, sim) {
  return `<div class="v2-card"><div class="v2-muted">Baseline (dati reali)</div>
    <div>Ricavo mensile <b>${eur(base.monthlyRevenue)}</b> · margine <b>${base.marginPct}%</b></div>
    <div class="v2-muted" style="font-size:11px">${esc(base.source)}</div></div>
    <div class="v2-form-row" style="margin-top:10px">
      <label>Variazione volume %<input type="number" step="1" data-sim="volumePct" value="${sim.params.volumePct}"></label>
      <label>Variazione prezzo %<input type="number" step="1" data-sim="pricePct" value="${sim.params.pricePct}"></label></div>
    <div data-revsim-result style="margin-top:10px">${renderRevResult(sim)}</div>`;
}

export function renderDynamicPrice(d) {
  if (d.error) return errorBox('Dynamic Price non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Nessun prodotto con costo impostato. Aggiungi il costo nel Catalogo.</div>`;
  return `<div class="v2-toolbar"><span class="v2-muted">Prezzo suggerito per margine target <b>${d.targetMarginPct}%</b> (KB) · ${esc(d.source)}</span></div>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
      <th>Prodotto</th><th>Costo</th><th>Prezzo attuale</th><th>Margine att.</th><th>Suggerito</th><th>Azione</th></tr></thead>
      <tbody>${d.items.map((p) => `<tr title="${esc(p.source)}">
        <td>${esc(p.name)}</td><td class="v2-num">${eur(p.cost)}</td><td class="v2-num">${eur(p.current)}</td>
        <td class="v2-num"${p.currentMarginPct < d.targetMarginPct ? ' style="color:#f87171"' : ''}>${p.currentMarginPct}%</td>
        <td class="v2-num"><b>${eur(p.suggested)}</b></td>
        <td>${p.action === 'OK' ? '✅' : '<span style="color:#fbbf24;font-weight:700">' + esc(p.action) + '</span>'}</td></tr>`).join('')}</tbody></table></div>`;
}

const mk = (loader, renderer, rootSel, msg) => function mount(container, { sb }) {
  if (!container) return;
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = loading(msg);
  (async () => { try { root.innerHTML = renderer(await loader(sb)); } catch (e) { root.innerHTML = errorBox(FA.friendlyError(e)); } })();
};

export const mountGoals = mk(FA.loadGoals, renderGoals, '[data-goals-root]', 'Carico obiettivi…');
export const mountProfitScope = mk(FA.loadProfitScope, renderProfitScope, '[data-profitscope-root]', 'Analisi redditività…');
export const mountProfitLeak = mk(FA.loadProfitLeak, renderProfitLeak, '[data-profitleak-root]', 'Analisi perdite…');
export const mountDynamicPrice = mk((sb) => FA.loadDynamicPrice(sb), renderDynamicPrice, '[data-dynamicprice-root]', 'Calcolo prezzi…');

export function mountRevSim(container, { sb }) {
  if (!container) return;
  const root = container.querySelector('[data-revsim-root]') || container;
  root.innerHTML = loading('Carico baseline…');
  (async () => {
    let base;
    try { base = await FA.loadRevSimBase(sb); } catch (e) { root.innerHTML = errorBox(FA.friendlyError(e)); return; }
    root.innerHTML = renderRevSim(base, FA.simulateRevenue(base, { volumePct: 0, pricePct: 0 }));
    const out = root.querySelector('[data-revsim-result]');
    root.querySelectorAll('[data-sim]').forEach((inp) => inp.addEventListener('input', () => {
      const sim = FA.simulateRevenue(base, { volumePct: root.querySelector('[data-sim="volumePct"]').value, pricePct: root.querySelector('[data-sim="pricePct"]').value });
      if (out) out.innerHTML = renderRevResult(sim);
    }));
  })();
}
