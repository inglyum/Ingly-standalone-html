// INGLY OS V2 — Analisi Clienti UI (live). 4 viste deterministiche con FONTE:
// Client Intelligence (RFM), CLV, Lead Scorer, Pitch B2B. Read-only; il pitch
// è un template compilato con dati reali (nessun testo generato da modello).
import * as CA from './clientanalytics.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { maximumFractionDigits: 0 });
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const segColor = { Campione: '#22c55e', Fedele: '#60a5fa', Occasionale: '#9a9aa2', 'A rischio': '#f87171' };
const priColor = { alta: '#22c55e', media: '#fbbf24', bassa: '#9a9aa2' };

export function renderClientIntel(d) {
  if (d.error) return errorBox('Dati clienti non disponibili');
  if (!d.items.length) return `<div class="v2-empty">Dati insufficienti per la segmentazione (servono ordini).</div>`;
  const chips = Object.entries(d.segments).filter(([, n]) => n > 0).map(([seg, n]) => `<span class="v2-chip" style="color:${segColor[seg] || '#9a9aa2'}">${esc(seg)}: ${n}</span>`).join(' ');
  return `<div class="v2-toolbar">${chips}</div>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
      <th>Cliente</th><th>Segmento</th><th>RFM</th><th>Ordini</th><th>Valore</th></tr></thead>
      <tbody>${d.items.map((r) => `<tr title="${esc(r.reason)} · ${esc(r.source)}">
        <td>${esc(r.name)}</td><td style="color:${segColor[r.segment] || '#9a9aa2'};font-weight:700">${esc(r.segment)}</td>
        <td class="v2-num">${esc(r.rfm)}</td><td class="v2-num">${r.freq}</td><td class="v2-num">${eur(r.monetary)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function renderClv(d) {
  if (d.error) return errorBox('CLV non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Dati insufficienti per il CLV (servono ordini).</div>`;
  return `<div class="v2-toolbar"><span class="v2-muted">CLV storico totale: <b>${eur(d.totalHistoric)}</b> · ${esc(d.source)}</span></div>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr>
      <th>Cliente</th><th>Ordini</th><th>Ticket medio</th><th>Freq/anno</th><th>CLV storico</th><th>Proiezione annua</th></tr></thead>
      <tbody>${d.items.map((c) => `<tr title="${esc(c.source)}">
        <td>${esc(c.name)}</td><td class="v2-num">${c.orders}</td><td class="v2-num">${eur(c.avgOrder)}</td>
        <td class="v2-num">${c.freqPerYear}</td><td class="v2-num"><b>${eur(c.historic)}</b></td>
        <td class="v2-num">${eur(c.projectedAnnual)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function renderLeadScores(d) {
  if (d.error) return errorBox('Lead scoring non disponibile');
  if (!d.items.length) return `<div class="v2-empty">Dati insufficienti per lo scoring (servono ordini).</div>`;
  return `<div class="v2-table-wrap"><table class="v2-table"><thead><tr>
    <th>Cliente</th><th>Punteggio</th><th>Priorità</th><th>Segmento</th></tr></thead>
    <tbody>${d.items.map((r) => `<tr title="${esc(r.reason)} · ${esc(r.source)}">
      <td>${esc(r.name)}</td><td class="v2-num"><b>${r.score}</b>/100</td>
      <td style="color:${priColor[r.priority] || '#9a9aa2'};font-weight:700">${esc(r.priority)}</td>
      <td>${esc(r.segment)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function renderPitch(cands, selected, pitch) {
  const opts = (cands || []).map((c) => `<option value="${esc(c.name)}" ${selected === c.name ? 'selected' : ''}>${esc(c.name)} — ${eur(c.historic)}</option>`).join('');
  return `<div class="v2-toolbar"><label>Cliente
    <select data-pitch-client><option value="">— scegli —</option>${opts}</select></label></div>
    <div data-pitch-out>${pitch ? `<div class="v2-card"><h3>${esc(pitch.title)}</h3>
      <ul class="v2-list">${pitch.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      <div class="v2-muted" style="font-size:11px;margin-top:6px">Fonte: ${esc(pitch.source)}</div></div>`
      : '<div class="v2-empty">Scegli un cliente per generare la bozza di proposta B2B (dati reali + termini KB).</div>'}</div>`;
}

const mk = (loader, renderer, rootSel, msg) => function mount(container, { sb }) {
  if (!container) return;
  const root = container.querySelector(rootSel) || container;
  root.innerHTML = loading(msg);
  (async () => { try { root.innerHTML = renderer(await loader(sb)); } catch (e) { root.innerHTML = errorBox(CA.friendlyError(e)); } })();
};

export const mountClientIntel = mk(CA.loadClientIntel, renderClientIntel, '[data-clientintel-root]', 'Segmentazione…');
export const mountClv = mk(CA.loadClv, renderClv, '[data-clv-root]', 'Calcolo CLV…');
export const mountLeadScorer = mk(CA.loadLeadScores, renderLeadScores, '[data-leadscorer-root]', 'Scoring…');

export function mountB2BPitch(container, { sb }) {
  if (!container) return;
  const root = container.querySelector('[data-b2bpitch-root]') || container;
  root.innerHTML = loading('Carico clienti…');
  (async () => {
    let cands = [];
    try { cands = (await CA.loadPitchCandidates(sb)).items || []; } catch (e) { root.innerHTML = errorBox(CA.friendlyError(e)); return; }
    function draw(selected, pitch) {
      root.innerHTML = renderPitch(cands, selected, pitch);
      const sel = root.querySelector('[data-pitch-client]');
      if (sel) sel.addEventListener('change', () => {
        const client = cands.find((c) => c.name === sel.value);
        draw(sel.value, client ? CA.buildB2BPitch(client) : null);
      });
    }
    draw('', null);
  })();
}
