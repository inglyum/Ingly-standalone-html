// INGLY OS V2 — Marketing reale UI (live). Marketing Pro (piano+calendario dai
// dati reali) ed Etsy SEO Wizard (ottimizzatore deterministico). Read-only /
// solo input locali. Gli altri moduli marketing restano "non connessi".
import * as MK from './marketingtools.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loading = (m) => `<div class="v2-loading">⏳ ${esc(m || 'Caricamento…')}</div>`;
const errorBox = (m) => `<div class="v2-errbox">⚠️ ${esc(m || 'Errore')}</div>`;
const kindColor = { push: '#22c55e', margin: '#60a5fa', clear: '#fbbf24' };

export function renderMarketingPlan(d) {
  if (d.error) return errorBox('Piano marketing non disponibile');
  return `<div class="module-header">Azioni consigliate (dai dati reali)</div>
    ${d.actions.length ? `<div class="rep-alerts">${d.actions.map((a) => `<div class="v2-card">
      <div><span style="color:${kindColor[a.kind] || '#9a9aa2'};font-weight:700">●</span> <b>${esc(a.title)}</b></div>
      <div style="margin-top:3px">${esc(a.detail)}</div><div class="v2-muted" style="font-size:11px">${esc(a.source)}</div></div>`).join('')}</div>`
      : '<div class="v2-empty">Nessuna azione prioritaria: aggiungi prodotti/vendite per generare il piano.</div>'}
    <div class="module-header" style="margin-top:12px">Calendario editoriale settimanale</div>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Giorno</th><th>Tema</th></tr></thead>
      <tbody>${d.calendar.map((c) => `<tr><td><b>${esc(c.day)}</b></td><td>${esc(c.theme)}</td></tr>`).join('')}</tbody></table></div>
    <div class="v2-note" style="margin-top:8px">ℹ️ ${esc(d.source)}</div>`;
}

export function renderEtsySeo(res) {
  return `<div class="v2-card" style="margin-top:10px">
    <div class="module-header">Titolo ottimizzato <span class="v2-muted">(${res.titleLen}/${MK.ETSY.TITLE_MAX})</span></div>
    <div style="font-weight:700">${esc(res.title) || '<span class="v2-muted">—</span>'}</div>
    ${res.titleTrunc ? '<div class="v2-muted" style="color:#fbbf24;font-size:11px">⚠️ Titolo troncato a 140 caratteri (regola Etsy)</div>' : ''}
    <div class="module-header" style="margin-top:10px">Tag (${res.tags.length}/${MK.ETSY.TAGS_MAX})</div>
    <div>${res.tags.length ? res.tags.map((t) => `<span class="v2-chip">${esc(t)}</span>`).join(' ') : '<span class="v2-muted">—</span>'}</div>
    <div class="module-header" style="margin-top:10px">Checklist SEO · punteggio ${res.score}/100</div>
    <ul class="v2-list">${res.checklist.map((c) => `<li>${c.ok ? '✅' : '⬜'} ${esc(c.label)}</li>`).join('')}</ul>
    <div class="v2-muted" style="font-size:11px">${esc(res.source)}</div></div>`;
}

export function mountMarketing(container, { sb }) {
  if (!container) return;
  const root = container.querySelector('[data-marketing-root]') || container;
  root.innerHTML = loading('Preparo il piano…');
  (async () => { try { root.innerHTML = renderMarketingPlan(await MK.loadMarketingPlan(sb)); } catch (e) { root.innerHTML = errorBox(MK.friendlyError(e)); } })();
}

export function mountEtsySeo(container) {
  const root = container.querySelector('[data-etsy_seo_wizard-root]') || container;
  const fields = [
    { name: 'title', label: 'Titolo prodotto', ph: 'Es. Targa personalizzata matrimonio' },
    { name: 'material', label: 'Materiale', ph: 'legno / plexiglass / acciaio' },
    { name: 'occasion', label: 'Occasione / uso', ph: 'matrimonio / regalo / casa' },
    { name: 'keywords', label: 'Parole chiave (virgola)', ph: 'targa, incisione laser, personalizzato' },
  ];
  const read = () => { const o = {}; root.querySelectorAll('[data-f]').forEach((i) => { o[i.getAttribute('data-f')] = i.value; }); return o; };
  root.innerHTML = `<form class="v2-form" onsubmit="return false">
    <div class="v2-form-grid">${fields.map((f) => `<label>${esc(f.label)}<input data-f="${f.name}" placeholder="${esc(f.ph)}"></label>`).join('')}</div>
    <div data-seo-out>${renderEtsySeo(MK.etsySeo({}))}</div></form>`;
  const out = root.querySelector('[data-seo-out]');
  root.querySelectorAll('[data-f]').forEach((i) => i.addEventListener('input', () => { out.innerHTML = renderEtsySeo(MK.etsySeo(read())); }));
}
