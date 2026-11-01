// INGLY OS V2 — Strumenti extra UI (live). Tax Calendar, Fiscal, Laser B2B.
// Deterministici, con fonte e limiti dichiarati (SdI reale = integrazione).
import * as EX from './extratools.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;

export function renderTaxCalendar(d) {
  return `<div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Scadenza</th><th>Data</th><th>Tra</th><th>Nota</th></tr></thead>
    <tbody>${d.items.map((x) => `<tr${x.daysTo <= 7 ? ' style="color:#fbbf24;font-weight:600"' : ''}>
      <td>${esc(x.label)}</td><td>${esc(x.date)}</td><td class="v2-num">${x.daysTo} gg</td><td class="v2-muted">${esc(x.note)}</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderFiscal(d) {
  if (d.error) return errorBox('Dati fiscali non disponibili');
  return `<div class="v2-kpi-grid">
    <div class="v2-card"><div class="v2-muted">Incassato (lordo)</div><div style="font-size:20px;font-weight:800">${eur(d.incassato)}</div></div>
    <div class="v2-card"><div class="v2-muted">Imponibile (stima)</div><div style="font-size:20px;font-weight:800">${eur(d.imponibileIncassato)}</div></div>
    <div class="v2-card"><div class="v2-muted">IVA ${d.aliquota}% (stima)</div><div style="font-size:20px;font-weight:800;color:#fbbf24">${eur(d.ivaIncassata)}</div></div>
    <div class="v2-card"><div class="v2-muted">Da incassare</div><div style="font-size:20px;font-weight:800">${eur(d.daIncassare)}</div></div>
  </div><div class="v2-note" style="margin-top:8px">⚠️ ${esc(d.note)}<br><span class="v2-muted">Fonte: ${esc(d.source)}</span></div>`;
}

function f(name, label, step, val) { return `<label>${esc(label)}<input type="number" step="${step || '0.01'}" data-f="${name}" value="${val != null ? val : 0}"></label>`; }
function laserResult(res) {
  return `<div class="v2-card" style="margin-top:10px"><div class="module-header">Risultato B2B</div>
    <ul class="v2-list">${res.breakdown.map((b) => `<li>${esc(b.label)}: <b>${eur(b.value)}</b></li>`).join('')}</ul>
    <div style="display:flex;gap:16px;margin-top:6px">
      <div><div class="v2-muted">Costo</div><div style="font-size:18px;font-weight:800">${eur(res.unitCost)}</div></div>
      <div><div class="v2-muted">Prezzo B2B (×2,5 KB)</div><div style="font-size:18px;font-weight:800;color:#22c55e">${eur(res.price)}</div></div>
    </div><div class="v2-muted" style="font-size:11px;margin-top:4px">${esc(res.source)} · markup B2B KB</div></div>`;
}

export const mountTaxCalendar = (container) => { const root = container.querySelector('[data-taxcalendar-root]') || container; root.innerHTML = renderTaxCalendar(EX.loadTaxCalendar()); };

export function mountFiscal(container, { sb, ctx }) {
  if (!container) return;
  const root = container.querySelector('[data-fiscal-root]') || container;
  const tenantId = (ctx || {}).activeTenant || null;
  root.innerHTML = loading('Carico dati fiscali…');
  (async () => { try { root.innerHTML = renderFiscal(await EX.loadFiscal(sb, tenantId)); } catch (e) { root.innerHTML = errorBox(EX.friendlyError(e)); } })();
}

export function mountLaserB2B(container) {
  const root = container.querySelector('[data-laser_b2b-root]') || container;
  const fields = [
    { name: 'mq', label: 'Materiale (mq)', step: '0.01', val: 0.2 },
    { name: 'cost_per_mq', label: 'Costo materiale €/mq', step: '0.01', val: 12 },
    { name: 'laser_min', label: 'Laser (min)', step: '1', val: 15 },
    { name: 'cost_per_min', label: 'Macchina €/min', step: '0.01', val: 0.45 },
    { name: 'labor_min', label: 'Manodopera (min)', step: '1', val: 20 },
  ];
  const read = () => { const o = {}; root.querySelectorAll('[data-f]').forEach((i) => { o[i.getAttribute('data-f')] = i.value; }); return o; };
  root.innerHTML = `<form class="v2-form" onsubmit="return false">
    <div class="v2-form-grid">${fields.map((x) => f(x.name, x.label, x.step, x.val)).join('')}</div>
    <div data-b2b-out>${laserResult(EX.calcLaserB2B(Object.fromEntries(fields.map((x) => [x.name, x.val]))))}</div></form>`;
  const out = root.querySelector('[data-b2b-out]');
  root.querySelectorAll('[data-f]').forEach((i) => i.addEventListener('input', () => { out.innerHTML = laserResult(EX.calcLaserB2B(read())); }));
}
