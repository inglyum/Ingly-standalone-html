# Fase 3 — Fisco IT & Pagamenti (contratti pronti)

Stato: **contratti + logica pura pronti e testati**. Manca l'infrastruttura
(intermediario SDI, Stripe, backend) per far girare l'invio reale.

## Cosa c'è già (eseguibile e testato, offline)
- `src/domain/fiscal.ts`
  - `IVA` (22% / 10% / 4% / 0), `splitFromGross` (scorporo B2C), `addVat` (B2B).
  - `formatDocNumber(seq, year, sezionale)` → es. `2026/000123`.
  - `buildInvoiceFromQuote(quote, …)` → **oggetto fattura normalizzato** (righe,
    imponibile, imposta, totale, breakdown IVA) pronto per un intermediario.
  - `buildDepositInvoice(quote, …)` → fattura d'acconto 50% (regola KB).
- `src/domain/payments.ts`
  - `PaymentProvider` (interfaccia provider-agnostica), `PaymentIntent`, stati.
  - `paymentPlan(total, deposit)` → acconto/saldo.
  - `mockProvider()` per sviluppo/test offline (nessuna rete, nessun dato carta).

## Come si completa quando c'è il backend
1. **Fattura Elettronica SDI**: NON gestire il canale SDI in proprio. Usare un
   **intermediario** (Fatture in Cloud / ACube / Aruba) — il backend converte
   l'`Invoice` normalizzato nel loro formato/XML FatturaPA e chiama la loro API.
   I dati emittente (P.IVA, IBAN, sezionale) vivono lato server, mai nel client.
2. **Corrispettivi telematici**: per il B2C senza fattura, tramite lo stesso
   intermediario o RT. La logica IVA di `fiscal.ts` è già la base.
3. **Pagamenti**: implementare `PaymentProvider` con **Stripe** lato server
   (il client riceve solo un client-secret; **nessun dato carta** transita da noi
   → delega PCI). `bonifico`/`contanti` sono provider "manuali".
4. **Riconciliazione bancaria**: PSD2/Open Banking lato server, match per
   causale/importo contro gli `PaymentIntent`.

## Vincoli (regole di sicurezza del progetto)
- Nessun segreto (token intermediario, chiavi Stripe) nel client/bundle.
- Validazione fiscale server-side sempre, anche se pre-validato lato client.
- Numerazione documenti autoritativa lato server (evita duplicati concorrenti).
