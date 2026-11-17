# INGLY OS — Shop / Catalogo versatile (proposta struttura)

> Obiettivo: rendere lo Shop/Catalogo versatile per **chi entra per esplorare e comprare**, con tre modalità di vendita — **materiali**, **file digitali**, **prodotti** — e doppio canale **B2B / B2C**.
> Vincoli ERP: non duplicare il catalogo, riusare il modello dati unico (store `catalog`/`products`/`items`, `client_pricelists`), nessun redesign arbitrario del brand, toggle opt-in. Da APPROVARE prima dell'implementazione (tocca logica di vendita).

---

## 1. Idea centrale: un catalogo, quattro TIPI di offerta

Oggi un elemento del catalogo è "piatto" (`name, cost, salePrice, category, tags, active`). Lo rendiamo **poliedrico** aggiungendo un campo **`type`** che cambia comportamento di vendita, prezzo e consegna:

| Tipo | Esempi INGLY | Consegna | Flusso d'acquisto |
|------|--------------|----------|-------------------|
| **`product`** (fisico finito) | Targhe, portachiavi, cake topper, insegne | Spedizione/ritiro | Carrello → checkout → produzione/spedizione |
| **`material`** (materia prima) | Lastre plexiglass, blank legno, vinile, bombolette | Spedizione (spesso B2B) | Carrello → MOQ/sfuso → checkout |
| **`digital`** (file) | File taglio SVG/DXF, template, print-ready, grafiche | **Download immediato** post-pagamento | Carrello → pagamento → link download |
| **`custom`** (su misura) | Personalizzati, incisioni su richiesta, lotti aziendali | Preventivo → acconto → produzione | Configuratore → **preventivo** (no acquisto istantaneo) |

Opzionale 5°: **`service`** (tempo laser, incisione a terzi) — prenotazione a slot.

Questo rispetta il principio "un modulo = una fonte": **stesso store catalogo**, un campo discrimina il comportamento. Niente negozi separati.

---

## 2. Estensione dati (additiva, retro-compatibile)

Aggiungere al record catalogo (default che non rompono i record esistenti):
```js
{
  // ...campi attuali (name, category, tags, active, costPrice, salePrice)...
  type: 'product',          // 'product' | 'material' | 'digital' | 'custom' | 'service'  (default 'product')
  // Prezzi per canale (B2C/B2B) — se assenti, si usa salePrice
  pricing: {
    b2c: { price: 0, vat: 22 },
    b2b: { price: 0, vat: 22, moq: 1, netTerms: 0 }   // MOQ + termini di pagamento
  },
  visibility: { b2c: true, b2b: true },   // dove appare
  // Specifico per tipo:
  digital: { assetId: null, fileName: '', license: 'personal|commercial', maxDownloads: 5 }, // solo type=digital
  material: { unit: 'pz|mq|m|kg', bulkTiers: [] },   // solo type=material (prezzi a scaglioni)
  custom:   { configurable: true, basePrice: 0, leadDays: 7 } // solo type=custom → apre Quoter
}
```
- **B2B già parzialmente pronto**: lo store `client_pricelists` e i moduli `ClientPricing`/`ClientListino` gestiscono prezzi per-cliente → il `pricing.b2b` del catalogo è il **listino di default**, sovrascrivibile dal listino cliente.
- **File digitali**: `digital.assetId` punta a un asset in `image_lib`/documenti; il link di download è firmato/limitato (no URL pubblico permanente).
- Migrazione dati **idempotente** (framework Sprint 1): i record senza `type` diventano `product`, `pricing.b2c.price = salePrice`. Nessun dato perso.

---

## 3. Esperienza di chi esplora e compra (storefront)

### 3.1 Ingresso / scoperta
- **Home shop** con sezioni per **intento**, non solo per categoria:
  - "Pronti da comprare" (product), "Scarica subito" (digital), "Per chi produce" (material/B2B), "Crea il tuo" (custom).
  - Scoperta per **occasione** (matrimonio, business, pet, casa — già nel DNA INGLY) e per **tecnica** (laser, UV, 3D).
- **Filtri versatili**: tipo, categoria, occasione, materiale, prezzo, "personalizzabile", "download".
- **Ricerca** con suggerimenti (riusa `GlobalSearch`).

### 3.2 Card prodotto (adattiva per tipo)
La card mostra segnali diversi per tipo:
- `product`: foto, prezzo, "Personalizza"/"Aggiungi".
- `digital`: badge **"Download immediato"**, licenza, anteprima.
- `material`: unità (mq/pz), **prezzo a scaglioni**, badge B2B se riservato.
- `custom`: **"Richiedi preventivo"** (apre configuratore), lead time.

### 3.3 Scheda prodotto
- Galleria + descrizione + varianti (colore/materiale/dimensione).
- **Blocco prezzo dinamico per canale**: se l'utente è B2B loggato → prezzo wholesale + MOQ + termini; altrimenti B2C.
- `digital`: licenza, formati inclusi, cosa ottieni. `custom`: configuratore inline → stima → "Richiedi preventivo".
- Trust signals (reso, spedizione, made in Sicily) — vedi skill checkout.

### 3.4 Flusso d'acquisto per tipo
- `product`/`material`: carrello → checkout (Stripe/PayPal già presenti) → ordine (→ produzione/spedizione).
- `digital`: pagamento → **link download immediato** (token, scadenza, max download) + email.
- `custom`: **non** entra nel carrello → genera **preventivo** (Quoter) → acconto 50% → ordine di produzione. Riusa il flusso Quote→Order già esistente.

---

## 4. B2B vs B2C (doppio canale, stesso catalogo)

| Aspetto | B2C | B2B |
|--------|-----|-----|
| Accesso | Pubblico | **Login** (area riservata) |
| Prezzi | `pricing.b2c` | `pricing.b2b` + listino cliente (`client_pricelists`) |
| Minimi | — | **MOQ**, ordine minimo |
| Pagamento | Immediato (carta/PayPal) | Immediato **o termini netti** (Net 30…) |
| Catalogo | Completo pubblico | **Catalogo custom per cliente** (solo ciò che vede) |
| Documenti | Ricevuta | Preventivo/Fattura, DDT |
| Riordino | — | **Riordino rapido** dallo storico |

- Un unico catalogo con `visibility.b2c/b2b` decide dove appare ogni articolo (es. i materiali grezzi solo B2B).
- Lo switch di canale è a livello di **sessione/utente** (B2B loggato vede prezzi e articoli suoi) — coerente col futuro backend (la vera auth sarà server-side, vedi Security Audit).

---

## 5. Mappatura ai moduli esistenti (riuso, non duplicazione)

| Funzione | Modulo/store INGLY esistente |
|---------|------------------------------|
| Catalogo | store `catalog`/`products`/`items`, `Catalog`, `CatalogView` |
| Pubblicazione shop | `CatalogPublish`, `CatalogQR`, `CatalogPDF` |
| Configuratore cliente | `_showClientConfigurator` (già via `?cfg=`) → base per `custom` |
| Prezzi B2B | `client_pricelists`, `ClientPricing`, `ClientListino` |
| Preventivo custom | `Quoter` (per-riga) → `PreventivToOrder` |
| Pagamenti | `PaymentWizard`, `StripeLink`, PayPal |
| Varianti | **da aggiungere** (oggi assenti, vedi Domain Model) |
| File digitali | `image_lib`/documenti + nuovo link firmato (**da aggiungere**) |

---

## 6. Cosa usiamo dalle skill installate (a nostro vantaggio)

| Skill installata | Uso concreto per INGLY |
|------------------|------------------------|
| **etsy-digital-products** | Pattern di vendita/consegna **file digitali**: licenze, formati, delivery, anti-pirateria. |
| **shopify-wholesale-channel** | Impianto **B2B**: listini wholesale, MOQ, termini netti, catalogo riservato per cliente. |
| **etsy-custom-orders** | Flusso **custom/personalizzato**: comunicazione, pricing, tempi, policy — core INGLY. |
| **ecommerce-subscription-model** | **Riordino ricorrente** di materiali/consumabili per clienti B2B (replenishment). |
| **shopify-upsell-cross-sell** | Bundle e cross-sell (es. prodotto + file digitale, materiale + accessori). |
| **ecommerce-checkout-optimization** | Ridurre abbandono: trust signals, metodi pagamento, UX checkout per i 3 tipi. |
| **ecommerce-personalization** | Scoperta per occasione/segmento, raccomandazioni (riusa `AIReorder`/`DecisionEngine`). |
| **product-differentiation-shopify** | Posizionamento "made in Sicily / personalizzazione laser" vs concorrenti. |
| **cross-border-ecommerce** | Se si vende fuori IT: IVA/IOSS UE, dogane (rilevante per digital/EU). |

> Nota onesta: queste skill sono **checklist strategiche** (stub), non codice. Il valore è come promemoria di best-practice; l'implementazione resta sui moduli INGLY. La competenza INGLY-specifica sta nelle skill di progetto (`ecommerce-architect`, `product-manager`, `category-manager`, `personalization-expert`).

---

## 7. Implementazione a fasi (allineata alla roadmap ERP)

1. **Fase A (dati)** — campo `type` + `pricing.b2c/b2b` + `visibility` sul catalogo, migrazione idempotente (default `product`, `b2c=salePrice`). Nessuna UI nuova. *Reversibile.*
2. **Fase B (storefront)** — card/scheda adattive per tipo + filtri per intento. Riusa `CatalogView`.
3. **Fase C (B2B)** — area riservata, prezzi wholesale + MOQ + listino cliente, riordino.
4. **Fase D (digital)** — asset + link download firmato/limitato + consegna post-pagamento.
5. **Fase E (custom)** — configuratore → Quoter → acconto (riusa flusso esistente).
6. **Fase F (merchandising)** — bundle, cross-sell, subscription materiali.

Ogni fase: toggle opt-in default-OFF, `verify-syntax` + smoke, backup prima di migrazione dati.

---

## 8. Decisioni che servono da te
1. **Priorità tipi**: quale attivare per primo — digitale, B2B/materiali, o custom?
2. **B2B gating**: catalogo B2B dietro login da subito, o prezzi B2B visibili a tutti?
3. **File digitali**: vendiamo file di taglio/template nostri? (serve policy licenza/anti-copia)
4. Procedo con la **Fase A (dati)** come primo passo non-distruttivo?
