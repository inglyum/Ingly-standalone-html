// INGLY OS V2 — Strumenti Preventivi UI (live). Calcolatori Laser/3D/Apparel
// (input locali, risultato live), Listino, Template documenti, Quote Intelligence.
// Deterministici, con fonte. I calcolatori non scrivono nulla.
import * as QT from './quotetools.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;

function f(name, label, step, val) { return `<label>${esc(label)}<input type="number" step="${step || '0.01'}" data-f="${name}" value="${val != null ? val : 0}"></label>`; }

function calcResult(res) {
  return `<div class="v2-card" style="margin-top:10px">
    <div class="module-header">Risultato</div>
    <ul class="v2-list">${res.breakdown.map((b) => `<li>${esc(b.label)}: <b>${eur(b.value)}</b></li>`).join('')}</ul>
    <div style="display:flex;gap:16px;margin-top:6px">
      <div><div class="v2-muted">Costo</div><div style="font-size:18px;font-weight:800">${eur(res.unitCost)}</div></div>
      <div><div class="v2-muted">Prezzo (×2 KB)</div><div style="font-size:18px;font-weight:800;color:#22c55e">${eur(res.price)}</div></div>
    </div><div class="v2-muted" style="font-size:11px;margin-top:4px">${esc(res.source)}</div></div>`;
}

// Calcolatore generico: form di campi + ricalcolo live (aggiorna solo i risultati).
function calcMount(fields, calcFn, rootSel, title) {
  return function mount(container) {
    const root = container.querySelector(rootSel) || container;
    const read = () => { const o = {}; root.querySelectorAll('[data-f]').forEach((i) => { o[i.getAttribute('data-f')] = i.value; }); return o; };
    root.innerHTML = `<form class="v2-form" data-calc onsubmit="return false">
      <div class="v2-form-grid">${fields.map((x) => f(x.name, x.label, x.step, x.val)).join('')}</div>
      <div data-calc-out>${calcResult(calcFn(Object.fromEntries(fields.map((x) => [x.name, x.val]))))}</div></form>`;
    const out = root.querySelector('[data-calc-out]');
    root.querySelectorAll('[data-f]').forEach((i) => i.addEventListener('input', () => { out.innerHTML = calcResult(calcFn(read())); }));
  };
}

export const mountLaser = (c) => calcMount([
  { name: 'mq', label: 'Materiale (mq)', step: '0.01', val: 0.1 },
  { name: 'sfrido_pct', label: 'Sfrido %', step: '1', val: 0 },
  { name: 'cost_per_mq', label: 'Costo materiale €/mq', step: '0.01', val: 12 },
  { name: 'laser_min', label: 'Laser (min)', step: '1', val: 10 },
  { name: 'cost_per_min', label: 'Macchina €/min', step: '0.01', val: 0.45 },
  { name: 'labor_min', label: 'Manodopera (min)', step: '1', val: 15 },
], QT.calcLaser, '[data-lasercalc-root]')(c);

export const mountPrint3D = (c) => calcMount([
  { name: 'grams', label: 'Filamento (g)', step: '1', val: 50 },
  { name: 'cost_per_kg', label: 'Filamento €/kg', step: '0.1', val: 25 },
  { name: 'print_hours', label: 'Ore stampa', step: '0.1', val: 3 },
  { name: 'machine_rate', label: 'Macchina €/h', step: '0.1', val: 1.5 },
  { name: 'labor_min', label: 'Post-lavoro (min)', step: '1', val: 15 },
], QT.calc3D, '[data-print3d-root]')(c);

export const mountApparel = (c) => calcMount([
  { name: 'garment_cost', label: 'Capo €', step: '0.01', val: 6 },
  { name: 'prints', label: 'N° stampe', step: '1', val: 1 },
  { name: 'print_cost', label: 'Costo stampa €', step: '0.01', val: 2.5 },
  { name: 'labor_min', label: 'Manodopera (min)', step: '1', val: 10 },
], QT.calcApparel, '[data-apparel-root]')(c);

export function renderListino(d) {
  if (d.error) return errorBox('Listino non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Catalogo vuoto. Aggiungi prodotti nel Catalogo.</div>`;
  return `<div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Prodotto</th><th>SKU</th><th>Costo</th><th>Prezzo</th><th>Margine</th></tr></thead>
    <tbody>${d.items.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.sku)}</td><td class="v2-num">${eur(p.cost)}</td><td class="v2-num">${eur(p.price)}</td>
      <td class="v2-num"${p.marginPct < 60 ? ' style="color:#fbbf24"' : ''}>${p.marginPct}%</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderTemplates(d) {
  return `<div class="rep-alerts">${d.items.map((t) => `<div class="v2-card">
    <b>${esc(t.name)}</b><div style="margin-top:4px">${esc(t.body)}</div></div>`).join('')}</div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderQuoteIntel(d) {
  if (d.error) return errorBox('Quote intelligence non disponibile');
  if (!d.total) return `<div class="v2-empty">Nessun preventivo registrato.</div>`;
  return `<div class="v2-kpi-grid">
    <div class="v2-card"><div class="v2-muted">Preventivi</div><div style="font-size:20px;font-weight:800">${d.total}</div></div>
    <div class="v2-card"><div class="v2-muted">Conversione</div><div style="font-size:20px;font-weight:800;color:${d.conversion >= 40 ? '#22c55e' : '#f87171'}">${d.conversion}%</div></div>
    <div class="v2-card"><div class="v2-muted">Valore medio</div><div style="font-size:20px;font-weight:800">${eur(d.avgValue)}</div></div>
    <div class="v2-card"><div class="v2-muted">Aperti (bozza/inviati)</div><div style="font-size:20px;font-weight:800">${d.open}</div></div>
  </div><div class="v2-note" style="margin-top:8px">💡 ${esc(d.hint)}<br><span class="v2-muted">Fonte: ${esc(d.source)}</span></div>`;
}

const mkData = (loader, renderer, rootSel, msg) => function mount(container, { sb }) {
  if (!container) return;
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = loading(msg);
  (async () => { try { root.innerHTML = renderer(await loader(sb)); } catch (e) { root.innerHTML = errorBox(QT.friendlyError(e)); } })();
};

export const mountListino = mkData(QT.loadListino, renderListino, '[data-listino-root]', 'Carico listino…');
export const mountTemplates = (container) => { const root = container.querySelector('[data-template_docs-root]') || container; root.innerHTML = renderTemplates(QT.loadTemplates()); };
export const mountQuoteIntel = mkData(QT.loadQuoteIntel, renderQuoteIntel, '[data-quoteintel-root]', 'Analisi preventivi…');
