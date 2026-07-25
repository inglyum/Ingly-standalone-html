# Decision Log — INGLY Enterprise

Registro append-only delle decisioni architetturali. Ogni scelta importante qui.

| Data | Decisione | Motivo | Esito atteso |
|---|---|---|---|
| 2026-07 | Adottato ecosistema `.claude/` (skills, rules, agents, commands, scripts) | Standardizzare e velocizzare lo sviluppo AI-assistito prima di scalare l'app | Sviluppo più rapido, coerente, verificabile |
| 2026-07 | `verify-syntax.mjs` come gate obbligatorio pre-commit | Il monolite non ha build: un errore JS rompe tutto silenziosamente | Zero commit rotti |
| 2026-07 | Versioning copia-in-avanti (vN→vN+1), stabile precedente intoccata | Rollback sempre possibile su un file da 100k righe | Sicurezza dei rilasci |
| 2026-07 | Feature che cambiano calcoli = toggle opt-in default-OFF (es. Express +25%) | Non alterare la logica business esistente senza approvazione | Nessuna regressione economica |
| 2026-07 | UI: layer CSS condiviso `#v49-ui-polish` invece di stili inline per sezione | Una modifica migliora tutte le sezioni; minor superficie di rischio | Grafica coerente app-wide |
| 2026-07 | Data layer resta IndexedDB (`IDB`); Dexie.js valutato ma rimandato | Migrazione tocca logica: da fare a step con approvazione | Stabilità dati |
| 2026-07 | Backend headless (Medusa/Payload) = solo scenario ecommerce reale | Grande pivot; oggi offline-first single-file è adeguato | Decisione differita, documentata |

## Come aggiungere una riga
Data · Decisione · Motivo · Esito atteso. Alla review (trimestrale) aggiorna
l'esito reale.
| 2026-07 | Gating moduli via codice licenza offline (non backend) | Scelta utente: funziona su qualsiasi PC senza infrastruttura | Copie clienti limitate al piano, master piena |
| 2026-07 | Default senza licenza = accesso completo (non Starter) | Non bloccare il proprietario fuori dal proprio tool (regola opt-in) | Nessuna regressione d'uso |
