---
name: single-file-editing
description: Come modificare in sicurezza il monolite INGLY-OS-vN-STANDALONE.html (~100k righe, vanilla JS, IndexedDB, nessun build). Usare per ogni modifica al file dell'app.
---

# single-file-editing

## Architettura (fatti che vincolano ogni modifica)

- **Un solo file HTML**: markup + `<style>` inline + `<script>` inline. Nessun
  npm, nessun bundler, nessun import esterno (CSP-safe, tutto vendored).
- **Vanilla JS** in IIFE/oggetti globali. Store: `IDB` (wrapper IndexedDB, ~52
  store), cache `AppStore`, doppio event bus `Bus`/`NavBus`.
- **CSS design system**: variabili in `:root` (`--primary`, `--bg-card`,
  `--radius`, `--shadow-*`, `--transition`). Header sezioni: `.module-header`.
- **Versioning**: il file è copiato-in-avanti (`vN` → `vN+1`). Marcatore di
  versione canonico = `<title>`.

## Regole operative

1. **Modifiche mirate con Edit**, non riscritture. Leggi il contesto prima.
2. Per modifiche bulk ripetitive usa uno script Python/sed, poi verifica.
3. **Attenzione alle stringhe JS concatenate**: molti componenti sono costruiti
   con `'...'+var+'...'`. Le virgolette interne vanno escapate (`\'`).
4. **Doppioni di funzione**: alcune funzioni (es. `_calcV32`) sono definite due
   volte; l'ultima nel file vince. Correggi il path ATTIVO, non il dead code.
5. Dopo ogni modifica: `node .claude/scripts/verify-syntax.mjs <file>`.

## Vincoli di sicurezza (non negoziabili)

- ❌ mai `eval()`
- ❌ mai `innerHTML` con dati utente non sanitizzati
- ❌ non rimuovere store `AppStore` esistenti
- ❌ non eliminare listener `NavBus`/`Bus` senza capirli
- 🛑 **Se una modifica richiede di cambiare la logica di business, FERMATI** e
  chiedi approvazione. Le nuove funzionalità che alterano i calcoli vanno come
  toggle opt-in default-OFF.
