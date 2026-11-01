// INGLY OS V2 — Produzione & Vendite UI (live). Workflow Overview, Vendite &
// Fatture, Archivio Vendite. Read-only, con fonte. Link ai moduli operativi.
import * as SO from './salesops.js';
import { mountAutomations } from './automations-ui.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { maximumFractionDigits: 0 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;

export function renderWorkflow(d) {
  if (d.error) return errorBox('Workflow non disponibile');
  return `<div class="v2-toolbar"><span class="v2-muted">${d.total} ordini di produzione attivi · ${d.done} completati · ${esc(d.source)}</span>
    <button class="v2-btn v2-ghost v2-xs" data-goto="production">Apri Produzione →</button></div>
    <div class="v2-kanban" style="display:flex;gap:10px;flex-wrap:wrap">${d.columns.map((c) => `
      <div class="v2-card" style="flex:1;min-width:180px">
        <div class="module-header">${esc(c.label)} (${c.items.length})</div>
        ${c.items.length ? c.items.map((o) => `<div class="v2-chip" style="display:block;margin:4px 0">${esc(o.number)} · ${esc(o.product)} ×${o.qty}</div>`).join('') : '<div class="v2-empty">—</div>'}
      </div>`).join('')}</div>
    <div data-wf-automations style="margin-top:12px"></div>`;
}

export function renderSalesOverview(d) {
  if (d.error) return errorBox('Vendite non disponibili');
  return `<div class="v2-kpi-grid">
    <div class="v2-card"><div class="v2-muted">Ricavo ordini</div><div style="font-size:20px;font-weight:800">${eur(d.revenue)}</div><div class="v2-muted" style="font-size:11px">${d.ordersCount} ordini</div></div>
    <div class="v2-card"><div class="v2-muted">Fatturato</div><div style="font-size:20px;font-weight:800">${eur(d.invoiced)}</div><div class="v2-muted" style="font-size:11px">${d.invoicesCount} fatture</div></div>
    <div class="v2-card"><div class="v2-muted">Incassato</div><div style="font-size:20px;font-weight:800;color:#22c55e">${eur(d.collected)}</div></div>
    <div class="v2-card"><div class="v2-muted">Da incassare</div><div style="font-size:20px;font-weight:800;color:${d.due > 0 ? '#f87171' : '#22c55e'}">${eur(d.due)}</div></div>
  </div>
  <div class="module-header" style="margin-top:12px">Ordini per stato</div>
  <div class="v2-toolbar">${Object.entries(d.ordersByStatus).map(([s, n]) => `<span class="v2-chip">${esc(SO.statusLabel(s))}: ${n}</span>`).join(' ') || '<span class="v2-muted">Nessun ordine</span>'}</div>
  <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderSalesArchive(d) {
  if (d.error) return errorBox('Archivio non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Nessun ordine archiviato (consegnato o annullato).</div>`;
  return `<div class="v2-toolbar"><span class="v2-muted">${d.count} archiviati · ${d.deliveredCount} consegnati · ricavo storico <b>${eur(d.archivedRevenue)}</b></span></div>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Numero</th><th>Cliente</th><th>Stato</th><th>Totale</th><th>Data</th></tr></thead>
      <tbody>${d.items.map((o) => `<tr><td>${esc(o.number)}</td><td>${esc(o.customer)}</td>
        <td>${o.status === 'DELIVERED' ? '<span class="v2-chip v2-ok">' + esc(o.statusLabel) + '</span>' : '<span class="v2-chip">' + esc(o.statusLabel) + '</span>'}</td>
        <td class="v2-num">${eur(o.total)}</td><td>${esc(o.date || '—')}</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

function goto(root) { root.querySelectorAll('[data-goto]').forEach((el) => el.addEventListener('click', () => { const r = el.getAttribute('data-goto'); if (r) location.hash = '#/' + r; })); }

const mk = (loader, renderer, rootSel, msg) => function mount(container, { sb }) {
  if (!container) return;
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = loading(msg);
  (async () => { try { root.innerHTML = renderer(await loader(sb)); goto(root); } catch (e) { root.innerHTML = errorBox(SO.friendlyError(e)); } })();
};

export function mountWorkflow(container, { sb, ctx }) {
  if (!container) return;
  const root = container.querySelector('[data-workflow_dashboard-root]') || container;
  root.innerHTML = loading('Carico workflow…');
  (async () => {
    try {
      root.innerHTML = renderWorkflow(await SO.loadWorkflow(sb)); goto(root);
      mountAutomations(root.querySelector('[data-wf-automations]'), { sb, ctx }); // automazioni applicabili
    } catch (e) { root.innerHTML = errorBox(SO.friendlyError(e)); }
  })();
}
export const mountSalesOverview = mk(SO.loadSalesOverview, renderSalesOverview, '[data-sales-root]', 'Carico vendite…');
export const mountSalesArchive = mk(SO.loadSalesArchive, renderSalesArchive, '[data-sales_archive-root]', 'Carico archivio…');
