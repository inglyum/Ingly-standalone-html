// INGLY OS V2 — Smart Quoter: documenti (PDF cliente/interno), condivisione
// WhatsApp e template. Genera HTML stampabile self-contained (CSP-safe, nessuna
// dipendenza). Il PDF CLIENTE non contiene MAI i costi interni.
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => '€ ' + (Number(n || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (s) => esc((s || '').slice(0, 10));

// Template documentali (preset modulari, non copie del vecchio TemplateManager).
// accent = colore testo di marca (leggibile su bianco); hbg/htx = sfondo/testo
// dell'header tabella e delle barre. Premium = brand INGLY oro (header oro +
// testo scuro ad alto contrasto, accent-bar e bordo totale oro).
export const TEMPLATES = {
  standard: { label: 'Preventivo standard', accent: '#111827', hbg: '#111827', htx: '#ffffff', showSpec: false },
  premium: { label: 'Preventivo premium', accent: '#b45309', hbg: '#fbbf24', htx: '#1a1206', showSpec: true },
  b2b: { label: 'Preventivo B2B', accent: '#0f766e', hbg: '#0f766e', htx: '#ffffff', showSpec: true },
  internal: { label: 'Documento interno', accent: '#b91c1c', hbg: '#b91c1c', htx: '#ffffff', showSpec: true },
};

const shell = (title, tpl, body) => `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
  :root{ --accent:${tpl.accent || '#111827'}; --hbg:${tpl.hbg || tpl.accent || '#111827'}; --htx:${tpl.htx || '#ffffff'} }
  *{ box-sizing:border-box } body{ font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#1a1a1a; margin:0; padding:34px 40px; background:#fff; font-size:13px; line-height:1.5 }
  .doc{ max-width:820px; margin:0 auto }
  .head{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px }
  .brand{ font-size:21px; font-weight:800; color:var(--accent) } .brand img{ max-height:52px; display:block; margin-bottom:6px }
  .brand small{ display:block; font-weight:400; color:#555; font-size:11px; line-height:1.5; margin-top:2px }
  .docmeta{ text-align:right } .docmeta h1{ font-size:20px; margin:0 0 6px; letter-spacing:.3px } .docmeta .row{ color:#444; font-size:12px }
  .docmeta .num{ font-weight:700; color:var(--accent) }
  .parties{ display:flex; gap:16px; margin:16px 0 4px }
  .party{ flex:1; background:#f8f9fb; border:1px solid #edf0f4; border-radius:8px; padding:10px 12px }
  .party .lbl{ font-size:10px; text-transform:uppercase; letter-spacing:.5px; color:#8a92a0; font-weight:700 }
  .party b{ font-size:14px } .accentbar{ height:5px; background:var(--hbg); border-radius:3px; margin:4px 0 2px }
  h1{ font-size:18px; margin:0 0 4px } .muted{ color:#666; font-size:12px }
  table{ width:100%; border-collapse:collapse; margin:16px 0 8px; font-size:12.5px }
  th,td{ text-align:left; padding:8px 10px; border-bottom:1px solid #e9ecf1 } thead th{ background:var(--hbg); color:var(--htx); font-weight:700; border:none }
  td.n,th.n{ text-align:right } tbody tr:nth-child(even){ background:#fafbfc }
  .sub{ color:#777; font-size:11px }
  .tot{ margin-top:4px; margin-left:auto; width:300px; font-size:13px }
  .tot div{ display:flex; justify-content:space-between; padding:4px 2px } .tot .tax{ color:#555; font-size:12px }
  .tot .g{ border-top:2px solid var(--hbg); font-weight:800; font-size:16px; margin-top:6px; padding-top:8px } .tot .dep{ color:var(--accent); font-weight:700 }
  .terms{ margin-top:20px; border-top:1px solid #e9ecf1; padding-top:12px }
  .terms h3{ font-size:12px; text-transform:uppercase; letter-spacing:.5px; color:#8a92a0; margin:0 0 6px } .terms p{ margin:3px 0; font-size:11.5px; color:#444 }
  .notes{ margin-top:14px; font-size:12px; color:#444 }
  .footer{ margin-top:22px; text-align:center; color:#9aa2b1; font-size:10.5px; border-top:1px solid #eef1f5; padding-top:10px }
  .badge{ display:inline-block; padding:2px 8px; border-radius:6px; background:var(--hbg); color:var(--htx); font-size:11px }
  @media print{ body{ padding:0 } .noprint{ display:none } }
</style></head><body><div class="doc">${body}</div></body></html>`;

// Intestazione professionale: blocco azienda (logo+dati) + meta documento +
// riquadri Fornitore/Cliente (stile Quotation ERPNext).
function headerBlock(doc, company, title) {
  const addr = [company.address, [company.zip, company.city].filter(Boolean).join(' '), company.country].filter(Boolean).join(', ');
  const fiscal = [company.vat_number && ('P.IVA ' + company.vat_number), company.tax_code && ('CF ' + company.tax_code)].filter(Boolean).join(' · ');
  const contacts = [company.email, company.phone, company.website].filter(Boolean).join(' · ');
  return `<div class="head">
    <div class="brand">${company.logo_url ? `<img src="${esc(company.logo_url)}" alt="">` : ''}${esc(company.company_name || 'INGLY Design')}
      <small>${esc(addr)}${addr && (fiscal || contacts) ? '<br>' : ''}${esc(fiscal)}${fiscal && contacts ? ' · ' : ''}${esc(contacts)}</small></div>
    <div class="docmeta"><h1>${esc(title)}</h1>
      <div class="row"><span class="num">${esc(doc.number || 'Bozza')}</span></div>
      <div class="row">Data: ${day(doc.issue_date) || day(new Date().toISOString())}</div>
      ${doc.valid_until ? `<div class="row">Valido fino al <b>${day(doc.valid_until)}</b></div>` : ''}
    </div></div>
  <div class="accentbar"></div>
  <div class="parties">
    <div class="party"><div class="lbl">Fornitore</div><b>${esc(company.company_name || 'INGLY Design')}</b><div class="sub">${esc(fiscal || addr || '')}</div></div>
    <div class="party"><div class="lbl">Spett.le cliente</div><b>${esc(doc.customer_name || '—')}</b></div>
  </div>`;
}

// Riepilogo imposte (una riga per aliquota) + acconto, stile ERPNext.
function totalsBlock(computed) {
  const taxes = (computed.taxSummary || []).length
    ? computed.taxSummary.map((t) => `<div class="tax"><span>IVA ${t.rate}% su ${eur(t.base)}</span><span>${eur(t.tax)}</span></div>`).join('')
    : `<div class="tax"><span>IVA</span><span>${eur(computed.iva)}</span></div>`;
  return `<div class="tot">
    <div><span>Imponibile</span><span>${eur(computed.imponibile)}</span></div>
    ${taxes}
    <div class="g"><span>TOTALE</span><span>${eur(computed.total)}</span></div>
    ${computed.deposit ? `<div class="dep"><span>Acconto ${computed.depositPct}%</span><span>${eur(computed.deposit)}</span></div>` : ''}
    ${computed.deposit ? `<div class="tax"><span>Saldo alla consegna</span><span>${eur((computed.total || 0) - computed.deposit)}</span></div>` : ''}
  </div>`;
}

// Termini & Condizioni: espliciti dal doc, oppure default KB INGLY.
function termsBlock(doc, company) {
  const lines = doc.terms && String(doc.terms).trim()
    ? String(doc.terms).split('\n').filter((l) => l.trim())
    : [
      'Preventivo valido 7 giorni salvo diversa indicazione.',
      'Acconto 50% su prodotti personalizzati oltre € 50; saldo alla consegna.',
      'Prezzi IVA esclusa salvo diversa indicazione. Tempi di consegna da concordare.',
      'I prodotti personalizzati non sono soggetti a reso salvo difetto di produzione.',
    ];
  return `<div class="terms"><h3>Termini &amp; Condizioni</h3>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
    <div class="footer">${esc(company.company_name || 'INGLY Design')}${company.vat_number ? ' · P.IVA ' + esc(company.vat_number) : ''} — Grazie per la fiducia.</div>`;
}

// PDF CLIENTE — nessun costo interno, solo prezzi/righe/sconti/IVA/totale.
export function clientDocHTML(doc, computed, company = {}, templateKey = 'standard') {
  const tpl = TEMPLATES[templateKey] || TEMPLATES.standard;
  const rows = computed.rows.map((r) => `<tr>
    <td>${esc(r.description || '')}${tpl.showSpec && r.spec ? `<br><span class="muted">${esc(r.spec)}</span>` : ''}</td>
    <td class="n">${r.qty}</td><td class="n">${eur(r.unitPrice)}</td>
    <td class="n">${r.discountPct ? '-' + r.discountPct + '%' : '—'}</td>
    <td class="n">${eur(r.imponibile)}</td></tr>`).join('');
  const title = doc.title && doc.title.trim() ? doc.title : 'Preventivo';
  const body = `${headerBlock(doc, company, 'PREVENTIVO')}
    ${title !== 'Preventivo' ? `<h1 style="margin:14px 0 2px">${esc(title)}</h1>` : ''}
    <table><thead><tr><th>Descrizione</th><th class="n">Q.tà</th><th class="n">Prezzo unit.</th><th class="n">Sconto</th><th class="n">Importo</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">Nessuna riga</td></tr>'}</tbody></table>
    ${totalsBlock(computed)}
    ${doc.notes ? `<div class="notes"><b>Note:</b> ${esc(doc.notes)}</div>` : ''}
    ${termsBlock(doc, company)}`;
  return shell(title, tpl, body);
}

// PDF INTERNO — include breakdown costi, markup, margine (uso interno).
export function internalDocHTML(doc, computed, company = {}) {
  const tpl = TEMPLATES.internal;
  const rows = computed.rows.map((r) => `<tr>
    <td>${esc(r.description || '')}</td><td class="n">${r.qty}</td>
    <td class="n">${eur(r.unitCost)}</td><td class="n">${eur(r.unitPrice)}</td>
    <td class="n">${r.markupPct}%</td><td class="n">${eur(r.margin)}</td><td class="n">${r.marginPct}%</td></tr>`).join('');
  const body = `${headerBlock(doc, company, 'Documento interno — analisi costi')}
    <table><thead><tr><th>Riga</th><th class="n">Q.tà</th><th class="n">Costo unit.</th><th class="n">Prezzo</th><th class="n">Markup</th><th class="n">Margine</th><th class="n">Margine%</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <div class="tot">
      <div><span>Costo totale</span><span>${eur(computed.cost)}</span></div>
      <div><span>Imponibile</span><span>${eur(computed.imponibile)}</span></div>
      <div><span>Margine</span><span>${eur(computed.margin)} (${computed.marginPct}%)</span></div>
      <div class="g"><span>Rischio margine</span><span>${esc((computed.risk || 'low').toUpperCase())}</span></div>
    </div>`;
  return shell('Documento interno', tpl, body);
}

// Riepilogo testuale cliente (per WhatsApp/condivisione) — nessun dato interno.
export function shareText(doc, computed) {
  const lines = computed.rows.filter((r) => r.kind !== 'extra').map((r) => `• ${r.description} x${r.qty} — ${eur(r.imponibile)}`);
  return [
    `*Preventivo ${doc.title || doc.number || ''}*`,
    doc.customer_name ? `Cliente: ${doc.customer_name}` : '',
    ...lines,
    `Totale: ${eur(computed.total)} (IVA inclusa)`,
    doc.valid_until ? `Valido fino al ${day(doc.valid_until)}` : 'Valido 7 giorni',
    'INGLY Design',
  ].filter(Boolean).join('\n');
}

export function whatsappLink(doc, computed, phone) {
  const base = phone ? `https://wa.me/${String(phone).replace(/[^0-9]/g, '')}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(shareText(doc, computed))}`;
}

// Stampa il documento (→ PDF via browser) in modo AFFIDABILE anche quando i
// popup sono bloccati: usa un iframe nascosto same-origin (nessuna finestra),
// con fallback a window.open. Ritorna 'iframe' | 'window' | false così il
// chiamante può dare feedback all'utente (niente bottone "morto").
export function printDoc(html) {
  // 1) Via preferita: iframe nascosto — non richiede popup.
  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow && iframe.contentWindow.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      const go = () => { try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (_) {} setTimeout(() => { try { iframe.remove(); } catch (_) {} }, 1500); };
      // attende il caricamento (immagini/font) prima di stampare
      if (iframe.contentWindow.document.readyState === 'complete') setTimeout(go, 300);
      else iframe.addEventListener('load', () => setTimeout(go, 300), { once: true });
      return 'iframe';
    }
    iframe.remove();
  } catch (_) { /* fallback */ }
  // 2) Fallback: nuova finestra (se il browser la consente).
  try {
    const w = window.open('', '_blank');
    if (!w) return false;
    w.document.open(); w.document.write(html); w.document.close();
    w.focus(); setTimeout(() => { try { w.print(); } catch (_) {} }, 250);
    return 'window';
  } catch (_) { return false; }
}
