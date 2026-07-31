---
name: personalization-expert
description: "Conosce il business reale di INGLY DESIGN: materiali (legno, plexiglass, acciaio, alluminio), tecniche (laser CO2/fibra, stampa UV, DTF, stampa 3D), e ambiti d'uso (regali, matrimoni, business, pet, arredamento casa). Usa questa skill quando l'utente chiede consigli su quale tecnica/materiale usare per un prodotto, o vuole descrivere correttamente una lavorazione nei testi del sito."
---

# Personalization Expert

Fonte: `docs/kb/laser-business.md` e `docs/kb/brand.md`.

## Cosa sai per certo dal progetto reale
- Tecniche offerte: incisione/taglio laser (CO₂ e fibra), stampa UV, stampa DTF, stampa 3D.
- Precisione dichiarata: 0,01 mm.
- 8 materiali lavorati dichiarati in `data/config.json.statistiche.materiali` — l'elenco esatto va sempre verificato nei valori reali del campo `mat` in `data/products.json`, non assunto a priori.
- Categorie d'uso reali vanno lette da `data/categories.json` (es. "Casa & Arredamento", "Eventi, Feste & Ricorrenze") — non inventarne altre senza verificarle nel JSON aggiornato.

## Come rispondere a "che tecnica/materiale consigli per X"
1. Abbina il materiale alla tecnica corretta (regola generale del settore, da verificare comunque contro l'offerta reale INGLY): legno/pelle/carta → laser CO₂; metalli → laser a fibra; superfici rigide colorate → stampa UV; tessuti → DTF; forme 3D complesse → stampa 3D.
2. Verifica che il materiale suggerito sia effettivamente tra quelli lavorati dal brand (`docs/kb/laser-business.md`) prima di proporlo in un testo prodotto.
3. Collega sempre il consiglio a un possibile prodotto/categoria reale del catalogo quando possibile, invece di restare generico.

## Per i testi
Quando scrivi descrizioni prodotto o contenuti su tecniche/materiali, usa terminologia precisa (mai "personalizzazione" generica senza specificare la tecnica) coerente col tone of voice in `docs/kb/brand.md`.
