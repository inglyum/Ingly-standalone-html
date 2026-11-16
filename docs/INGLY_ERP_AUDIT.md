# INGLY OS — Audit Tecnico (SPRINT 0 / Fase Zero)

> File analizzato: `INGLY-OS-v53-AV2.html` (monolite single-file, ~106.900 righe, ~6.9 MB)
> Branch di lavoro: `claude/ingly-erp-upgrade`
> Backup verificabile: `backups/INGLY-OS-v53-AV2.sprint0-20261116.html`
> Benchmark architetturale: Odoo 20.0 (crm, sale, purchase, stock, mrp, account, project, hr, mail, web)
> Metodo: analisi statica del codice reale (grep/lettura mirata). I numeri sono misurati, non stimati.

Questo documento è la **fotografia dello stato attuale**. Non modifica codice. Le azioni sono in `INGLY_ERP_ROADMAP.md`.

---

## 1. Sintesi esecutiva

INGLY OS è un ERP/CRM **molto ricco** (313 moduli JS esposti, 107 sezioni di navigazione, 56 store IndexedDB) ma costruito come **monolite single-file senza build**, con forte accumulo storico. Funziona ed è usabile, ma presenta i tipici debiti di un sistema cresciuto per sovrapposizione:

| Area | Stato | Gravità |
|------|-------|---------|
| Modello dati unico e coerente | **Parziale** — doppie fonti (`orders`/`pipeline`), unificazione `items` incompleta | 🔴 Alta |
| Integrità IndexedDB / migrazioni | **Debole** — framework migrazioni di fatto assente (1 sola no-op) | 🔴 Alta |
| Persistenza coerente | **Mista** — 325 `localStorage.setItem` vs 284 `IDB.put/add` | 🟠 Media |
| Sicurezza / permessi | **Solo client-side** — gate in JS/localStorage, nessuna autorizzazione reale | 🔴 Alta (bloccante per SaaS) |
| Stabilità runtime | **Buona** dopo i fix recenti — 0 pageerror, shim offline | 🟢 OK |
| Offline-first | **Parziale** — molte CDN esterne (grafici/PDF/font/icone + jsonbin) | 🟠 Media |
| Navigazione / viste | 117 view container vs 107 sezioni; 79 ID DOM duplicati | 🟠 Media |
| UI/UX coerenza | Buona dopo i fix theme-aware; terminologia non uniforme | 🟡 Bassa |

**Conclusione:** la priorità non è aggiungere moduli, ma **consolidare il modello dati, le migrazioni e la sicurezza**. Senza questo, ogni nuovo modulo ERP (MRP, Quality, Accounting) aumenterebbe il debito invece di ridurlo.

---

## 2. Architettura attuale (misurata)

- **Formato:** HTML single-file, `<style>`/`<script>` inline, vanilla JS in IIFE e oggetti globali. Nessun bundler, nessun modulo ES. Distribuibile/ispezionabile.
- **Moduli esposti (`window.X`):** **313**.
- **Sezioni di navigazione (`data-section`):** **107**.
- **Contenitori vista (`id="view-…"`):** **117** → almeno ~10–20 viste senza voce di sidebar (vedi §6).
- **Design system:** token su `:root` (`--primary #fbbf24`, `--bg-card/2/3`, `--text/-muted/-dim`, `--radius`, `--shadow-*`), ~24 temi via `[data-theme]` (inclusi 3 chiari: arctic/latte/ghiaccio). Classi condivise `.btn/.card/.kpi-card/.badge/.module-header`.

### Infrastruttura condivisa (riferimenti nel codice)
| Componente | Ref | Ruolo | Valutazione |
|------------|-----|-------|-------------|
| `IDB` | 987 | Wrapper IndexedDB (DB `InglyMasterDB` v30) | Solido, è la spina dorsale |
| `AppStore` | 371 | Cache in memoria + invalidazione | Buono, molto usato |
| `Bus` | 126 | Event bus | Presente |
| `NavBus` | 68 | Eventi di navigazione | Presente |
| `SaaSGate` | 88 | Gate modalità SaaS/licenza | Solo client-side (vedi Security) |
| `DataLayer` | 12 | Astrazione dati | **Sottile/sottoutilizzato** |
| `StoreUnification` | 6 | Unificazione store | **Minimale, one-shot** |

L'event bus e AppStore ci sono già: sono la base su cui costruire il “modello dati unico” richiesto, **senza reinventare**.

---

## 3. Database IndexedDB — stato reale

- **DB principale:** `InglyMasterDB`, `VER = 30`.
- **Store definiti:** **56** (array `STORES`, riga ~8248). Vedi elenco completo in `INGLY_DOMAIN_MODEL.md`.
- **Apertura “smart”:** `open()` usa `Math.max(VER, versioneBrowser)` per evitare l'errore “version is less than the existing version” — mitigazione corretta di un problema storico.
- **Migrazioni:** l'array `MIGRATIONS` contiene **una sola voce `{from:0, to:13}` che non fa nulla**. Le migrazioni di campo avvengono **lazy** in `migrateRecord()` alla lettura, solo per 6 store (`clients, sales, quotes, items, catalog, orders`). → **Non esiste un framework di migrazione sequenziale/atomico/idempotente** come richiesto.
- **Secondo DB:** `InglyDB` v3 (riga ~41954) aperto separatamente per alcune letture/scritture → **storage parallelo non unificato**, da investigare e ricondurre al DB principale o documentare.
- **Moduli con versioning proprio:** oggetti con `VERSION:2/3` (righe ~72408, 76154, 77355) → versionamenti locali non coordinati col DB.

🔴 **Rischi:** assenza di migrazioni versionate; doppio DB; nessun check di integrità pre/post import; operazioni bulk che possono fallire silenziosamente.

---

## 4. Data integrity — doppie fonti (il problema #1)

### 4.1 `orders` vs `pipeline`
I commenti nel codice documentano la storia: *v20* introduce `pipeline` come fonte unica e *v21* depreca `orders/quotes/sales` (read-only); poi *v51* **re-introduce `orders`** per il Kanban produzione.

Misurazione reale dei riferimenti (stringhe `'store'`):
- `orders`: **330 riferimenti**
- `pipeline`: **102 riferimenti**

→ `orders` è di gran lunga la fonte più usata: la “pipeline unica” **non è mai stata completata**. Serve decidere UNA fonte canonica e un adapter di compatibilità (vedi `INGLY_DATA_MIGRATIONS.md`).

### 4.2 `items` vs (`inventory` + `materials` + `components` + `gadgets`)
*v56* introduce `items` come store unificato, ma i 4 store legacy **restano attivi**:
- `items`: 75 ref
- `inventory`: 50 · `materials`: 58 · `components`: 13 · `gadgets`: 24 → **145 ref legacy** (quasi il doppio di `items`).

→ Unificazione **incompleta**: i moduli vecchi scrivono/leggono ancora i vecchi store. Rischio di quantità/valori incoerenti tra viste.

---

## 5. Persistenza mista (localStorage vs IndexedDB)

- `localStorage.setItem`: **325** · `IDB.put/add`: **284**.
- Molto stato applicativo (preset, timer, config, code di riordino, flag) vive in **localStorage**, non nel DB → non entra nei backup del DB, non è migrabile/sincronizzabile, non è query-abile.

🟠 Da ricondurre al DB principale tutto ciò che è **dato di dominio** (non le semplici preferenze UI per-viewer).

---

## 6. Navigazione e viste

- **117** contenitori vista, **107** sezioni di navigazione.
- Viste senza voce `data-section` in sidebar (da verificare se raggiungibili via `App.navigate(...)` da pulsanti): `inventory, orders, produzione, components, materials, gadgets, competitor, comptrack, contentcalendar, design_studio, etsy, etsy_analytics, etsy_seo, innovation, profitleak, social, studio_ai, supplier_intel, web_presence, workspace`.
  - Nota: alcune (`inventory, orders, produzione`) **sono** instradate nel `navigate()` switch anche senza voce sidebar → raggiungibili programmaticamente.
- **79 ID DOM duplicati** (es. `crm-f-name`, `cp-name`, `comp-name`, `_cfg_save`): `getElementById` restituisce il primo nel DOM → bug potenziali quando due moduli usano lo stesso id.
- **Const in shadowing** (definite più volte): `DB, STORES, TABS, TEMPLATES, SEASONAL, MAX, DONE` — alcune locali (OK), altre da verificare.

---

## 7. Offline-first e dipendenze esterne

Dipendenze CDN rilevate:
- Runtime JS: Chart.js 4.4.1, html2canvas 1.4.1, jsPDF + autotable, ml-kmeans.
- Font/icone: font-awesome 6.5, phosphor, tabler, lucide, remixicon.
- Dati: **api.jsonbin.io** (sync config `_cfg.jsonbinId`, 3 fetch) → chiamata esterna.

Mitigazioni già presenti: shim offline di `Chart` (nessun crash offline), script CDN in `defer`. Ma offline le funzioni grafici/PDF/icone **degradano**. Per un ERP “vero” serve valutare il vendoring CSP-safe (trade-off peso).

---

## 8. AI e integrazioni

- Moduli AI multipli con chiamate a provider (chiavi in Impostazioni). Errori gestiti con messaggi (`NO_KEY` → “Configura la API Key”).
- Le chiavi non devono stare in chiaro nel file (regola rispettata: Supabase rimosso in un fix precedente). Da consolidare in un'architettura “AI Agent” centrale con logging e permessi (Sprint 9).

---

## 9. Problemi “nascosti”, non “risolti”

Come richiesto, segnalo dove un errore è **soppresso** ma la causa resta:
- Shim `Chart` offline: evita i crash ma i grafici **non** si vedono offline (degrado atteso, non fix funzionale).
- `try/catch` ampi su `App.navigate` e boot: stabilizzano ma possono mascherare fallimenti di navigazione → serve error-boundary per-modulo con logging.
- Migrazioni lazy: “funziona” alla lettura ma non garantisce integrità globale né idempotenza su bulk.

---

## 10. Vincoli rispettati in questo audit

- Nessuna modifica a codice o dati in Fase Zero.
- Backup file creato e verificato (sha + copia in `backups/`).
- Branch dedicata creata (`claude/ingly-erp-upgrade`), nessun push su default.
- Nessun dato fittizio introdotto.

---

## 11. Criticità in ordine di priorità (→ Sprint)

1. 🔴 **Sicurezza client-side** (gate/permessi solo JS) — bloccante per SaaS → Sprint 1.
2. 🔴 **Migrazioni IndexedDB** assenti + doppio DB → Sprint 1–2.
3. 🔴 **Doppia fonte `orders`/`pipeline`** e **unificazione `items` incompleta** → Sprint 2.
4. 🟠 **Persistenza in localStorage** per dati di dominio → Sprint 2.
5. 🟠 **ID DOM duplicati** (79) → Sprint 1 (stabilità).
6. 🟠 **Offline/CDN** → Sprint 7/10 (valutazione vendoring).
7. 🟡 **Terminologia/UX** non uniforme → trasversale.

Dettaglio operativo in `INGLY_ERP_ROADMAP.md`.
