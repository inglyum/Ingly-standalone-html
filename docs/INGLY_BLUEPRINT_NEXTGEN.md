# INGLY OS — Blueprint esecutivo Fase 0 (Baseline) & strategia di trasformazione

> Documento di specifica per la trasformazione di INGLY OS verso un ERP verticale per
> laboratori di personalizzazione (laser CO2/fibra, stampa UV, 3D). Fondato sui **dati reali
> del codice v68** (`INGLY-OS-v68-COMPLETE-QA.html`), non su stime.
> Branch: `claude/ingly-v68-qa`. DB `InglyMasterDB` v31.
> Natura: **Fase 0 (Baseline)** — inventario, modello dati canonico, strategia di migrazione,
> gate di test. Non distruttivo. È il prerequisito di *qualunque* strada (hardening o rewrite).

---

## 0. Principi non negoziabili

1. **Nessuna perdita di dati v68.** Ogni migrazione è idempotente, con backup pre-esecuzione e
   conteggi record pre/post riconciliati. `erp_migrations` (store già presente) traccia lo stato.
2. **Nessuna regressione silenziosa nei calcoli.** Ogni formula migrata è confrontata I/O contro
   v68 come *oracle* prima di spegnere il percorso vecchio.
3. **Nessun rilascio senza test E2E del flusso completo.** Il release gate blocca su errori critici.
4. **v68 resta il riferimento di comportamento** finché un dominio non è sostituito e verificato.
5. **Migrazione incrementale (strangler-fig), mai big-bang.** Un dominio verticale alla volta,
   dietro adapter, con il vecchio e il nuovo percorso confrontabili.

---

## 1. Baseline reale (conteggi verificati nel sorgente)

| Metrica | Valore reale | Fonte nel codice |
|---|---|---|
| Peso sorgente | ~8,1 MB | file |
| Righe | ~109.000 | file |
| Blocchi `<script>` non vuoti | 130 | `verify-syntax` → **138 blocchi, 0 errori** |
| Voci di navigazione (`data-section`) | **108** uniche | sidebar |
| Route handler (`App` map) | ~148 | map di navigazione |
| Store base (array `STORES`) | **51** | riga ~8368 |
| Store totali (registro ERP congelato) | **~62** | riga ~107147 (`+ pipeline, ai_log, kpi_snap, kpi_cache, scanner_history, versions, erp_partners, crm_leads, crm_opportunities, crm_activities, erp_migrations`) |
| Versione DB | 31 | `VER=31` |

> Riconciliazione con l'analisi esterna: i «62 store» sono corretti per il **registro ERP
> congelato** (riga 107155); i «51» sono il solo array base `STORES`. Le «98 voci nav» sono in
> realtà **108**. Nessuna discrepanza sostanziale: la direzione dell'analisi regge.

**Scoperta chiave:** v68 **contiene già** lo scaffold di un livello ERP canonico — namespace
`INGLYERP` (riga ~107158) con:
- `MODULE_MAP`: 10 domini, **tutti `state:'partial'`**, con note di consolidamento oneste;
- repository con `audit()` su store `history`, redazione campi sensibili (`SENSITIVE_FIELD`),
  guardie `assertStore` («No data was written» se lo store non esiste);
- store `erp_migrations` → **framework di migrazioni già previsto**.

→ La Fase 0 **costruisce su `INGLYERP`**, non reinventa.

---

## 2. Inventario domini (dalla `MODULE_MAP` reale, riga 107158)

Tutti i domini sono dichiarati `partial` dal codice stesso. Riporto le note reali + la decisione.

| Dominio | Store coinvolti | Nota reale nel codice | Decisione canonica Fase 0 |
|---|---|---|---|
| **CRM** | `clients`, `erp_partners`, `crm_leads`, `crm_opportunities`, `crm_activities`, `pipeline`, `history` | «Lead/opportunity lifecycle is not yet a single normalized domain.» | **Partner canonico = `erp_partners`**; `clients` diventa vista/adapter. Lead→Opportunity→Cliente un solo ciclo. |
| **Vendite & Preventivi** | `quotes`, `sales`, `orders`, `pipeline`, `erp_partners`, `crm_opportunities`, `xmlinvoices` | «Orders and pipeline are both in use; consolidation requires a tested data migration.» | **Ordine canonico = `orders`**; `pipeline` = proiezione Kanban derivata (sola lettura). |
| **Magazzino & Materiali** | `inventory`, `items`, `materials`, `components`, `gadgets`, `paints` | «Overlapping catalogs require mapping and reconciliation before consolidation.» | **Articolo canonico = `items`**; gli altri mappati con adapter + riconciliazione quantità/valore. |
| **Acquisti & Fornitori** | `suppliers`, `supplier_orders`, `supplier_perf` | «RFQ/receipt/bill lifecycle needs completion.» | Completare ciclo RFQ→PO→ricezione→carico `items`. |
| **Produzione & Workflow** | `orders`, `pipeline`, `workflow_steps`, `order_events`, `equipment`, `laser_resources`, `timelogs` | «BOM, routings, work centers and capacity planning need a canonical model.» | Introdurre BOM/distinta + job card verticale laser/UV/3D (GATE 6). |
| **Finance & Fiscale** | `cashflow`, `fixed_costs`, `tax_events`, `recurring_invoices`, `cost_entries`, `xmlinvoices` | «Management features do not constitute statutory accounting.» | Mantenere gestionale; la contabilità civilistica è esplicitamente **fuori scope** client-side. |
| **Progetti & Operations** | `projects`, `bookings`, `timelogs`, `timers`, `events` | «Need shared resource and cost relations.» | Collegare tempo/risorsa→costo commessa. |
| **Marketing & Canali** | `marketing_campaigns`, `social`, `social_posts`, `social_accounts`, `content_analytics`, `image_lib` | «Attribution needs tighter links.» | Attribuzione ricavo→campagna. |
| **BI & AI** | `ai_log`, `kpi_snap`, `kpi_cache`, `goals`, `notifications`, `competitors`, `ideas` | «Predictions require source provenance and human approval.» | AI sempre con provenienza + approvazione umana (già principio KB). |
| **Sistema** | `settings`, `history`, `backups`, `versions`, `signatures`, `dash_layout` | «Browser-only auth is not a SaaS security boundary.» | Auth reale **solo** lato server in fase SaaS. |

---

## 3. Modello dati canonico — decisioni Fase 0

La frammentazione dei nomi di campo e degli store duplicati è la **causa diretta di bug reali**.
Caso di studio verificato in questa sessione:

> **Bug €0 ricavi (corretto, commit `f23e64c`):** il preventivo salva il totale come
> `grossPrice`, ma `OrderFlow.createFromQuote` leggeva `grand||total` (assenti) → ordine con
> `total=0` → `createSaleFromOrder` → **ogni vendita registrava €0**, azzerando i KPI.
> È esattamente il tipo di difetto che la canonicalizzazione elimina alla radice.

### 3.1 Entità canoniche e campi autoritativi

| Entità | Store canonico | Campo-totale autoritativo | Alias legacy da assorbire (via adapter) |
|---|---|---|---|
| **Partner** (cliente/fornitore/lead) | `erp_partners` | — | `clients`, `suppliers` (ruolo = attributo) |
| **Preventivo** | `quotes` | `grossPrice` (lordo), `netPrice` (netto) | `grand`, `total` |
| **Ordine** | `orders` | `total` (lordo), `subtotal` (netto) | `value`, `amount`; `pipeline` = vista |
| **Vendita** | `sales` | `amount` | — (status `pagato`/`da_pagare`) |
| **Articolo** | `items` | `costPrice`, `salePrice` | `inventory`, `materials`, `components`, `gadgets`, `paints` |

**Regola d'oro dati:** un consumatore non deve mai indovinare il nome del campo. Finché gli store
non sono unificati, i **punti di lettura** usano un accessor tollerante unico
(es. `amountOf(order)` → `total||value||grossPrice||amount||0`) — già applicato come fix puntuale,
da promuovere a helper condiviso in Fase 1.

### 3.2 Sequenza di consolidamento (idempotente, con backup)

1. **`orders` ⇄ `pipeline`**: `orders` sorgente di verità; `pipeline` ricostruita come proiezione.
   Migrazione: nessun ordine perso, Kanban invariato per l'utente (test di regressione dedicato).
2. **`clients` → `erp_partners`**: mappa 1:1 su `email`/`vat` (indici già presenti, riga 8558),
   `clients` resta come vista legacy finché l'UI non punta a `erp_partners`.
3. **cataloghi magazzino → `items`**: mappatura campo-per-campo, riconciliazione valore/quantità
   identici pre/post (invariante di test).

Ogni passo: `erp_migrations` registra versione+esito; backup completo prima; conteggi pre/post.

---

## 4. Formule di business — fonte unica testabile

Default reali trovati nel codice (da promuovere a **modulo puro `pricing` testabile**, oggi
intrecciato nel `Quoter`, const ~riga 13091):

| Parametro | Default nel codice | Fonte KB (`ecommerce-rules`) | Azione |
|---|---|---|---|
| Markup default | 40% (settings) / 100% per-riga (quoter) | B2C ×3, B2B ×2–2.5, Etsy ×3.5 | Riconciliare: il markup canale è la regola KB. |
| Costo macchina | €0,38/min | — | Confermare con KB macchine. |
| Costo lavoro | €0,50/min | **€18/h = €0,30/min** | ⚠️ **Divergenza da riconciliare** (overhead incluso? decidere e documentare in DECISIONS.md). |
| Arrotondamento | — | a `,90` | Portare nel modulo pricing. |
| Minimi psicologici | — | ordine ≥€15, portachiavi €6,90, ecc. | Validazione hard nel modulo pricing. |

> La `skill kb-audit` / agente `kb-auditor` esiste già per questo audit: va eseguita sezione per
> sezione e le divergenze annotate, non corrette alla cieca.

---

## 5. Strategia di migrazione (strangler-fig)

```
v68 (oracle di comportamento)  ──►  adapter verificato  ──►  dominio canonico INGLYERP
         │  input/output/dati confrontati ad ogni passo  ▲
         └──────────── si spegne il vecchio solo dopo match ─┘
```

- **Per ogni funzione migrata**: stessi input → stessi output → stessi dati prodotti, prima di
  disattivare il percorso legacy. Confronto automatizzato, non a vista.
- **v68 continua in produzione** (asset reale: single-file, offline, zero-ops, CSP-safe) mentre i
  domini vengono estratti. Nessuna finestra di "tool fermo".
- **Ordine di estrazione consigliato** (per valore/rischio): Vendite (quote→order→sale, già
  testato) → Magazzino (`items`) → Acquisti → Produzione verticale (BOM/job card) → Portale
  clienti/approvazione grafiche → Multi-utente/SaaS.

---

## 6. Suite di test E2E + Release Gate

Livelli (dal `INGLY_TEST_PLAN.md`, estesi):

| Livello | Oggetto | Strumento | Stato |
|---|---|---|---|
| Sintassi | tutti gli `<script>` | `verify-syntax.mjs` | ✅ attivo (138 blocchi, 0 err) |
| Smoke | boot + **108 sezioni**, 0 pageerror | Playwright `file://` | ✅ eseguito in questa sessione |
| E2E flusso ricavi | preventivo→ordine→vendita, importi, persistenza | Playwright + IDB | ✅ verde dopo fix €0 |
| E2E incassi/fatture | `da_pagare→pagato`, fattura da ordine | Playwright + IDB | ⏳ prossimo giro |
| Regressione formule | pricing nuovo vs v68 (oracle) | node harness | ⏳ da costruire col modulo pricing |
| Migrazioni | idempotenza, conteggi pre/post, round-trip backup | node + IDB | ⏳ al primo consolidamento |

**Release gate (blocco rilascio):** verde solo se → verify-syntax OK · smoke 0 pageerror · E2E
flussi critici verdi · nessun errore critico · backup/restore verificato. Mappa alle skill
proprietarie proposte dall'analisi:

| Skill INGLY da creare | Gate che presidia |
|---|---|
| `ingly-release-gate` | blocca rilascio su test mancanti/errori critici |
| `ingly-erp-integrity` | coerenza preventivi↔ordini↔stock (invarianti §3) |
| `ingly-data-migration` | import senza perdita chiavi/allegati/link |
| `ingly-ui-regression` | niente ritorno di button giganti/overflow/sidebar rotte |
| `ingly-pricing-validation` | confronto costi/prezzi nuovi vs v68 (§4) |
| `ingly-laser-qa` | validazione SVG/DXF, livelli CUT/ENGRAVE (GATE 6) |
| `ingly-legacy-mapper` | censimento moduli/dipendenze (questo documento ne è il seme) |

---

## 7. Sulla scelta di stack (nota di merito)

L'analisi propone React/TS + NestJS + PostgreSQL + Supabase. **Valida come direzione SaaS futura**,
ma:
- il monolite offline/zero-ops è un **asset** per uno studio piccolo, non solo debito;
- un rewrite big-bang è il modo classico di uccidere un prodotto che funziona;
- la roadmap dell'analisi stessa è, letta bene, **incrementale** (strangler), coerente con §5.

→ **Raccomandazione:** non impegnare budget/mesi nel rewrite finché la Fase 0 non ha prodotto il
modello canonico e il gate di test. A quel punto la decisione "estrarre su stack moderno vs
continuare in-place" si prende **sui dati**, con il rischio misurato — non sulla fiducia.

---

## 8. Decisioni che servono da te (poche, nette)

1. **Partner canonico `erp_partners`** con `clients` come vista: approvi la direzione? (è già il
   target dichiarato dal codice).
2. **Ordine canonico `orders`**, `pipeline` come proiezione: approvi?
3. **Costo lavoro**: €0,50/min (codice) o €0,30/min = €18/h (KB)? Quale è la verità da fissare?
4. Prossimo dominio da estrarre per primo: confermi **Vendite/incassi** (già il più avanti nei test)?

> Finché non decidi, proseguo in modo non distruttivo: completo la suite E2E sui flussi critici
> (incassi/fatture/magazzino) e annoto le divergenze KB, senza toccare la logica di business.
