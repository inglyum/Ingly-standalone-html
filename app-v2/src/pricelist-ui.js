// INGLY OS V2 — Listino cliente UI (live). Card nella scheda Cliente per gestire
// i prezzi/sconti concordati per prodotto; lo Smart Quoter li applica in auto.
// Premium, no alert nativi.
import * as PL from './pricelist.js';
import { listProducts } from './catalog.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€' + (Number(n || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toast = (msg) => { const t = document.createElement('div'); t.className = 'v2-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

export function renderPricelist(entries, products, w) {
  const pname = Object.fromEntries((products || []).map((p) => [String(p.id), p.name]));
  const rows = (entries || []).length ? entries.map((e) => `<tr>
    <td>${esc(pname[String(e.product_id)] || '—')}</td>
    <td class="v2-num">${e.agreed_price != null ? eur(e.agreed_price) : '—'}</td>
    <td class="v2-num">${Number(e.discount_pct) > 0 ? e.discount_pct + '%' : '—'}</td>
    <td>${w ? `<button class="v2-btn v2-xs v2-danger" data-pl-del="${esc(e.id)}">🗑</button>` : ''}</td></tr>`).join('')
    : `<tr><td colspan="4"><div class="v2-empty">Nessun prezzo concordato. Aggiungine uno.</div></td></tr>`;
  const prodOpts = (products || []).map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  return `<div class="v2-card"><h3>💶 Listino concordato</h3>
    <div class="v2-table-wrap"><table class="v2-table"><thead><tr><th>Prodotto</th><th>Prezzo fisso</th><th>Sconto</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    ${w ? `<form class="v2-form" data-pl-form style="margin-top:8px">
      <div class="v2-form-row">
        <label>Prodotto<select name="product_id" required>${prodOpts}</select></label>
        <label>Prezzo fisso €<input name="agreed_price" type="number" step="0.01" placeholder="(opz.)"></label>
        <label>oppure Sconto %<input name="discount_pct" type="number" step="1" min="0" max="95" placeholder="0"></label>
        <button type="submit" class="v2-btn v2-xs">+ Aggiungi</button></div>
      <div class="v2-muted" style="font-size:11px">Imposta un prezzo fisso OPPURE uno sconto % sul listino. Lo Smart Quoter lo applica quando scegli questo cliente.</div>
    </form>` : ''}</div>`;
}

export async function injectCustomerPricelist(sb, ctx, customer, placeholder) {
  if (!placeholder || !customer || !customer.id) return;
  const role = roleForTenant(ctx || {}, (ctx || {}).activeTenant) || '—';
  const w = PL.canWrite(role);
  const tenantId = (ctx || {}).activeTenant || null;
  let products = [];
  try { products = await listProducts(sb, { limit: 1000 }); } catch (_) { products = []; }
  async function draw() {
    let entries = [];
    try { entries = await PL.listForCustomer(sb, customer.id, {}); } catch (e) { placeholder.innerHTML = `<div class="v2-errbox">${esc(PL.friendlyError(e))}</div>`; return; }
    placeholder.innerHTML = renderPricelist(entries, products, w);
    const f = placeholder.querySelector('[data-pl-form]');
    if (f) f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const d = Object.fromEntries(new FormData(f).entries());
      try { await PL.setPrice(sb, tenantId, customer.id, d.product_id, d); toast('Prezzo concordato salvato'); draw(); }
      catch (e) { toast(PL.friendlyError(e)); }
    });
    placeholder.querySelectorAll('[data-pl-del]').forEach((b) => b.addEventListener('click', async () => {
      try { await PL.removePrice(sb, b.getAttribute('data-pl-del')); toast('Rimosso'); draw(); } catch (e) { toast(PL.friendlyError(e)); }
    }));
  }
  draw();
}
