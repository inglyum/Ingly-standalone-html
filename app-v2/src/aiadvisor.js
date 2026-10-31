// INGLY OS V2 — AI Business (data-layer). "AI" qui = intelligenza DETERMINISTICA
// e spiegabile sui dati reali, NON un modello generativo. Ogni consiglio ha una
// regola esplicita e una fonte (command: no AI finta). Compone i motori già
// esistenti: analytics (KPI/forecast/opportunità/growth) + intelligence (alert).
import { loadKpi, loadGrowthEngine, loadOpportunities, loadForecaster, KPI_TARGETS } from './analytics.js';
import { businessAlerts } from './intelligence.js';
import { friendlyError } from './crm.js';
export { friendlyError, loadForecaster };

const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// ── BUSINESS AI / BRIEFING — sintesi operativa: score + alert + prossime mosse.
export async function loadBriefing(sb) {
  const [growth, alerts] = await Promise.all([
    safe(loadGrowthEngine(sb), { score: 0, opportunities: [], alerts: [] }),
    safe(businessAlerts(sb), { items: [] }),
  ]);
  return {
    score: growth.score,
    nextMoves: (growth.opportunities || []).slice(0, 5),
    alerts: (alerts.items || []).slice(0, 6),
    source: 'growth engine + business alerts (deterministico, con fonte)',
    error: null,
  };
}

// ── AI COACH — per ogni KPI sotto target, un consiglio con regola KB esplicita.
const COACH_RULES = {
  avgTicket: 'Alza il ticket: proponi upsell/bundle e minimi psicologici KB (portachiavi €6,90, cake topper €24,90…).',
  conversion: 'Conversione sotto il 40% (KB): qualifica prima del prezzo (3 domande) e follow-up entro 7 gg.',
  monthMargin: 'Margine sotto il 60% (KB): rivedi costi/markup, niente gara al ribasso — aggiungi valore.',
  revenue: 'Ricavi sotto target: spingi riordini (−10% KB) sui clienti fedeli e riattiva quelli a rischio.',
};
export async function loadCoach(sb) {
  const kpi = await safe(loadKpi(sb), { items: [] });
  const tips = (kpi.items || []).filter((k) => k.status !== 'ok').map((k) => ({
    kpi: k.label, value: k.value, target: k.target, unit: k.unit,
    advice: COACH_RULES[k.key] || 'Migliora questo indicatore verso il target KB.',
    source: k.source,
  }));
  const allOk = tips.length === 0;
  return { tips, allOk, kpis: kpi.items || [], source: 'KPI reali vs target KB · regole esplicite', error: kpi.error || null };
}

// ── DECISION ENGINE — decisioni ordinate per impatto, con motivo e azione.
export async function loadDecisions(sb) {
  const [opp, alerts] = await Promise.all([
    safe(loadOpportunities(sb), { items: [] }), safe(businessAlerts(sb), { items: [] }),
  ]);
  const rank = { high: 3, medium: 2, low: 1 };
  const fromOpp = (opp.items || []).map((o) => ({ decision: o.action, why: o.title, impact: o.impact, source: o.source, link: o.link }));
  const fromAlert = (alerts.items || []).filter((a) => a.level === 'danger').map((a) => ({ decision: 'Intervieni subito', why: a.text, impact: 'high', source: a.source, link: a.link }));
  const items = [...fromAlert, ...fromOpp].sort((a, b) => (rank[b.impact] || 0) - (rank[a.impact] || 0));
  return { items, source: 'opportunità + alert (deterministico)', error: null };
}

export { KPI_TARGETS };
