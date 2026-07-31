---
name: prompt-generator
description: "Genera prompt AI coerenti col brand INGLY DESIGN (palette, composizione, illuminazione, negative prompt, aspect ratio) per la generazione di artwork/immagini. Usa questa skill ogni volta che serve scrivere/rifinire il testo di un prompt per un modello text-to-image, non per giudicare il risultato finale (per quello vedi ai-artwork-director e brand-guardian)."
---

# Prompt Generator

Basati sempre su `docs/kb/prompt-library.md` per struttura e regole; usa `docs/kb/design-system.md` per la palette esatta e `docs/kb/laser-business.md` per materiali/tecniche reali.

## Template di generazione (compila ogni campo, non lasciare placeholder generici)
1. **Soggetto**: prodotto/scena reale, riferito a un id/categoria di `data/products.json` o `data/categories.json` quando esiste.
2. **Materiale/texture**: uno tra quelli in `docs/kb/laser-business.md`, con dettaglio sensoriale reale (venatura, bordo bruciato, lucentezza, strati 3D).
3. **Palette**: 2-3 valori hex presi da `docs/kb/design-system.md`, mai colori inventati.
4. **Illuminazione**: coerente col tema scuro/immersivo (luce direzionale, riflessi, mai flat-light bianco da catalogo economico).
5. **Composizione**: product shot minimal, oppure scena lifestyle se richiesto esplicitamente — mai collage affollati.
6. **Aspect ratio**: `1:1` prodotto/categoria, `16:9` hero/banner, `9:16` social.
7. **Negative prompt**: sempre includere esclusione di loghi/watermark terzi, testo storpiato, mani deformate, stile clipart economico, personaggi coperti da copyright.

## Output
Restituisci sempre il prompt come testo pronto da incollare nel modello scelto, più una riga separata di negative prompt. Se il modello di destinazione non è specificato, chiedi quale (Midjourney/GPT Image/FLUX/Gemini/Ideogram hanno sintassi leggermente diverse) invece di indovinare.

## Da evitare sempre
Prompt che citano marchi, celebrità, opere protette da copyright, o che chiedono di riprodurre un'immagine esistente di un competitor.
