---
name: brand-guardian
description: "La skill di controllo qualità più importante di INGLY DESIGN: verifica che ogni modifica rispetti l'identità di brand — palette colori, spaziature, tipografia, icone, immagini, illustrazioni, tone of voice, layout, componenti UI, categorie, prompt AI, banner, artwork, pagine, admin panel. Usa SEMPRE questa skill come ultimo controllo prima di considerare completa qualunque modifica visiva o testuale, e ogni volta che l'utente chiede una review di coerenza brand. Se qualcosa non è coerente, segnalalo e proponi una versione allineata invece di limitarti a bocciarla."
---

# Brand Guardian

Questa skill non produce lavoro nuovo: **verifica** lavoro (proprio o dell'utente) rispetto alle fonti di verità del brand. Leggi sempre `docs/kb/brand.md` e `docs/kb/design-system.md`; per prodotti/categorie leggi anche `docs/kb/ecommerce-rules.md`, per artwork `docs/kb/prompt-library.md` e `docs/kb/laser-business.md`.

## Checklist di verifica (percorri tutte le voci pertinenti al contenuto in esame)
- **Colori**: ogni colore usato esiste in `assets/css/variables.css` (o è una variazione di opacità/luminosità coerente)? `--laser`/`--spark` usati solo come accenti scarsi, non su superfici larghe?
- **Tipografia**: `Exo 2` per elementi display/titoli, `Inter` per corpo testo — nessun font esterno introdotto senza motivo?
- **Spaziature/radius/ombre**: valori presi dalla scala in `docs/kb/design-system.md`, non hardcoded a caso?
- **Icone**: usato lo sprite `ingly-icons.svg` con fallback emoji, non librerie icone esterne?
- **Immagini/artwork**: coerenti con `docs/kb/prompt-library.md` (tema scuro/premium, materiali reali, niente loghi terzi)?
- **Tone of voice**: italiano naturale, artigianale-tecnico, mai da marketplace low-cost; testi presenti sia in IT che EN con lo stesso registro?
- **Layout/componenti UI**: riusa componenti esistenti in `components.css`/`layout.css` invece di duplicarli?
- **Categorie/prodotti**: rispettano lo schema e le convenzioni di `docs/kb/ecommerce-rules.md`?
- **Admin panel**: eventuali nuovi moduli rispettano `docs/kb/admin-rules.md` (fonte dati unica, commit atomico)?

## Come rispondere quando trovi un'incoerenza
Non limitarti a dire "non è coerente": indica **esattamente quale regola** viene violata (citando il file/valore corretto della knowledge base) e proponi la versione corretta (colore/font/testo/struttura alternativa). L'obiettivo è sempre allineare, non solo bocciare.

## Priorità
In caso di conflitto tra "quello che chiede l'utente" e "coerenza di brand", segnala sempre il conflitto esplicitamente prima di procedere, invece di scegliere in silenzio.
