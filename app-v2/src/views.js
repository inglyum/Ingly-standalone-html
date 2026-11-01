// INGLY OS V2 — viste dei moduli. I 4 moduli prioritari riproducono l'IA reale
// di v96 (tab, toolbar, tabelle, kanban) con stati vuoti onesti; gli altri
// mostrano una pagina "non ancora connessa a V2" (nessun controllo finto).
import { findModule } from './modules.js';
import { roleForTenant } from './context.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// bottone che richiede backend → marcato esplicitamente, non finto-funzionante
const nyc = (label) => `<button class="v2-btn v2-nyc" disabled title="Non ancora connesso a V2">${esc(label)} <span class="v2-nyc-tag">non ancora connesso</span></button>`;
const empty = (msg) => `<div class="v2-empty">${esc(msg)}</div>`;
const head = (m, sub) => `<div class="v2-page-head"><div><h2>${m.icon} ${esc(m.n)}</h2>
  <div class="v2-muted">${esc(sub || '')}</div></div><div class="v2-page-actions" data-actions></div></div>`;

function tabs(id, items, active) {
  return `<div class="v2-tabs" data-tabs="${id}">${items.map(([k, l]) =>
    `<button class="v2-tab${k === active ? ' active' : ''}" data-tab="${k}">${esc(l)}</button>`).join('')}</div>`;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────
function viewDashboard(ctx) {
  return `${head({ icon: '📊', n: 'Dashboard ROI' }, 'Panoramica business · tenant ' + esc(ctx.activeTenant || '—'))}
    <div data-dash-pane><div class="v2-loading">⏳ Inizializzazione dashboard…</div></div>`;
}

// ── CRM CLIENTI (live: montato dal router via crm-ui.js) ───────────────────
function viewClients() {
  return `${head({ icon: '👥', n: 'CRM Clienti' }, 'Clienti · contatti · attività · connesso a Supabase')}
    <div data-crm-root><div data-crm-pane><div class="v2-loading">⏳ Inizializzazione CRM…</div></div></div>`;
}

// ── CATALOGO (live: montato dal router via catalog-ui.js) ──────────────────
function viewCatalog() {
  return `${head({ icon: '📚', n: 'Catalogo' }, 'Prodotti · servizi · pricing · connesso a Supabase')}
    <div data-catalog-root><div class="v2-loading">⏳ Inizializzazione catalogo…</div></div>`;
}

// ── ORDINI & WORKFLOW (live: montato dal router via orders-ui.js) ──────────
function viewOrders() {
  return `${head({ icon: '📦', n: 'Ordini & Workflow' }, 'Kanban ordini · da preventivo · connesso a Supabase')}
    <div data-orders-root><div class="v2-loading">⏳ Inizializzazione ordini…</div></div>`;
}

// ── MODULI CHE RICHIEDONO INTEGRAZIONE ESTERNA ───────────────────────────
// Onestà (command §6): niente controlli finti. Questi moduli dipendono da un
// servizio esterno/generativo non configurato: mostriamo cosa serve e cosa
// sbloccano, NON un'interfaccia che finge di funzionare.
const INTEGRATION = {
  social: { service: 'API social (Meta/Instagram/TikTok)', unlocks: 'pubblicazione e metriche post' },
  socialstudio: { service: 'Generatore contenuti/immagini AI', unlocks: 'creazione post multi-formato' },
  etsy: { service: 'API Etsy (OAuth negozio)', unlocks: 'sincronizzazione listini e ordini Etsy' },
  etsy_pulse: { service: 'API Etsy', unlocks: 'metriche vendite/visite in tempo reale' },
  etsyai: { service: 'API Etsy + AI', unlocks: 'ottimizzazioni automatiche listing' },
  trendscanner: { service: 'Fonte dati trend (es. Google Trends)', unlocks: 'scansione trend di mercato' },
  demand_map: { service: 'Dati geografici/vendite esterni', unlocks: 'mappa della domanda' },
  product_hunter: { service: 'Dati marketplace esterni', unlocks: 'scouting prodotti' },
  live_intel: { service: 'Feed dati esterni', unlocks: 'intelligence in tempo reale' },
  price_radar: { service: 'Scraping/API prezzi concorrenti', unlocks: 'monitoraggio prezzi' },
  photostudio: { service: 'Generatore immagini AI', unlocks: 'foto prodotto generate' },
  imagelib: { service: 'Storage media (bucket)', unlocks: 'libreria immagini' },
  contentperf: { service: 'API social/analytics', unlocks: 'performance dei contenuti' },
  replyai: { service: 'Modello generativo + casella messaggi', unlocks: 'bozze di risposta' },
  socialproof: { service: 'Fonte recensioni esterne', unlocks: 'raccolta social proof' },
  marketintel: { service: 'Dati di mercato esterni', unlocks: 'market intelligence' },
  competitors: { service: 'Scraping/API concorrenti', unlocks: 'monitoraggio competitor' },
  market_agent: { service: 'Agente AI + fonti dati esterne', unlocks: 'analisi di mercato autonoma' },
  studio_ai: { service: 'Generatore immagini/video AI', unlocks: 'studio creativo AI' },
  xmlsdi: { service: 'Provider SdI / fatturazione elettronica', unlocks: 'invio XML allo SdI' },
  scanner: { service: 'Fotocamera/scanner dispositivo', unlocks: 'scansione scontrini/spese' },
  barcode: { service: 'Fotocamera/lettore barcode dispositivo', unlocks: 'lettura codici a barre prodotti' },
};
export const INTEGRATION_KEYS = Object.keys(INTEGRATION);

function viewIntegration(section) {
  const m = findModule(section) || { icon: '🔌', n: section, group: '' };
  const info = INTEGRATION[section];
  return `${head(m, 'Categoria: ' + esc(m.group))}
    <div class="v2-card">
      <div class="v2-badge-nyc">Non ancora connesso · richiede integrazione</div>
      <p>Questo modulo fornirebbe: <b>${esc(info.unlocks)}</b>.</p>
      <p>Per attivarlo serve un servizio esterno: <b>${esc(info.service)}</b>. In coerenza con le
      regole del progetto, non viene mostrata un'interfaccia dimostrativa che finge di funzionare:
      la sezione resta onesta finché l'integrazione non è configurata.</p>
      <p class="v2-muted">Route: <code>#/${esc(section)}</code> · fornisci le credenziali/accessi per abilitarlo.</p>
    </div>`;
}

// ── GENERICO (modulo non ancora connesso) ────────────────────────────────
function viewGeneric(section) {
  const m = findModule(section) || { icon: '📦', n: section, group: '' };
  return `${head(m, 'Categoria: ' + esc(m.group))}
    <div class="v2-card">
      <div class="v2-badge-nyc">Modulo non ancora connesso a V2</div>
      <p>Questo modulo esiste nell'ERP attuale (v96, categoria <b>${esc(m.group)}</b>) ed è
      registrato nella navigazione V2. La sua interfaccia sarà ricostruita in una
      prossima iterazione, con i dati serviti da Supabase (staging).</p>
      <p class="v2-muted">Route: <code>#/${esc(section)}</code> · Sezione v96: <code>${esc(section)}</code></p>
    </div>`;
}

function viewQuotes() {
  return `${head({ icon: '🧾', n: 'Preventivi' }, 'Preventivi · righe · totali · validità 7gg · connesso a Supabase')}
    <div data-quotes-root><div class="v2-loading">⏳ Inizializzazione preventivi…</div></div>`;
}

function viewInvoices() {
  return `${head({ icon: '🧮', n: 'Fatture' }, 'Fatture · imponibile/IVA · scadenze · connesso a Supabase')}
    <div data-invoices-root><div class="v2-loading">⏳ Inizializzazione fatture…</div></div>`;
}

function viewAging() {
  return `${head({ icon: '⏰', n: 'Scadenziario' }, 'Scadenze incassi · aging · derivato dalle fatture')}
    <div data-aging-root><div class="v2-loading">⏳ Inizializzazione scadenziario…</div></div>`;
}

function viewSuppliers() {
  return `${head({ icon: '\u{1F69A}', n: 'Fornitori' }, 'Anagrafica fornitori \u00b7 ciclo passivo \u00b7 connesso a Supabase')}
    <div data-suppliers-root><div class="v2-loading">\u23f3 Inizializzazione fornitori\u2026</div></div>`;
}

function viewPurchases() {
  return `${head({ icon: '\u{1F6D2}', n: 'Acquisti' }, 'Ordini di acquisto \u00b7 fornitori \u00b7 ricezione prevista \u00b7 connesso a Supabase')}
    <div data-purchases-root><div class="v2-loading">\u23f3 Inizializzazione acquisti\u2026</div></div>`;
}

function viewWarehouse() {
  return `${head({ icon: '\u{1F5C4}', n: 'Magazzino' }, 'Giacenze \u00b7 movimenti \u00b7 valore stock \u00b7 connesso a Supabase')}
    <div data-warehouse-root><div class="v2-loading">\u23f3 Inizializzazione magazzino\u2026</div></div>`;
}

function viewProjects() {
  return `${head({ icon: '\u{1F4C1}', n: 'Commesse' }, 'Progetti \u00b7 task \u00b7 ricavi/costi/margine \u00b7 connesso a Supabase')}
    <div data-projects-root><div class="v2-loading">\u23f3 Inizializzazione commesse\u2026</div></div>`;
}

function viewFinance() {
  return `${head({ icon: '\u{1F4B0}', n: 'Finanza' }, 'Cashflow \u00b7 incassi \u00b7 pagamenti \u00b7 esposizione \u00b7 derivato dai documenti')}
    <div data-finance-root><div class="v2-loading">\u23f3 Inizializzazione finanza\u2026</div></div>`;
}

function viewReports() {
  return `${head({ icon: '\u{1F4C8}', n: 'Reporting & BI' }, 'Cruscotto direzionale \u00b7 vendite/finanza/magazzino/commesse \u00b7 dati reali')}
    <div data-reports-root><div class="v2-loading">\u23f3 Elaboro i report\u2026</div></div>`;
}

function viewIntel() {
  return `${head({ icon: '\u{1F9E0}', n: 'Intelligence Hub' }, 'Riordino \u00b7 anomalie \u00b7 RFM \u00b7 prodotti \u00b7 forecast \u00b7 insight deterministici')}
    <div data-intel-root><div class="v2-loading">\u23f3 Elaboro gli insight\u2026</div></div>`;
}

function viewProduction() {
  return `${head({ icon: '\u{1F3ED}', n: 'Produzione' }, 'Ordini di produzione \u00b7 distinte base \u00b7 consumo materiali \u00b7 connesso a Supabase')}
    <div data-production-root><div class="v2-loading">\u23f3 Inizializzazione produzione\u2026</div></div>`;
}

function viewMaterials() {
  return `${head({ icon: '🪵', n: 'Materiali' }, 'Master-data materiali · stock reale · costo/mq · usati in Quoter, Acquisti, Produzione')}
    <div data-materials-root><div class="v2-loading">⏳ Inizializzazione materiali…</div></div>`;
}

function viewEquipment() {
  return `${head({ icon: '🔧', n: 'Attrezzature / Macchine' }, 'Anagrafica macchine · tariffa €/min · risorsa per lo Smart Quoter')}
    <div data-equipment-root><div class="v2-loading">⏳ Inizializzazione attrezzature…</div></div>`;
}

function viewKpi() {
  return `${head({ icon: '📊', n: 'KPI' }, 'Indicatori ufficiali KB vs target · deterministici, con fonte')}
    <div data-kpi-root><div class="v2-loading">⏳ Calcolo KPI…</div></div>`;
}
function viewForecaster() {
  return `${head({ icon: '🔮', n: 'Forecaster' }, 'Proiezione ricavi e incassi da storico reale · nessuna stima inventata')}
    <div data-forecaster-root><div class="v2-loading">⏳ Proiezione…</div></div>`;
}
function viewOpportunity() {
  return `${head({ icon: '🎯', n: 'Opportunità' }, 'Azioni a impatto economico da segnali reali · con fonte e link')}
    <div data-opportunity-root><div class="v2-loading">⏳ Analisi…</div></div>`;
}
function viewGrowth() {
  return `${head({ icon: '🚀', n: 'Growth Engine' }, 'Sintesi crescita: forecast + opportunità + alert · score deterministico')}
    <div data-growth-root><div class="v2-loading">⏳ Growth engine…</div></div>`;
}

function viewTaxCalendar() {
  return `${head({ icon: '🗓️', n: 'Scadenze Fiscali' }, 'Scadenzario fiscale IT ricorrente · date note, deterministico · riferimento')}
    <div data-taxcalendar-root><div class="v2-loading">⏳…</div></div>`;
}
function viewFiscal() {
  return `${head({ icon: '🧾', n: 'Fiscale' }, 'Sintesi IVA sull incassato all aliquota configurata · stima, non invio SdI')}
    <div data-fiscal-root><div class="v2-loading">⏳ Carico dati fiscali…</div></div>`;
}
function viewLaserB2B() {
  return `${head({ icon: '🏭', n: 'Laser B2B' }, 'Calcolatore laser con markup B2B KB (×2,5) · motore quoter')}
    <div data-laser_b2b-root><div class="v2-loading">⏳…</div></div>`;
}
function viewPortabile() {
  return `${head({ icon: '💾', n: 'Esporta Portatile' }, 'Backup JSON completo ed export CSV · portabilità dati (riusa Backup)')}
    <div data-export-root><div class="v2-loading">⏳ Inizializzazione export…</div></div>`;
}
function viewInglyDesign() {
  return `${head({ icon: '✨', n: 'Ingly Design' }, 'Identità e riferimenti del brand · scheda di riferimento')}
    <div data-brand_identity-root><div class="v2-loading">⏳…</div></div>`;
}

function viewBankFunds() {
  return `${head({ icon: '🏦', n: 'Bank & Funds' }, 'Conti, casse e fondi · liquidità totale · CRUD reale · accesso riservato')}
    <div data-bank_funds-root><div class="v2-loading">⏳ Carico conti…</div></div>`;
}
function viewLabSetup() {
  return `${head({ icon: '🧰', n: 'Lab & Lista Acquisti' }, 'Attrezzatura/consumabili da comprare · costo e stato · CRUD reale')}
    <div data-lab_setup-root><div class="v2-loading">⏳ Carico lista…</div></div>`;
}

function viewBooking() {
  return `${head({ icon: '📆', n: 'Booking' }, 'Prenotazioni e appuntamenti con stato · CRUD reale')}
    <div data-booking-root><div class="v2-loading">⏳ Carico prenotazioni…</div></div>`;
}

function viewTeam() {
  return `${head({ icon: '👥', n: 'Team & HR' }, 'Collaboratori e costo orario · CRUD reale · accesso riservato (RBAC)')}
    <div data-team-root><div class="v2-loading">⏳ Carico team…</div></div>`;
}

function viewIdeas() {
  return `${head({ icon: '💡', n: 'Idee & Ispirazione' }, 'Appunti e idee · CRUD reale (tabella workspace_note)')}
    <div data-ideas-root><div class="v2-loading">⏳ Carico…</div></div>`;
}
function viewInnovation() {
  return `${head({ icon: '🧪', n: 'Innovazione' }, 'Progetti di innovazione · CRUD reale · stessa tabella tipizzata')}
    <div data-innovation-root><div class="v2-loading">⏳ Carico…</div></div>`;
}
function viewStrategy() {
  return `${head({ icon: '♟️', n: 'Strategia' }, 'Note strategiche e obiettivi · CRUD reale')}
    <div data-strategy-root><div class="v2-loading">⏳ Carico…</div></div>`;
}
function viewFiera() {
  return `${head({ icon: '🎪', n: 'Fiera Assistant' }, 'Checklist e note per fiere/eventi · CRUD reale')}
    <div data-fiera-root><div class="v2-loading">⏳ Carico…</div></div>`;
}

function viewReportHub() {
  return `${head({ icon: '📑', n: 'Report' }, 'Sintesi report reali cross-modulo · export completo dal modulo Backup')}
    <div data-reports-root><div class="v2-loading">⏳ Carico report…</div></div>`;
}
function viewCalendar() {
  return `${head({ icon: '📅', n: 'Calendario' }, 'Agenda dalle scadenze reali di preventivi e fatture · nessun evento finto')}
    <div data-calendar-root><div class="v2-loading">⏳ Carico agenda…</div></div>`;
}
function viewLaserResources() {
  return `${head({ icon: '🛠️', n: 'Risorse Laser' }, 'Macchine (€/min) e materiali (€/mq) di riferimento · dai dati reali')}
    <div data-laserresources-root><div class="v2-loading">⏳ Carico risorse…</div></div>`;
}
function viewBrandIdentity() {
  return `${head({ icon: '✨', n: 'Brand Identity' }, 'Valori, riferimenti, tecniche, tone of voice · riferimento brand')}
    <div data-brand_identity-root><div class="v2-loading">⏳…</div></div>`;
}
function viewLegal() {
  return `${head({ icon: '⚖️', n: 'Legale' }, 'Modelli di testo standard (privacy, condizioni, garanzia) · non è consulenza')}
    <div data-legal-root><div class="v2-loading">⏳…</div></div>`;
}

function viewMarketing() {
  return `${head({ icon: '📣', n: 'Marketing Pro' }, 'Piano azioni + calendario editoriale dai dati reali · regole KB')}
    <div data-marketing-root><div class="v2-loading">⏳ Preparo il piano…</div></div>`;
}
function viewEtsySeo() {
  return `${head({ icon: '🔑', n: 'Etsy SEO Wizard' }, 'Ottimizzatore titolo/tag per regole Etsy · deterministico, nessuna AI')}
    <div data-etsy_seo_wizard-root><div class="v2-loading">⏳…</div></div>`;
}

function viewWorkflow() {
  return `${head({ icon: '🗂️', n: 'Workflow Overview' }, 'Ordini di produzione per stato · kanban deterministico dai dati reali')}
    <div data-workflow_dashboard-root><div class="v2-loading">⏳ Carico workflow…</div></div>`;
}
function viewSales() {
  return `${head({ icon: '💶', n: 'Vendite & Fatture' }, 'Sintesi ordini e fatture · incassato / da incassare · dai dati reali')}
    <div data-sales-root><div class="v2-loading">⏳ Carico vendite…</div></div>`;
}
function viewSalesArchive() {
  return `${head({ icon: '🗃️', n: 'Archivio Vendite' }, 'Storico ordini consegnati o annullati · sola lettura')}
    <div data-sales_archive-root><div class="v2-loading">⏳ Carico archivio…</div></div>`;
}

function viewAiBusiness() {
  return `${head({ icon: '🤖', n: 'Business AI' }, 'Briefing deterministico: salute business, prossime mosse, alert · con fonte')}
    <div data-ai-root><div class="v2-loading">⏳ Preparo il briefing…</div></div>`;
}
function viewBizAi() {
  return `${head({ icon: '🧠', n: 'Business Intelligence AI' }, 'Sintesi operativa deterministica dai dati reali · nessuna AI generativa')}
    <div data-bizai-root><div class="v2-loading">⏳ Preparo il briefing…</div></div>`;
}
function viewAiCoach() {
  return `${head({ icon: '🎓', n: 'AI Coach' }, 'Consigli per ogni KPI sotto target · regole KB esplicite, con fonte')}
    <div data-aicoach-root><div class="v2-loading">⏳ Analizzo i KPI…</div></div>`;
}
function viewDecision() {
  return `${head({ icon: '⚖️', n: 'Decision Engine' }, 'Decisioni ordinate per impatto · motivo e fonte · deterministico')}
    <div data-decision-root><div class="v2-loading">⏳ Valuto le decisioni…</div></div>`;
}
function viewForecasting() {
  return `${head({ icon: '🔮', n: 'Forecasting' }, 'Proiezione ricavi e incassi da storico reale · spiegabile')}
    <div data-forecasting-root><div class="v2-loading">⏳ Proiezione…</div></div>`;
}

function viewLaserCalc() {
  return `${head({ icon: '🔦', n: 'Calcolatore Laser' }, 'Materiale + laser (€/min) + manodopera · motore quoter · prezzo ×2 KB')}
    <div data-lasercalc-root><div class="v2-loading">⏳…</div></div>`;
}
function viewPrint3D() {
  return `${head({ icon: '🧊', n: 'Calcolatore Stampa 3D' }, 'Filamento + ore stampa + post-lavoro · deterministico')}
    <div data-print3d-root><div class="v2-loading">⏳…</div></div>`;
}
function viewApparel() {
  return `${head({ icon: '👕', n: 'Calcolatore Apparel' }, 'Capo + stampa (DTF/transfer) + manodopera · deterministico')}
    <div data-apparel-root><div class="v2-loading">⏳…</div></div>`;
}
function viewListino() {
  return `${head({ icon: '📋', n: 'Listino Prezzi' }, 'Prezzi del catalogo con margine attuale · dai dati reali')}
    <div data-listino-root><div class="v2-loading">⏳ Carico listino…</div></div>`;
}
function viewTemplateDocs() {
  return `${head({ icon: '📝', n: 'Template Documenti' }, 'Testi standard pronti (validità, acconto, express…) · preset KB')}
    <div data-template_docs-root><div class="v2-loading">⏳…</div></div>`;
}
function viewQuoteIntel() {
  return `${head({ icon: '🧩', n: 'Quote Intelligence' }, 'Conversione, valore medio, preventivi aperti · dai dati reali')}
    <div data-quoteintel-root><div class="v2-loading">⏳ Analisi preventivi…</div></div>`;
}

function viewGoals() {
  return `${head({ icon: '🎯', n: 'Obiettivi' }, 'Target ufficiali KB vs valori reali · avanzamento con fonte')}
    <div data-goals-root><div class="v2-loading">⏳ Carico obiettivi…</div></div>`;
}
function viewProfitScope() {
  return `${head({ icon: '🔬', n: 'ProfitScope' }, 'Redditività complessiva e top prodotti · dai dati reali')}
    <div data-profitscope-root><div class="v2-loading">⏳ Analisi redditività…</div></div>`;
}
function viewProfitLeak() {
  return `${head({ icon: '🩸', n: 'Profit Leak' }, 'Dove si perde margine · prodotti, commesse, dead stock · con azione KB')}
    <div data-profitleak-root><div class="v2-loading">⏳ Analisi perdite…</div></div>`;
}
function viewRevSim() {
  return `${head({ icon: '📈', n: 'Revenue Simulator' }, 'What-if deterministico su volume e prezzo · baseline reale')}
    <div data-revsim-root><div class="v2-loading">⏳ Carico baseline…</div></div>`;
}
function viewDynamicPrice() {
  return `${head({ icon: '🏷️', n: 'Dynamic Price' }, 'Prezzo suggerito per margine target KB · dal costo reale (motore quoter)')}
    <div data-dynamicprice-root><div class="v2-loading">⏳ Calcolo prezzi…</div></div>`;
}

function viewPaints() {
  return `${head({ icon: '🎨', n: 'Vernici & Bombolette' }, 'Vista tipizzata sui materiali · stessa master-data, nessuna anagrafica doppia')}
    <div data-paints-root><div class="v2-loading">⏳ Carico vista…</div></div>`;
}
function viewComponents() {
  return `${head({ icon: '🔩', n: 'Componenti & Accessori' }, 'Vista tipizzata sui materiali · una sola source of truth')}
    <div data-components-root><div class="v2-loading">⏳ Carico vista…</div></div>`;
}
function viewGadgets() {
  return `${head({ icon: '🎁', n: 'Gadget & Accessori' }, 'Vista tipizzata sui materiali · LED, portachiavi, minuteria')}
    <div data-gadgets-root><div class="v2-loading">⏳ Carico vista…</div></div>`;
}
function viewSupplierIntel() {
  return `${head({ icon: '🏭', n: 'Supplier Intelligence' }, 'Spesa, ordini e dipendenza per fornitore · deterministico, con fonte')}
    <div data-supplierintel-root><div class="v2-loading">⏳ Analisi fornitori…</div></div>`;
}

function viewClientIntel() {
  return `${head({ icon: '🧠', n: 'Client Intelligence' }, 'Segmentazione RFM dei clienti · deterministica, con fonte')}
    <div data-clientintel-root><div class="v2-loading">⏳ Segmentazione…</div></div>`;
}
function viewClv() {
  return `${head({ icon: '💎', n: 'Customer Lifetime Value' }, 'CLV storico e proiezione annua per cliente · dai dati reali ordini')}
    <div data-clv-root><div class="v2-loading">⏳ Calcolo CLV…</div></div>`;
}
function viewLeadScorer() {
  return `${head({ icon: '⭐', n: 'Lead Scorer' }, 'Punteggio 0–100 e priorità da RFM · spiegabile, con motivo')}
    <div data-leadscorer-root><div class="v2-loading">⏳ Scoring…</div></div>`;
}
function viewB2BPitch() {
  return `${head({ icon: '🤝', n: 'Pitch B2B' }, 'Bozza proposta B2B dai dati reali del cliente + termini KB (no AI finta)')}
    <div data-b2bpitch-root><div class="v2-loading">⏳ Carico clienti…</div></div>`;
}

function viewNotifications() {
  return `${head({ icon: '🔔', n: 'Notifiche Smart' }, 'Centro notifiche a eventi · consegne tracciate · adapter MOCK (simulazione, nessun invio reale)')}
    <div data-notifications-root><div class="v2-loading">⏳ Inizializzazione notifiche…</div></div>`;
}

function viewBackup() {
  return `${head({ icon: '\u{1F4BE}', n: 'Backup & Export' }, 'Backup JSON completo · export CSV per entità · portabilità dati')}
    <div data-export-root><div class="v2-loading">⏳ Inizializzazione export…</div></div>`;
}

function viewAudit() {
  return `${head({ icon: '\u{1F4DC}', n: 'Audit Log' }, 'Storico operazioni · tracciamento server-side · riservato OWNER/ADMIN')}
    <div data-audit-root><div class="v2-loading">⏳ Inizializzazione audit…</div></div>`;
}

function viewFixedCosts() {
  return `${head({ icon: '\u{1F9FE}', n: 'Costi Fissi' }, 'Costi ricorrenti · burn mensile · break-even · connesso a Supabase')}
    <div data-fixedcosts-root><div class="v2-loading">⏳ Inizializzazione costi fissi…</div></div>`;
}

function viewTimeTracker() {
  return `${head({ icon: '⏱️', n: 'Time Tracker' }, 'Ore di lavoro · fatturabili · per commessa · KPI ore settimana')}
    <div data-timetracker-root><div class="v2-loading">⏳ Inizializzazione ore…</div></div>`;
}

function viewRecurring() {
  return `${head({ icon: '\u{1F501}', n: 'Fatture Ricorrenti' }, 'Template periodici · generazione fatture reali · connesso a Supabase')}
    <div data-recurring-root><div class="v2-loading">⏳ Inizializzazione ricorrenti…</div></div>`;
}

function viewCashflow() {
  return `${head({ icon: '\u{1F4A7}', n: 'Cassa Profit-First & KPI' }, 'Ripartizione incassi 15/10/15/60 · KPI ufficiali KB · derivato dai dati')}
    <div data-profitfirst-root><div class="v2-loading">⏳ Inizializzazione cassa…</div></div>`;
}

function viewSettings() {
  return `${head({ icon: '⚙️', n: 'Impostazioni ERP' }, 'Azienda · fisco · pricing · numerazione · cassa · connesso a Supabase')}
    <div data-settings-root><div class="v2-loading">⏳ Inizializzazione impostazioni…</div></div>`;
}

function viewQuoter() {
  return `${head({ icon: '📄', n: 'Smart Quoter' }, 'Preventivazione premium · breakdown costi · markup · margine · anchoring · PDF · workflow ERP')}
    <div data-quoterstudio-root><div class="v2-loading">⏳ Inizializzazione Smart Quoter…</div></div>`;
}

function viewSearch() {
  return `${head({ icon: '🔍', n: 'Ricerca Globale' }, 'Cerca in tutti i moduli · clienti · prodotti · documenti · connesso a Supabase')}
    <div data-search-root><div class="v2-empty">Digita per cercare…</div></div>`;
}

function viewLogistics() {
  return `${head({ icon: '\u{1F69A}', n: 'Logistica & Spedizioni' }, 'Preparazione · picking · packing · spedizione · consegna · connesso a Supabase')}
    <div data-logistics-root><div class="v2-loading">⏳ Inizializzazione logistica…</div></div>`;
}

const SPECIAL = { dashboard: viewDashboard, search: viewSearch, quoter: viewQuoter, settings: viewSettings, cashflow: viewCashflow, recurring: viewRecurring, timetracker: viewTimeTracker, fixed_costs: viewFixedCosts, history: viewAudit, backup: viewBackup, equipment: viewEquipment, materials: viewMaterials, smartnotif: viewNotifications, kpi: viewKpi, forecaster: viewForecaster, opportunity: viewOpportunity, growthengine: viewGrowth, clientintel: viewClientIntel, clv: viewClv, leadscorer: viewLeadScorer, b2bpitch: viewB2BPitch, paints: viewPaints, components: viewComponents, gadgets: viewGadgets, supplierintel: viewSupplierIntel, goals: viewGoals, profitscope: viewProfitScope, profitleak: viewProfitLeak, revsim: viewRevSim, dynamicprice: viewDynamicPrice, lasercalc: viewLaserCalc, print3d: viewPrint3D, apparel: viewApparel, listino: viewListino, template_docs: viewTemplateDocs, quoteintel: viewQuoteIntel, ai: viewAiBusiness, bizai: viewBizAi, aicoach: viewAiCoach, decision: viewDecision, forecasting: viewForecasting, workflow_dashboard: viewWorkflow, sales: viewSales, sales_archive: viewSalesArchive, marketing: viewMarketing, etsy_seo_wizard: viewEtsySeo, reports: viewReportHub, calendar: viewCalendar, laserresources: viewLaserResources, brand_identity: viewBrandIdentity, legal: viewLegal, ideas: viewIdeas, innovation: viewInnovation, strategy: viewStrategy, fiera: viewFiera, team: viewTeam, booking: viewBooking, bank_funds: viewBankFunds, lab_setup: viewLabSetup, taxcalendar: viewTaxCalendar, fiscal: viewFiscal, laser_b2b: viewLaserB2B, portabile: viewPortabile, inglydesign: viewInglyDesign, clients: viewClients, catalog: viewCatalog, quotes: viewQuotes, gestione_ordini: viewOrders, invoices: viewInvoices, aging: viewAging, suppliers: viewSuppliers, purchases: viewPurchases, inventory: viewWarehouse, items: viewWarehouse, projects: viewProjects, finance: viewFinance, analytics: viewReports, intel: viewIntel, production: viewProduction, logistics: viewLogistics };

export function renderView(section, ctx) {
  const fn = SPECIAL[section];
  const body = fn ? fn(ctx) : (INTEGRATION[section] ? viewIntegration(section) : viewGeneric(section));
  return `<div class="v2-page" data-page="${esc(section)}">${body}</div>`;
}
export const IMPLEMENTED = Object.keys(SPECIAL);

// wiring locale: tab, ricerca (su liste vuote è comunque reale), filtri
export function wireView(root) {
  root.querySelectorAll('[data-tabs]').forEach((bar) => {
    bar.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
      bar.querySelectorAll('[data-tab]').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      const page = bar.closest('.v2-page');
      page.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.getAttribute('data-pane') !== b.getAttribute('data-tab'); });
    }));
  });
}
