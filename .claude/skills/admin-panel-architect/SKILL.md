---
name: admin-panel-architect
description: "Responsabile dell'intero Admin Panel di INGLY DESIGN (admin.html): dashboard, sidebar, moduli, widget, CRUD, login, ruoli, permessi, log, backup, versioning, configurazione. Usa questa skill per qualunque richiesta che riguardi il pannello Admin, la pubblicazione/deploy dei contenuti, la Media Library, il Health Center o la cronologia/rollback."
---

# Admin Panel Architect

Leggi sempre prima `docs/kb/admin-rules.md` (riassunto di `docs/ARCHITECTURE.md`) — è la fonte di verità su come funziona davvero l'Admin.

## Modello mentale corretto
L'Admin **non** parla con un server proprio: parla direttamente con l'API di GitHub (Git Data API) usando un token salvato nel browser dell'utente. "Pubblicare" significa creare un commit atomico che contiene JSON modificati + immagini nuove + i file legacy `.js` rigenerati + `version.json` aggiornato. Non esiste uno stato "salvato ma non pubblicato" lato server: o è nel repo (pubblicato) o è solo bozza locale nel browser.

## Moduli esistenti (non inventarne altri senza dirlo esplicitamente)
Dashboard · Prodotti (wizard, gallery, duplica) · Categorie (CRUD, sottocategorie illimitate, controllo integrità riferimenti) · Digitali · Media Library · Portfolio · Home & Hero · Testi IT/EN · FAQ & Recensioni · Sezioni avanzate (editor JSON validato) · Contatti & Social · SEO · Pubblica & Deploy · Cronologia + Rollback · Health Center · Backup · Impostazioni.

## Regole operative quando proponi modifiche all'Admin
1. Ogni nuovo modulo deve produrre modifiche solo a `data/*.json`, mai scrivere direttamente `data/*.js`.
2. Ogni upload immagine deve seguire le convenzioni percorsi in `docs/kb/admin-rules.md` (`img/<id>.webp`, `img/<id>-g<n>.webp`, `img/port-<n>.webp`) e passare per la compressione/WEBP lato browser.
3. Se proponi un controllo di integrità nuovo, valuta se va nel Health Center esistente invece di creare un modulo parallelo.
4. Ricorda: **non esistono demoni permanenti** — automazioni "sempre attive" vanno progettate come GitHub Actions (push-time) o come controlli Health Center (Admin-time), mai come processi server always-on.
5. Sicurezza: token fine-grained per repo, permesso Contents R/W; non proporre mai di loggare/inviare il token altrove.

## Collabora con
`security-manager` per login/ruoli/permessi, `data-architect` per lo schema dei JSON, `ecommerce-architect`/`category-manager`/`product-manager` per i moduli specifici, `ai-automation-engine` per i workflow che toccano l'Admin.
