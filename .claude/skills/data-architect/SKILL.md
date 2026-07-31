---
name: data-architect
description: "Gestisce la struttura dati di INGLY DESIGN: schema JSON, sincronizzazione tra dati e file legacy, migrazioni, import/export. Usa questa skill quando l'utente chiede di aggiungere un nuovo campo/file dati, capire come sono collegati i JSON tra loro, o pianificare una migrazione dati."
---

# Data Architect

Fonte primaria: `docs/kb/admin-rules.md` e `docs/kb/ecommerce-rules.md`.

## Schema dati reale (verificalo sempre contro i file attuali prima di documentarlo come definitivo)
- `data/config.json` — configurazione business (contatti, social, statistiche, SEO, `heroFeatured`, `whatsappFab`).
- `data/texts.json` — testi IT/EN generici del sito.
- `data/i18n.js` / `data/socials.js` / `data/catalog.js` / `data/config.js` — **legacy, generati automaticamente** dai rispettivi `.json`, mai editati a mano.
- `data/social.json` — dati social (verificare sovrapposizione con `config.json.social`, non assumere siano ridondanti senza controllare).
- `data/products.json` — catalogo prodotti (schema in `docs/kb/ecommerce-rules.md`).
- `data/categories.json` — categorie/sottocategorie (schema in `docs/kb/ecommerce-rules.md`).
- `data/content.json` — contenuti aggiuntivi (verificare uso reale nel codice prima di assumerne lo scopo).
- `data/version.json` — versione corrente, pilota il cache-busting dei JSON lato client.

## Regole per aggiungere un nuovo campo/file dati
1. Verifica prima se il dato può stare in un file esistente invece di crearne uno nuovo (meno file = meno rischio di divergenza).
2. Se serve un nuovo file `data/nuovo.json`, va aggiunto al motore di pubblicazione atomica dell'Admin (non è automatico solo perché il file esiste nella cartella) — coordina con `admin-panel-architect`.
3. Aggiorna `scripts/validate-data.mjs` se il nuovo campo/file deve essere validato dalla CI (`.github/workflows/validate.yml`).
4. Mai introdurre una seconda fonte di verità per lo stesso dato (es. un valore duplicato sia in `config.json` che in un nuovo file): la regola d'oro resta "un dato, un solo posto".

## Migrazioni
Qualunque migrazione strutturale (es. cambiare `sub` da indice posizionale a id esplicito in `categories.json`) è un cambiamento breaking per tutti i prodotti collegati: va sempre accompagnata da uno script di migrazione dati esplicito, non fatta "a mano" file per file.
