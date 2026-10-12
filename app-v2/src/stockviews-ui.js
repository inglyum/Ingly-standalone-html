// INGLY OS V2 — Viste tipizzate magazzino UI (live). Vernici / Componenti /
// Gadget come viste sulla master-data materiali + Supplier Intelligence.
// Read-only, con fonte; link al Magazzino per la gestione stock.
import * as SV from './stockviews.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { maximumFractionDigits: 2 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;

export function renderTyped(d, emptyHint) {
  if (d.error) return errorBox('Vista non disponibile');
  if (!d.items.length) return `<div class="v2-empty">${esc(emptyHint)}<br><span class="v2-muted">${esc(d.source)}</span></div>`;
  return `<div class="v2-toolbar">
      <span class="v2-muted">${d.items.length} voci · valore stock <b>${eur(d.totalValue)}</b>${d.below ? ` · <span style="color:#f87171">${d.below} sotto scorta</span>` : ''}</span>
      <button class="v2-btn v2-ghost v2-xs" data-goto="materials">Gestisci in Materiali →</button></div>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
      <th>Nome</th><th>Tipo</th><th>Disp.</th><th>Costo</th><th>Valore stock</th></tr></thead>
      <tbody>${d.items.map((m) => `<tr title="${esc(m.source)}">
        <td>${esc(m.name)}</td><td>${esc(m.material_type || m.category || '—')}</td>
        <td class="v2-num"${m.below ? ' style="color:#f87171;font-weight:700"' : ''}>${m.available != null ? m.available : '—'}</td>
        <td class="v2-num">${eur(m.cost || 0)}</td><td class="v2-num">${eur(m.stockValue || 0)}</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderSupplierIntel(d) {
  if (d.error) return errorBox('Supplier intelligence non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Nessun acquisto registrato. <span class="v2-muted">${esc(d.source)}</span></div>`;
  return `<div class="v2-toolbar"><span class="v2-muted">Spesa totale <b>${eur(d.totalSpend)}</b> · ${d.suppliersCount} fornitori${d.topShare >= 50 ? ` · <span style="color:#fbbf24">dipendenza dal 1° fornitore: ${d.topShare}%</span>` : ` · concentrazione 1° fornitore ${d.topShare}%`}</span></div>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
      <th>Fornitore</th><th>Ordini</th><th>Spesa</th><th>Ordine medio</th><th>Ultimo</th></tr></thead>
      <tbody>${d.items.map((s) => `<tr title="${esc(s.source)}">
        <td>${esc(s.name)}</td><td class="v2-num">${s.orders}</td><td class="v2-num"><b>${eur(s.spend)}</b></td>
        <td class="v2-num">${eur(s.avgOrder)}</td><td>${esc(s.last || '—')}</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

function goto(root) {
  root.querySelectorAll('[data-goto]').forEach((el) => el.addEventListener('click', () => { const r = el.getAttribute('data-goto'); if (r) location.hash = '#/' + r; }));
}

const mkTyped = (view, rootSel, hint) => function mount(container, { sb }) {
  if (!container) return;
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = loading('Carico vista…');
  (async () => { try { root.innerHTML = renderTyped(await SV.loadTypedStock(sb, view), hint); goto(root); } catch (e) { root.innerHTML = errorBox(SV.friendlyError(e)); } })();
};

export const mountPaints = mkTyped('paint', '[data-paints-root]', 'Nessuna vernice/bomboletta. Aggiungile in Materiali con tipo "vernice".');
export const mountComponents = mkTyped('component', '[data-components-root]', 'Nessun componente. Aggiungili in Materiali con tipo "componente".');
export const mountGadgets = mkTyped('gadget', '[data-gadgets-root]', 'Nessun gadget/accessorio. Aggiungili in Materiali con tipo "gadget/LED".');

export function mountSupplierIntel(container, { sb }) {
  if (!container) return;
  const root = container.querySelector('[data-supplierintel-root]') || container;
  root.innerHTML = loading('Analisi fornitori…');
  (async () => { try { root.innerHTML = renderSupplierIntel(await SV.loadSupplierIntel(sb)); goto(root); } catch (e) { root.innerHTML = errorBox(SV.friendlyError(e)); } })();
}
