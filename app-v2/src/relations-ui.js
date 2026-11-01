// INGLY OS V2 — Relazioni cross-modulo UI (smart buttons). Rende i conteggi dei
// record collegati come pulsanti che aprono il modulo relativo. Riusabile da
// CRM (cliente) e Catalogo (prodotto). Read-only.
import * as REL from './relations.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { maximumFractionDigits: 0 });

export function renderSmartButtons(rels) {
  if (!rels || rels.error) return '';
  return `<div class="v2-card"><h3>Collegati</h3>
    <div class="v2-smartbtns" style="display:flex;gap:8px;flex-wrap:wrap">
      ${rels.cards.map((c) => `<button class="v2-card v2-smartbtn" data-rel-go="${esc(c.route)}" style="flex:1;min-width:120px;cursor:pointer;text-align:left">
        <div class="v2-muted" style="font-size:11px">${c.icon || ''} ${esc(c.label)}</div>
        <div style="font-size:20px;font-weight:800">${c.count}</div>
        <div class="v2-muted" style="font-size:11px">${c.value != null ? eur(c.value) : (c.sub || '—')}</div>
      </button>`).join('')}
    </div><div class="v2-muted" style="font-size:11px;margin-top:4px">${esc(rels.source)}</div></div>`;
}

function wire(host) {
  host.querySelectorAll('[data-rel-go]').forEach((b) => b.addEventListener('click', () => {
    const r = b.getAttribute('data-rel-go'); if (r) location.hash = '#/' + r;
  }));
}

// Carica e inietta gli smart button nel placeholder dato (async, non-bloccante).
export async function injectCustomerRelations(sb, customer, placeholder) {
  if (!placeholder) return;
  try { const rels = await REL.customerRelations(sb, customer); placeholder.innerHTML = renderSmartButtons(rels); wire(placeholder); }
  catch (_) { placeholder.innerHTML = ''; }
}
export async function injectProductRelations(sb, product, placeholder) {
  if (!placeholder) return;
  try { const rels = await REL.productRelations(sb, product); placeholder.innerHTML = renderSmartButtons(rels); wire(placeholder); }
  catch (_) { placeholder.innerHTML = ''; }
}
