// INGLY OS V2 — Sistema & Strumenti UI (live). Report hub, Calendario (agenda
// reale), Brand Identity, Legale, Risorse Laser. Read-only, con fonte.
import * as ST from './systools.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { maximumFractionDigits: 0 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;

export function renderReportHub(d) {
  if (d.error) return errorBox('Report non disponibile');
  return `<div class="v2-kpi-grid">${d.cards.map((c) => `
    <div class="v2-card"><div class="v2-muted">${esc(c.label)}</div>
      <div style="font-size:20px;font-weight:800">${c.unit === '€' ? eur(c.value) : c.value + (c.unit || '')}</div></div>`).join('')}</div>
    ${d.alerts.length ? `<div class="module-header" style="margin-top:12px">Alert</div><div class="rep-alerts">${d.alerts.map((a) => `<div class="v2-card">${esc(a.text)} <span class="v2-muted" style="font-size:11px">· ${esc(a.source)}</span></div>`).join('')}</div>` : ''}
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)} · esportazione completa dal modulo Backup & Export</div>`;
}

export function renderAgenda(d) {
  if (d.error) return errorBox('Calendario non disponibile');
  if (!d.events.length) return `<div class="v2-empty">Nessuna scadenza in agenda. <span class="v2-muted">${esc(d.source)}</span></div>`;
  return `<div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Data</th><th>Evento</th><th>Riferimento</th></tr></thead>
    <tbody>${d.events.map((e) => `<tr title="${esc(e.source)}"><td>${esc(e.date)}</td><td>${esc(e.kind)}</td><td>${esc(e.entity)}</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderLaserResources(d) {
  if (d.error) return errorBox('Risorse non disponibili');
  return `<div class="module-header">Macchine (€/min)</div>
    ${d.machines.length ? `<div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Nome</th><th>Categoria</th><th>€/min</th></tr></thead>
      <tbody>${d.machines.map((m) => `<tr><td>${esc(m.name)}</td><td>${esc(m.category)}</td><td class="v2-num">€${(m.costPerMin || 0).toLocaleString('it-IT', { maximumFractionDigits: 4 })}</td></tr>`).join('')}</tbody></table></div>` : '<div class="v2-empty">Nessuna macchina. Aggiungile in Attrezzature.</div>'}
    <div class="module-header" style="margin-top:12px">Materiali (€/mq)</div>
    ${d.materials.length ? `<div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Nome</th><th>Tipo</th><th>€/mq</th></tr></thead>
      <tbody>${d.materials.map((m) => `<tr><td>${esc(m.name)}</td><td>${esc(m.type)}</td><td class="v2-num">${eur(m.costPerMq)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="v2-empty">Nessun materiale. Aggiungili in Materiali.</div>'}
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderBrand(d) {
  const b = d.brand;
  const row = (label, arr) => `<div class="v2-card"><div class="v2-muted">${esc(label)}</div><div>${arr.map((x) => `<span class="v2-chip">${esc(x)}</span>`).join(' ')}</div></div>`;
  return `<div class="v2-card"><h3>${esc(b.name)}</h3><div class="v2-muted">${esc(b.place)}</div></div>
    <div class="v2-kpi-grid" style="margin-top:10px">
      ${row('Valori', b.values)}${row('Riferimenti UI', b.references)}${row('Tecniche', b.techniques)}${row('Materiali', b.materials)}</div>
    <div class="v2-card" style="margin-top:10px"><div class="v2-muted">Tone of voice</div><div>${esc(b.voice)}</div></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderLegal(d) {
  return `<div class="v2-note">ℹ️ Modelli di testo standard — non costituiscono consulenza legale.</div>
    <div class="rep-alerts" style="margin-top:8px">${d.items.map((t) => `<div class="v2-card"><b>${esc(t.title)}</b><div style="margin-top:4px">${esc(t.body)}</div></div>`).join('')}</div>
    <div class="v2-note" style="margin-top:8px">${esc(d.source)}</div>`;
}

const mkData = (loader, renderer, rootSel, msg) => function mount(container, { sb }) {
  if (!container) return;
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = loading(msg);
  (async () => { try { root.innerHTML = renderer(await loader(sb)); } catch (e) { root.innerHTML = errorBox(ST.friendlyError(e)); } })();
};
const mkStatic = (loader, renderer, rootSel) => function mount(container) {
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = renderer(loader());
};

export const mountReportHub = mkData(ST.loadReportHub, renderReportHub, '[data-reports-root]', 'Carico report…');
export const mountAgenda = mkData(ST.loadAgenda, renderAgenda, '[data-calendar-root]', 'Carico agenda…');
export const mountLaserResources = mkData(ST.loadLaserResources, renderLaserResources, '[data-laserresources-root]', 'Carico risorse…');
export const mountBrand = mkStatic(ST.loadBrand, renderBrand, '[data-brand_identity-root]');
export const mountLegal = mkStatic(ST.loadLegal, renderLegal, '[data-legal-root]');
