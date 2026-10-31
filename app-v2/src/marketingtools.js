// INGLY OS V2 — Marketing reale (data-layer). SOLO funzioni DETERMINISTICHE su
// dati reali + regole KB: Marketing Pro (piano azioni + calendario da catalogo
// e vendite reali) ed Etsy SEO Wizard (ottimizzatore titolo/tag by regole Etsy).
// NIENTE AI generativa, niente servizi esterni, niente dati finti: i moduli che
// richiederebbero social/immagini/scraping restano "non connessi" (command §6).
import { productIntelligence } from './intelligence.js';
import { friendlyError } from './crm.js';
export { friendlyError };

const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// ── 1) MARKETING PRO — piano azioni + calendario editoriale dai dati reali.
export async function loadMarketingPlan(sb) {
  const pi = await safe(productIntelligence(sb), { best: [], dead: [], highMargin: [] });
  const actions = [];
  for (const p of (pi.best || []).slice(0, 3)) actions.push({ title: `Promuovi best seller: ${p.name}`, detail: `${p.qty} venduti — contenuto social/gallery`, kind: 'push', source: p.source });
  for (const p of (pi.highMargin || []).slice(0, 3)) actions.push({ title: `Spingi alto margine: ${p.name}`, detail: `margine ${p.marginPct}% — ideale per ads/bundle`, kind: 'margin', source: p.source });
  for (const p of (pi.dead || []).slice(0, 3)) actions.push({ title: `Sblocca giacenza: ${p.name}`, detail: `${p.reason} — promo di sblocco (sconto KB 10–20%)`, kind: 'clear', source: p.source });
  // Calendario editoriale deterministico: rotazione settimanale di temi reali.
  const themes = [
    { day: 'Lun', theme: 'Dietro le quinte (lavorazione laser/UV)' },
    { day: 'Mer', theme: (pi.best[0] ? 'Prodotto best seller: ' + pi.best[0].name : 'Prodotto in evidenza') },
    { day: 'Ven', theme: (pi.highMargin[0] ? 'Alto margine: ' + pi.highMargin[0].name : 'Novità / personalizzazioni') },
    { day: 'Sab', theme: 'Recensione cliente / caso reale' },
  ];
  return { actions, calendar: themes, source: 'product intelligence (vendite+margini reali) + regole KB', error: null };
}

// ── 2) ETSY SEO WIZARD — ottimizzatore DETERMINISTICO per regole Etsy:
// titolo ≤140 caratteri, max 13 tag, ogni tag ≤20 caratteri. Nessun modello:
// compone da titolo + materiali + parole chiave + occasione forniti dall'utente.
export const ETSY = { TITLE_MAX: 140, TAGS_MAX: 13, TAG_MAX: 20 };

function cleanTag(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9àèéìòù\s-]/gi, '').trim().replace(/\s+/g, ' ').slice(0, ETSY.TAG_MAX).trim();
}

export function etsySeo(inp = {}) {
  const base = String(inp.title || '').trim();
  const material = String(inp.material || '').trim();
  const occasion = String(inp.occasion || '').trim();
  const words = String(inp.keywords || '').split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
  // Titolo: base + materiale + occasione, deduplicato, capato a 140.
  const titleParts = [base, material && `in ${material}`, occasion && `per ${occasion}`].filter(Boolean);
  let title = titleParts.join(' ').replace(/\s+/g, ' ').trim();
  const titleTrunc = title.length > ETSY.TITLE_MAX;
  if (titleTrunc) title = title.slice(0, ETSY.TITLE_MAX).trim();
  // Tag: da parole chiave + materiale + occasione + termini del titolo, unici.
  const raw = [...words, material, occasion, ...base.split(/\s+/)].map(cleanTag).filter((t) => t.length >= 3);
  const seen = new Set(); const tags = [];
  for (const t of raw) { if (!seen.has(t)) { seen.add(t); tags.push(t); } if (tags.length >= ETSY.TAGS_MAX) break; }
  // Checklist deterministica su regole Etsy/KB.
  const checklist = [
    { ok: base.length > 0, label: 'Titolo presente' },
    { ok: !titleTrunc, label: `Titolo entro ${ETSY.TITLE_MAX} caratteri` },
    { ok: tags.length >= 8, label: 'Almeno 8 tag (consigliato 13)' },
    { ok: tags.every((t) => t.length <= ETSY.TAG_MAX), label: `Ogni tag ≤ ${ETSY.TAG_MAX} caratteri` },
    { ok: !!material, label: 'Materiale indicato' },
    { ok: !!occasion, label: 'Occasione/uso indicato' },
  ];
  const score = Math.round(checklist.filter((c) => c.ok).length / checklist.length * 100);
  return { title, titleLen: title.length, titleTrunc, tags, checklist, score, source: 'Regole Etsy (titolo ≤140, max 13 tag ≤20) + input reali' };
}
