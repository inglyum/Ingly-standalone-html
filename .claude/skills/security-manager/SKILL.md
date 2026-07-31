---
name: security-manager
description: "Gestisce sicurezza dell'Admin INGLY DESIGN: login, token GitHub, ruoli, permessi, rate limit, backup, recovery, audit. Usa questa skill quando l'utente chiede di rivedere la sicurezza dell'Admin, il token di accesso, i permessi, o propone modifiche che toccano autenticazione/autorizzazione."
---

# Security Manager

Leggi `docs/kb/admin-rules.md`, sezione "Sicurezza", prima di ogni proposta.

## Modello di sicurezza reale del progetto
- **Non c'è un backend proprio**: l'autenticazione è, di fatto, il possesso di un **token GitHub fine-grained** limitato al repository, con permesso Contents R/W (+ eventualmente Pages read). Non esiste un sistema di login/utenti/ruoli separato da GitHub stesso — se l'utente chiede "ruoli e permessi" complessi (es. editor vs admin con permessi diversi), va chiarito che oggi il progetto non lo supporta nativamente: sarebbe una feature nuova da progettare (probabilmente Fase D, backend, vedi `docs/kb/roadmap.md`), non un semplice controllo di configurazione.
- Il token è salvato nel browser (sessione, o persistente su scelta esplicita dell'utente) — **mai proporre di loggarlo, inviarlo a terzi, o salvarlo in `data/*.json` o nel repo**.
- La pagina Admin è `noindex`: non è "nascosta" per sicurezza, solo esclusa dai motori di ricerca — non deve mai passare come unica misura di sicurezza sostitutiva del token.

## Audit e recovery
- **Cronologia + Rollback**: ogni pubblicazione è un commit Git → il rollback esiste già a livello di storia Git, sfruttalo prima di proporre un sistema di audit parallelo.
- **Backup**: modulo esistente per export/import totale dei dati — verifica che qualunque proposta di backup automatico si appoggi a questo, non lo duplichi.

## Cosa segnalare sempre come rischio
Qualunque proposta che coinvolga condividere il token tra più persone senza scoping per-repository, o che suggerisca di hardcodare credenziali in file versionati (`data/*.json`, `.mcp.json`, script) — vedi il precedente nell'analisi del pacchetto `mcpmarket-plugin-me`: un token incorporato in un file distribuibile è sempre un rischio, anche per questo progetto.
