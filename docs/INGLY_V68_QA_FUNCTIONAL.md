# INGLY OS v68 — QA Funzionale (browser reale)

> Test eseguiti aprendo l'ERP completo in un browser reale (Playwright su `file://`) — ciò che la QA v68 originale non aveva potuto fare (il loro Chromium bloccava `file://`). Guidati dall'interfaccia, con verifica su IndexedDB e dopo reload.
> Branch: `claude/ingly-v68-qa`. DB `InglyMasterDB` v31 invariato.

## Metodo
Per ogni flusso: azione dall'UI reale (apertura form, compilazione, salvataggio) → verifica che il dato sia scritto in **IndexedDB** → **reload** della pagina → verifica che il dato **persista**. Dialoghi `confirm()` auto-accettati. Si registrano `pageerror` e `console.error` reali (i fallimenti CDN offline non contano).

## Risultati

### GATE 2 — Runtime & navigazione
| Prova | Esito |
|---|---|
| Navigazione di **tutte le 108 sezioni** | ✅ 108/108, 0 pageerror, 0 console error reali |
| Sezione `crm_pipeline` (era rotta: `ClientPipeline` non definito) | ✅ implementato modulo reale, funziona |
| `Dashboard.updateKPIs` crash su `kpi` undefined | ✅ corretto (guardia) |
| `studio_ai` crash (`AIStudio.render` inesistente) | ✅ corretto (guardia su entrambi i call-site) |
| `esc()` crash su reload con dati (`(s||'').replace` su non-stringa) | ✅ corretto (`String(...)`) |

### GATE 2/4 — CRM (Clienti)
| Prova | Esito |
|---|---|
| Apertura form "Nuovo Cliente" | ✅ |
| `Clients.save()` → scrittura in IndexedDB (`clients`) | ✅ handler reale, dato persistito |
| **Persistenza dopo reload** | ✅ il cliente sopravvive al reload |

### GATE 4 — Catalogo
| Prova | Esito |
|---|---|
| Apertura form prodotto + `Catalog.save()` → `catalog` | ✅ |
| **Persistenza dopo reload** | ✅ |

### GATE 4 — Preventivo → Ordine (flusso critico)
Conversione `QuoterBridge.toOrder(quoteId)` su un preventivo con 3 righe:
| Invariante | Esito |
|---|---|
| Ordine creato in `orders` collegato al preventivo (`originQuote`) | ✅ |
| Valore ordine corretto | ✅ (150 su dato di prova) |
| Preventivo marcato `status:'produzione'` + `orderId` | ✅ |
| **Righe NON perse** (restano nel preventivo collegato) | ✅ nessuna perdita dati |
| **Dedup**: seconda conversione bloccata, nessun ordine duplicato | ✅ |

**Osservazione (non un bug):** l'ordine di produzione porta il **totale** e il **link** al preventivo, non copia le singole righe nell'ordine; il dettaglio resta nel preventivo (accessibile via `originQuote`). Nessun dato perso. Se in futuro serve il dettaglio righe direttamente sull'ordine (es. per la distinta di produzione), è un'estensione pianificabile (GATE 6).

## Da verificare nei prossimi giri
- Ordine → Vendita (`convert`) e Ordine → Fattura; incassi/pagamenti.
- Magazzino: carico/scarico, scorte, riordino, invarianti quantità (GATE 5).
- Acquisti/Fornitori: RFQ → PO → ricezione (GATE 5).
- Produzione/costing per tecnologia (GATE 6).
- Multi-viewport e accessibilità (GATE 2).

> Nota ambiente: gli screenshot dell'app completa non sono producibili in questa sessione (il renderer headless va in crash per il peso del file ~8MB); le verifiche funzionali sono fatte via misure DOM e stato IndexedDB, non visivamente.
