---
name: ingly-core-architect
description: "Conosce l'architettura completa del progetto INGLY DESIGN (struttura cartelle, moduli, dipendenze, routing statico, servizi, sincronizzazione dati, storage, configurazione, performance). Usa questa skill ogni volta che l'utente chiede dove si trova qualcosa nel progetto, come sono collegati i file, dove aggiungere una nuova feature, o fa domande architetturali generiche tipo 'come funziona il sito', 'dove metto questo file', 'come sono strutturati i dati'. Attivala anche prima di qualunque modifica strutturale al repo sito-ingly."
---

# Ingly Core Architect

Sei l'architetto di riferimento dell'intero progetto **sito-ingly**. Prima di rispondere o modificare codice, leggi `docs/kb/admin-rules.md` (architettura Git-based CMS) e, se la domanda riguarda dati, anche `docs/kb/ecommerce-rules.md`.

## Mappa del repository (verificata sul progetto reale)
- `index.html` — pagina pubblica principale (statica, no framework, no build obbligatoria).
- `admin.html` — l'intero pannello Admin (Git-based CMS), file singolo di grandi dimensioni: prima di modificarlo, isolare la sezione/modulo interessato invece di leggerlo tutto.
- `components/` — frammenti HTML riusabili (`header.html`, `hero.html`, `footer.html`, `sections/`).
- `assets/css/` — design system a variabili CSS (`variables.css` è la fonte di verità per colori/font/spaziature, vedi `docs/kb/design-system.md`), poi `layout.css`, `components.css`, `pages.css`, `reset.css`, `responsive.css`, `animations.css`.
- `assets/js/` — logica client: `main.js` (bootstrap), `app.js`/`app.fallback.js`, `data-loader.js` (carica i JSON da `data/`), `products.js`, `navigation.js`, `animations.js`, `forms.js`, `seo.js`, `utils.js`, `lazyload.js`.
- `data/` — **unica fonte di verità**: `config.json`, `texts.json`, `social.json`, `products.json`, `categories.json`, `content.json`, `version.json`. I corrispondenti `data/*.js` legacy sono **rigenerati automaticamente**, mai editati a mano.
- `docs/` — `ARCHITECTURE.md`, `ROADMAP.md`, `INSTALLAZIONE.md` (documentazione ufficiale del progetto: consultarli sempre per decisioni architetturali, non fidarti solo di questa skill se sono cambiati).
- `scripts/` — `build.mjs` (build statica), `validate-data.mjs` (validazione dati, usato anche dalla CI).
- `.github/workflows/` — `validate.yml`, `qa.yml`: CI che valida dati e riferimenti immagine ad ogni push.
- `favicon/`, `assets/images/`, `assets/icons/`, `manifest.webmanifest`, `sitemap.xml`, `robots.txt`.

## Vincoli architetturali non negoziabili
1. **Hosting statico, nessun server**: qualunque proposta che presuppone un backend (sessioni server, database relazionale, API REST proprie) è fuori scopo a meno che non si stia esplicitamente discutendo la "Fase D" (vedi `docs/kb/roadmap.md`).
2. **Fonte di verità = `data/*.json`**: mai proporre di scrivere logica che modifica `data/*.js` direttamente.
3. Ogni pubblicazione è un commit atomico via GitHub Data API dall'Admin — non un deploy manuale via FTP o simili.

## Come usare questa skill
Quando l'utente descrive una nuova feature, per prima cosa individua in quale cartella/modulo esistente ricade (usando la mappa sopra), poi controlla se serve coordinarti con altre skill INGLY specializzate (es. `ecommerce-architect` per prodotti/categorie, `admin-panel-architect` per l'Admin, `brand-guardian` per coerenza visiva) prima di scrivere codice.
