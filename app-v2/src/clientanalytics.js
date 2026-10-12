// INGLY OS V2 — Analisi Clienti (data-layer). Viste DETERMINISTICHE su dati
// reali: segmentazione RFM, CLV, lead scoring, pitch B2B. Nessuna AI simulata,
// nessun dato finto: ogni numero ha una fonte. Dove mancano dati → lista vuota.
import { customerRFM } from './intelligence.js';
import { listOrders } from './orders.js';
import { friendlyError } from './crm.js';
export { friendlyError };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// ── 1) CLIENT INTELLIGENCE — segmentazione RFM completa (riusa intelligence).
export async function loadClientIntel(sb) {
  const rfm = await safe(customerRFM(sb), { items: [] });
  const segs = { Campione: 0, Fedele: 0, Occasionale: 0, 'A rischio': 0 };
  for (const r of rfm.items) segs[r.segment] = (segs[r.segment] || 0) + 1;
  return { items: rfm.items, segments: segs, source: 'CRM/Ordini → RFM per cliente', error: null };
}

// ── 2) CLV — valore storico e proiezione deterministica per cliente.
// CLV storico = somma ordini. Proiezione annua = ticket medio × frequenza/anno
// (frequenza/anno = ordini / anni di relazione, min 1 anno). Nessun modello
// nascosto: è aritmetica spiegabile sui dati reali.
export async function loadClv(sb) {
  const orders = (await safe(listOrders(sb, { limit: 3000 }), [])).filter((o) => o.status !== 'CANCELLED');
  const t = Date.now();
  const by = {};
  for (const o of orders) {
    const k = o.customer_name || '—';
    by[k] = by[k] || { name: k, orders: 0, total: 0, first: '9999-99-99', last: '0000-00-00' };
    by[k].orders += 1; by[k].total += Number(o.total || 0);
    const d = o.order_date || '';
    if (d && d < by[k].first) by[k].first = d;
    if (d > by[k].last) by[k].last = d;
  }
  const items = Object.values(by).map((c) => {
    const avg = c.orders ? r2(c.total / c.orders) : 0;
    const spanDays = c.first <= c.last && c.first !== '9999-99-99' ? Math.max(1, (Date.parse(c.last) - Date.parse(c.first)) / 86400000) : 1;
    const years = Math.max(1, spanDays / 365);
    const freqPerYear = r2(c.orders / years);
    const projectedAnnual = r2(avg * freqPerYear);
    return {
      name: c.name, orders: c.orders, historic: r2(c.total), avgOrder: avg, freqPerYear,
      projectedAnnual, source: `Ordini → ${c.orders} ordini, ticket medio €${avg}, ${freqPerYear}/anno`,
    };
  }).sort((a, b) => b.historic - a.historic).slice(0, 30);
  const totalHistoric = r2(items.reduce((s, c) => s + c.historic, 0));
  return { items, totalHistoric, source: 'sales_order per cliente (storico reale)', error: null };
}

// ── 3) LEAD SCORER — punteggio 0..100 da RFM, con priorità e motivo.
export async function loadLeadScores(sb) {
  const rfm = await safe(customerRFM(sb), { items: [] });
  const items = rfm.items.map((r) => {
    const score = Math.round(((r.R + r.F + r.M) / 9) * 100);
    const priority = score >= 75 ? 'alta' : score >= 50 ? 'media' : 'bassa';
    return { name: r.name, score, priority, segment: r.segment, reason: r.reason, source: r.source };
  }).sort((a, b) => b.score - a.score);
  return { items, source: 'Customer RFM → punteggio normalizzato', error: null };
}

// ── 4) B2B PITCH — bozza di proposta DETERMINISTICA dai dati reali del cliente
// e dai termini KB (markup B2B ×2–2.5, sconti quantità, acconto 50%>€50,
// validità 7gg). È un template compilato con dati reali, NON testo generato da
// un modello: ogni frase è tracciabile. Ritorna le righe della proposta.
export function buildB2BPitch(client) {
  const c = client || {};
  const name = c.name || 'Cliente';
  const historic = r2(c.historic || 0);
  const lines = [
    `Proposta commerciale B2B — ${name}`,
    historic > 0 ? `Storico collaborazione: €${historic} su ${c.orders || 0} ordini.` : 'Nuova collaborazione B2B.',
    'Condizioni dedicate rivendita (listino B2B):',
    '· Prezzi rivendita con margine dedicato (markup B2B ×2–2,5 — KB).',
    '· Sconti quantità: 10+ −10% · 25+ −15% · 50+ −20% (KB).',
    '· Acconto 50% su personalizzati oltre €50 (KB).',
    '· Preventivo scritto, validità 7 giorni (KB).',
    'Niente gara al ribasso: su richiesta aggiungiamo valore (design, finiture), non tagliamo il margine.',
  ];
  return { title: `Pitch B2B — ${name}`, lines, source: 'Dati cliente reali + termini KB (ecommerce-rules)' };
}

// Carica i clienti (via CLV) per popolare la scelta del pitch.
export async function loadPitchCandidates(sb) {
  const clv = await safe(loadClv(sb), { items: [] });
  return { items: clv.items, source: clv.source, error: clv.error };
}
