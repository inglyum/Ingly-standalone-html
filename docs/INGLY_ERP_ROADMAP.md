# INGLY OS — ERP Upgrade Roadmap (10 Sprint)

> Piano incrementale, non distruttivo, verificato sprint per sprint. Benchmark: Odoo 20.0.
> Vincoli: nessuna perdita di funzioni/dati, nessun push su default, backup prima di ogni migrazione, `verify-syntax` + smoke Playwright verdi prima di ogni commit.
> Ogni sprint termina con un report: file modificati · funzioni · DB · test · risultati · problemi risolti · problemi rimasti.

## Principio guida
Prima **documentare** (fatto in Sprint 0), poi **stabilizzare** le parti critiche (sicurezza, DB, navigazione), poi **consolidare il modello dati**, poi **estendere** i moduli ERP. Niente moduli nuovi finché il modello dati non è coerente.

---

## SPRINT 0 — Audit & Backup ✅ (completato)
- Audit tecnico reale → `INGLY_ERP_AUDIT.md`, `INGLY_MODULE_MATRIX.md`, `INGLY_DOMAIN_MODEL.md`, `INGLY_DATA_MIGRATIONS.md`, `INGLY_SECURITY_AUDIT.md`, `INGLY_TEST_PLAN.md`.
- Branch `claude/ingly-erp-upgrade`, backup file verificabile in `backups/`.
- **Deliverable:** questi documenti. Nessuna modifica a codice/dati.

## SPRINT 1 — Sicurezza, DB, Navigazione, Stabilità
- **DB framework migrazioni**: introdurre un vero runner migrazioni sequenziali/idempotenti (array versionato, applicato in `onupgradeneeded` + migrazioni dati lazy tracciate). Nessun drop di store.
- **Backup/Restore**: procedura `BackupEngine` unica, export/import JSON completo con verifica integrità pre/post (consolidare i ≥8 moduli backup/sync esistenti).
- **ID DOM duplicati (79)**: bonifica mirata degli id realmente in conflitto (form riusati) con scoping per-modulo.
- **Sicurezza**: separare nettamente STANDALONE (locale) da SaaS; documentare che i gate attuali sono client-side (non sicurezza reale); preparare interfaccia permessi per il backend futuro.
- **Error boundary per-modulo** su `App.navigate` con logging (non più solo try/catch silenzioso).
- **Verifica:** smoke su 10 sezioni chiave, 0 pageerror, backup/restore round-trip.

## SPRINT 2 — Modello dati & servizi condivisi
- **Master Data Layer**: potenziare `DataLayer`/`StoreUnification` come unico accesso alle entità canoniche.
- **Fonte canonica ordini**: scegliere `orders`; `pipeline` diventa proiezione/adapter read; nessun doppio write.
- **Adozione `items`**: adapter che reindirizza letture/scritture di `inventory/materials/components/gadgets` → `items`, mantenendo i vecchi store in sola lettura finché non dimostrato il pieno switch.
- **localStorage → DB**: migrare i dati di dominio (movimenti magazzino, code riordino, ecc.) dentro `InglyMasterDB`; lasciare in localStorage solo preferenze UI.
- **Verifica:** test CRUD entità, nessuna duplicazione cliente/prodotto/ordine tra viste.

## SPRINT 3 — CRM, Sales & Smart Quoter
- Modello esplicito **Lead → Opportunity → Customer** sopra l'attuale pipeline.
- Consolidare i ~15 moduli cliente attorno a `Clients` + `CRMDash` (scheda 360° già collegata ai preventivi).
- Quoter: motore prezzi unico (vedi §Pricing), conversione preventivo→ordine senza reinserimento (già presente `PreventivToOrder`), revisioni/validità/acconti/firma.
- **Verifica:** flusso Lead→Quote→Order end-to-end.

## SPRINT 4 — Purchasing, Inventory, Supplier
- Multi-deposito/ubicazioni, quantità disponibile/riservata/in-arrivo su `items`.
- RFQ → confronto fornitori → PO → ricezione (parziale/totale) → carico (ciclo base già presente, da estendere).
- Valutazione performance fornitori (`supplier_perf`).
- **Verifica:** prenotazione/consumo stock coerente su conferma ordini.

## SPRINT 5 — Manufacturing / MRP & Machine
- **BoM multilivello**, **Manufacturing Orders**, **Work Orders**, **Work Centers**, pianificazione/capacità, consumi reali, scarti, costi effettivi.
- Scheda macchina completa con **profili di lavorazione versionati** (no valori inventati), manutenzione, ore, ammortamento.
- **Verifica:** una commessa personalizzata pianificata e consuntivata in tutte le fasi.

## SPRINT 6 — Quality, Maintenance, Delivery, Documents
- Controllo qualità (checklist, difetti, foto, scarti, approvazione).
- Manutenzione preventiva/straordinaria, registro guasti, ricambi, fermi.
- Spedizioni collegate a ordini/magazzino; gestione documenti unificata.

## SPRINT 7 — Finance & integrazioni
- Prima nota, crediti/debiti, scadenziario, riconciliazione, IVA, centri di costo, marginalità per commessa, cashflow.
- Fattura elettronica IT: validazioni con provider adeguato — **nessuna dichiarazione di conformità senza test professionale**.
- Valutazione vendoring CSP-safe delle librerie grafici/PDF (offline).

## SPRINT 8 — Marketing, Project, HR & Team
- Integrare marketing col CRM/vendite. Progetti con task/timesheet/redditività. HR base (presenze/turni/assenze/costo orario).

## SPRINT 9 — Business Intelligence & AI
- **AI Hub centrale** con agenti registrati (CRM/Sales/Pricing/Production/Inventory/Procurement/Finance/Marketing/Market Intel), dati minimi necessari, permessi, log. Raccomandazioni con dati usati/motivazione/attendibilità/rischi. Nessuna azione irreversibile automatica.

## SPRINT 10 — Test finali, ottimizzazione, release
- Suite test completa, regressione di tutte le funzioni esistenti, perf budget, versione standalone HTML funzionante, report finale criticità rimaste.

---

## Ordine di priorità sintetico
`Sicurezza+DB+Stabilità (1)` → `Modello dati (2)` → `CRM/Sales/Quoter (3)` → `Purchase/Inventory (4)` → `MRP (5)` → resto.
Motivo: senza DB/modello coerenti, ogni modulo nuovo aumenta il debito. Con essi, MRP/Quality/Finance si innestano puliti.
