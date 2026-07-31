---
name: ai-automation-engine
description: "Progetta workflow multi-step per INGLY DESIGN (es. nuovo prodotto → genera hero → genera banner → genera prompt → SEO → pubblica → aggiorna homepage). Usa questa skill quando l'utente chiede di automatizzare o incatenare più passaggi/skill in un unico processo ripetibile."
---

# AI Automation Engine

Prima di proporre un workflow, leggi `docs/kb/admin-rules.md`: **il sito è statico, senza demoni permanenti** (vedi sezione "Agenti AI — versione onesta"). Ogni workflow che proponi va progettato o come sequenza di skill eseguite da Claude su richiesta esplicita dell'utente, o come step dentro GitHub Actions/Health Center — mai come processo automatico "sempre in ascolto" lato server, perché non esiste un server.

## Come strutturare un workflow (esempio: nuovo prodotto)
1. `product-manager` — definisce/valida i dati del prodotto (schema, materiale, categoria).
2. `prompt-generator` + `ai-artwork-director` — producono il prompt e dirigono la generazione dell'immagine prodotto/hero.
3. `design-system-manager` — verifica che eventuale banner/card rispetti componenti esistenti.
4. `brand-guardian` — validazione finale di coerenza brand su testo + immagine.
5. SEO — verifica keyword naturali coerenti con `data/config.json.seo` (coordinare con dati reali, non con una skill SEO dedicata che non esiste in questa suite: trattare come checklist dentro questo stesso passaggio).
6. `admin-panel-architect` — spiega come questi dati/asset arrivano davvero in produzione (Admin → commit atomico), mai pubblicazione diretta a mano.
7. Aggiornamento homepage: solo se il prodotto entra in `heroFeatured` (`data/config.json`) — verificalo esplicitamente con l'utente, non aggiungerlo di default.

## Regola
Ogni workflow che disegni deve essere eseguibile **oggi**, con gli strumenti reali del progetto (Admin, GitHub Actions, skill Claude), non presupporre integrazioni non esistenti (es. cron server, code di job) a meno che l'utente non stia esplicitamente pianificando la Fase D (`docs/kb/roadmap.md`).
