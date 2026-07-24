# Security Rules — INGLY Enterprise

## Client-side (monolite attuale)
- **Zero `eval` / `new Function`** su dati dinamici. Mai, in nessun caso.
- **Sanitizza prima di `innerHTML`.** Preferisci `textContent` per dati utente.
  Se serve HTML, whitelist di tag o escape esplicito.
- **Nessun segreto nel file.** API key, token, credenziali non vanno mai
  hardcoded nell'HTML standalone (è distribuibile/ispezionabile).
- **CSP-safe:** tutto inline/vendored, nessuna richiesta a host esterni non
  previsti. Non introdurre `<script src>` remoti.
- **IndexedDB:** i dati sono locali al browser dell'utente. Non esporli a
  terze parti senza consenso esplicito.

## Quando si aggiungerà il backend (fase enterprise)
- Autenticazione: OAuth/OIDC, sessioni httpOnly+SameSite, mai token in localStorage.
- Pagamenti: **mai** gestire numeri carta direttamente → Stripe (PCI delega).
- Validazione input server-side sempre, anche se validato lato client.
- Secrets in vault/env, mai nel repo. Rotazione periodica.
- Rate limiting su endpoint pubblici; audit log delle operazioni sensibili.

## Review
Ogni diff passa da `code-reviewer` con focus sicurezza come priorità 2 (dopo
la logica business).
