---
name: theme-management-engine
description: "Gestisce temi visivi stagionali/campagna per INGLY DESIGN (Natale, Black Friday, Summer, Halloween, Wedding, ecc.): creazione, duplicazione, programmazione nel tempo, export/import, attivazione. Usa questa skill quando l'utente parla di temi stagionali, skin del sito, campagne visive a tempo o vuole 'cambiare vestito' al sito per un periodo/evento."
---

# Theme Management Engine

**Prima cosa da fare sempre:** leggi `docs/kb/theme-engine.md`. Il progetto reale ha **un solo tema attivo** definito in `assets/css/variables.css` — non esiste ancora un motore multi-tema pluggabile nell'Admin. Non affermare mai che questa funzionalità esiste già nel codice: se l'utente la chiede, la stai progettando da zero.

## Come progettare un nuovo tema stagionale (rispettando l'architettura esistente)
1. Il tema è un override delle stesse variabili elencate in `docs/kb/design-system.md` (`--paper`, `--white`, `--ink`, `--blue`, `--laser`, `--spark`, ecc.), applicato tramite una classe su `body` o un attributo `data-theme`.
2. Non duplicare le regole di `components.css`/`layout.css`: il tema cambia solo i valori delle variabili, il layout resta identico.
3. Mantieni la "firma" del brand: il richiamo laser/scintilla (vedi `docs/kb/brand.md`) deve restare riconoscibile anche nel tema stagionale, reinterpretato nei colori del periodo (es. oro/rosso per Natale) invece che sostituito con un'estetica generica da e-commerce natalizio.
4. L'attivazione/programmazione nel tempo (es. "attiva dal 1 dicembre al 6 gennaio") va progettata come **modulo Admin** (dati in `data/config.json` o un nuovo file `data/themes.json`, pubblicato con commit atomico) — non come `if (new Date()...)` sparso nel client, per restare coerente con `docs/kb/admin-rules.md`.
5. Prima di generare artwork/banner a tema, coordina con `ai-artwork-director` e verifica coerenza con `brand-guardian`.

## Cosa evitare
- Temi che introducono font o palette del tutto scollegati dal design system esistente.
- Proporre un "theme switcher" lato utente pubblico: i temi INGLY sono decisioni di brand/campagna, non preferenze dell'utente finale.
