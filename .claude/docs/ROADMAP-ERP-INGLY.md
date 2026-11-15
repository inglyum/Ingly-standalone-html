# INGLY OS — Roadmap ERP/CRM di ultima generazione

> Obiettivo: portare **INGLY OS** (monolite `INGLY-OS-v53-AV2.html`) al livello dei
> migliori ERP/CRM sul mercato — **UI/UX premium con micro-interazioni, fluidità e
> stabilità assoluta, CRM evoluto 360°, reporting, automazioni, sicurezza** — restando
> single-file, vanilla JS, IndexedDB, CSP-safe, offline-first.
>
> Riferimenti di qualità: **Odoo 17** (moduli/smart button/chatter), **ERPNext**
> (documenti/pricing/tax), **Salesforce & HubSpot** (CRM 360°, pipeline, attività),
> **Linear & Notion** (velocità, command palette, micro-interazioni, information design).
>
> Principi non negoziabili (dalle regole di progetto): modifiche **mirate e reversibili**,
> nessun cambio di logica di business senza approvazione (toggle opt-in default-OFF),
> `verify-syntax` verde prima di ogni commit, niente `eval`/`innerHTML` non sanitizzato,
> accessibilità WCAG AA, nessuna dipendenza esterna a runtime.

---

## Stato attuale (punto di partenza)

**Già forte:** 102 moduli, Smart Quoter **per-riga editabile** (appena fatto), workflow
preventivo→vendita, pipeline, PDF brandizzati, pagamenti (Stripe/PayPal/link), canali
prezzo, anchoring AI, ~52 store IndexedDB, design system a token (`--primary`, `--bg-card`,
`--radius`, `--shadow-*`), header sezioni `.module-header`.

**Da elevare:** coerenza grafica tra i 102 moduli, micro-interazioni e feedback, velocità
percepita (skeleton/optimistic), CRM come vero hub 360°, ricerca/azioni globali, reporting,
automazioni deterministiche, sicurezza/ruoli, mobile.

---

## I 8 pilastri (cosa rende un ERP "il migliore")

| # | Pilastro | Benchmark | Skill INGLY che lo guida |
|---|----------|-----------|--------------------------|
| 1 | **Design system & motion** | Linear, Notion | `design-system-manager`, `ui-design`, `component-library-manager` |
| 2 | **Fluidità & stabilità** | Linear, Odoo | `performance-optimizer`, `single-file-editing` |
| 3 | **CRM 360° evoluto** | Salesforce, HubSpot | `enterprise-patterns`, `ux-reviewer` |
| 4 | **Interazione pro** (command palette, ricerca, scorciatoie, bulk) | Linear, Notion | `ui-design`, `ux-reviewer` |
| 5 | **Dati & affidabilità** (backup, audit, undo, migrazioni) | ERPNext, SAP | `data-architect`, `security-manager` |
| 6 | **Workflow & automazioni** | Odoo, ERPNext | `enterprise-patterns` |
| 7 | **Reporting & dashboard** | Odoo, Salesforce | `analytics-engine` |
| 8 | **Sicurezza & RBAC** | Salesforce, SAP | `security-manager`, `admin-panel-architect` |

---

## Roadmap a fasi (incrementale, ogni fase è rilasciabile)

### FASE 1 — Fondamenta UI/UX & motion system  ·  _rischio basso · reversibile · alta resa_
Il salto grafico che si propaga a TUTTI i 102 moduli, agendo sul CSS condiviso (non modulo per modulo).

- **1.1 Token & temi**: palette rifinita, scala tipografica, spaziature 4/8pt, `--shadow`/`--radius`
  coerenti; **tema chiaro/scuro** con toggle persistito; `prefers-reduced-motion` rispettato.
- **1.2 Motion system**: transizioni standard (`--ease-out`, `--ease-spring`), hover-lift/press su
  bottoni e card, focus-ring accessibile, entrata contenuti con fade/slide leggeri (solo `transform/opacity`).
- **1.3 Componenti base premium**: `.btn/.card/.badge/.kpi-card/.tab/.table/.modal/.drawer/.toast`
  unificati e documentati; stati hover/active/disabled/loading.
- **1.4 Feedback universale**: toast coerenti, **skeleton loader**, empty-state illustrati, conferme non-bloccanti.
- _Deliverable:_ look "Linear/Notion" su tutta l'app, zero colori hardcoded. _Effort: M._

### FASE 2 — Fluidità & stabilità  ·  _rischio basso/medio_
Far percepire l'app **istantanea** e non romperla mai.

- **2.1 Render on-demand**: sezioni montate solo quando attive (`contain:layout`), liste **virtualizzate**
  per store grandi; batch DOM con `DocumentFragment`.
- **2.2 Optimistic UI**: azioni (salva/elimina) riflesse subito in UI, poi persistite su IndexedDB; rollback su errore.
- **2.3 Robustezza**: error boundary per modulo (un modulo che crasha non abbatte l'app), guardie su store mancanti,
  debounce input, nessun reflow a raffica.
- **2.4 Perf budget**: audit tempo di apertura sezione, memoria, cache `AppStore` invalidata in modo chirurgico.
- _Deliverable:_ navigazione fluida anche con migliaia di record. _Effort: M._

### FASE 3 — CRM 360° evoluto  ·  _il cuore della richiesta_
Trasformare il CRM in un vero hub relazionale stile Salesforce/HubSpot.

- **3.1 Scheda cliente 360°**: anagrafica + **timeline attività** (chiamate/email/note/preventivi/ordini/fatture),
  smart-button con conteggi (Preventivi, Ordini, Fatturato, Insoluti) che aprono le liste filtrate.
- **3.2 Pipeline Kanban** drag&drop (lead→qualificato→preventivo→vinto/perso) con valore e probabilità.
- **3.3 Attività & promemoria**: task con scadenza, "prossima azione", notifiche; agenda del giorno.
- **3.4 Segmentazione & lead scoring**: tag, filtri salvati, punteggio su RFM (ricavi/frequenza/recenza), dedupe clienti.
- **3.5 Comunicazione**: template WhatsApp/email, storico interazioni, quick-actions dalla scheda.
- _Deliverable:_ CRM che risponde a "chi ricontatto oggi e perché". _Effort: L._

### FASE 4 — Interazione professionale  ·  _velocità da power-user_
- **4.1 Command palette (Cmd/Ctrl+K)**: vai ovunque, crea record, lancia azioni — stile Linear.
- **4.2 Ricerca globale** cross-store con risultati raggruppati e anteprime.
- **4.3 Scorciatoie da tastiera** + navigazione liste con frecce.
- **4.4 Bulk actions** (selezione multipla: elimina/esporta/cambia stato) e **viste salvate** (filtri+colonne).
- **4.5 Inline editing** esteso a tabelle chiave (come la nuova Quoter per-riga).
- _Effort: M/L._

### FASE 5 — Dati, affidabilità & undo  ·  _fiducia enterprise_
- **5.1 Backup/Restore** completo (export/import JSON cifrabile) + **auto-backup** periodico.
- **5.2 Audit log** delle operazioni sensibili (chi/cosa/quando) già in parte presente → esteso e consultabile.
- **5.3 Undo/Redo** sulle azioni distruttive (snapshot già presente per i preventivi → generalizzare).
- **5.4 Migrazioni dati** versionate e sicure tra versioni del monolite; integrità store IndexedDB.
- _Effort: M._

### FASE 6 — Workflow & automazioni deterministiche  ·  _opt-in default-OFF_
- **6.1 Stati unificati** con statusbar coerente e transizioni validate su preventivi/ordini/fatture/produzione.
- **6.2 Automazioni**: "ordine consegnato → bozza fattura", "preventivo accettato → ordine", promemoria scadenze,
  sotto-scorta → riordino. Ogni automazione è un **toggle opt-in**.
- **6.3 Quote→Order→Invoice** con snapshot congelato (già impostato) + numerazione documenti coerente.
- _Effort: M/L._

### FASE 7 — Reporting & dashboard  ·  _decisioni sui dati_
- **7.1 Dashboard ROI** rifinita: KPI con trend/sparkline, confronto periodo, drill-down.
- **7.2 Report**: vendite per canale/cliente/prodotto, margini, aging insoluti, cassa profit-first (15/10/15/60).
- **7.3 Grafici** vendored CSP-safe (SVG/canvas, nessuna CDN), export PDF/CSV.
- _Effort: M._

### FASE 8 — Sicurezza & RBAC  ·  _multi-utente pro_
- **8.1 Ruoli & permessi** (OWNER/ADMIN/MANAGER/SALES/VIEWER) applicati a moduli e azioni.
- **8.2 Sessione** sicura, lock schermo, policy password; audit accessi.
- **8.3 Admin panel** per gestione utenti/permessi/config.
- _Effort: M._

### FASE 9 — Mobile & responsive  ·  _uso in laboratorio/fiera_
- Layout fluido sotto 860px, nav a drawer, tabelle in card, target touch ≥40px, azioni rapide.
- _Effort: M._

### FASE 10 — Completamento famiglia Quoter
- Applicare il pattern **per-riga editabile** (appena fatto sulla principale) a **Smart Quote 3D**, **Apparel**,
  **Calc Laser**; unificare il motore prezzi e i PDF.
- _Effort: M._

---

## Sequenza consigliata (massimo impatto, minimo rischio)

```
FASE 1 (UI/UX motion)  →  FASE 2 (fluidità/stabilità)  →  FASE 3 (CRM 360°)
      ↓                         ↓                              ↓
   look premium             app istantanea              hub relazionale
```
Poi 4 (command palette) · 7 (dashboard) · 6 (automazioni) · 5/8 (dati/sicurezza) · 9 (mobile) · 10 (quoter).

**Perché quest'ordine:** 1–2 danno il "wow" visivo e la solidità percepita su tutta l'app subito;
3 è il cuore della tua richiesta (CRM evoluto); 4 moltiplica la produttività; il resto consolida.

---

## Metodo di lavoro (per ogni fase)
1. Modifica mirata e **reversibile** sul CSS/JS condiviso (niente riscritture cieche).
2. `verify-syntax` verde + **smoke test Playwright** (screenshot + 0 errori runtime).
3. Logica di business solo con approvazione esplicita e **toggle opt-in default-OFF**.
4. Commit atomico in italiano + consegna del file aggiornato da testare.
5. Decisioni architetturali annotate in `.claude/docs/DECISIONS.md`.

---

## Prossimo passo
Consiglio di partire dalla **FASE 1 (fondamenta UI/UX & motion)**: è a basso rischio, reversibile e il
salto grafico si vede immediatamente su tutti i 102 moduli. In alternativa posso partire dalla **FASE 3
(CRM 360°)** se vuoi prima il cuore relazionale.
