# Functional Gaps — INGLY OS SaaS (FASE ZERO)

**Data:** 2026-10-11 · Sorgenti target: `saas-source/INGLY-OS_14.html` (OS v96), `saas-source/INGLY-CLOUD-ADMIN_11.html`
Ogni gap: ID · modulo · gravità · evidenza · rischio · soluzione · test · blocco.

| ID | Modulo | Grav. | Evidenza | Rischio | Soluzione | Blocco |
|---|---|---|---|---|---|---|
| FG-1 | Integrazione OS↔Admin | P0 | OS usa IndexedDB locale; Admin usa Supabase REST; nessuna fonte condivisa | Dati utenti/piani/sessioni non allineati; "SaaS" solo apparente | Backend unico come fonte autorevole; IDB come cache offline + coda sync idempotente | Credenziali Supabase |
| FG-2 | Identity/Tenancy | P0 | Nessun concetto di Organization/Tenant nei file | Impossibile isolare dati tra clienti paganti | Modello tenant + RLS per-tenant + membership | Credenziali Supabase |
| FG-3 | Auth reale | P0 | Login/role lato client (OS+Admin) | Accessi aggirabili; nessun MFA admin | Supabase Auth (verifica email, reset, MFA admin, sessioni) | Credenziali Supabase |
| FG-4 | Billing/Subscriptions | P1 | Riferimenti Stripe nel frontend; piani non verificati server-side | Piano modificabile dal browser; incassi non garantiti | Stripe lato server + webhook firmati idempotenti + verifica piano server | Credenziali Stripe |
| FG-5 | Error handling | P0 | 505 `catch(){}` vuoti (OS), 23 (Admin) | Perdita dati silenziosa | Classificare e gestire per categoria (log+UI+blocco conferma+retry) | — (iterativo, no credenziali) |
| FG-6 | Costing engine unico | P1 | Formule prezzo potenzialmente duplicate tra lasercalc/laser_b2b/catalog | Incoerenza prezzi/margini tra moduli | Motore di costo centralizzato riusato (command §8) | — |
| FG-7 | Conversione preventivo→ordine idempotente | P1 | Da verificare: doppio submit crea 2 ordini? | Ordini duplicati | Chiave idempotenza + snapshot prezzo/quantità | — (serve test su monolite) |
| FG-8 | Notifiche con stato consegna | P1 | `wa.me` = apertura manuale; email provider non confermato | "Inviato" confuso con "consegnato" | Coda + stati queued/accepted/delivered/failed + retry | Credenziali provider |
| FG-9 | Audit log | P1 | Non riscontrato un log eventi strutturato server-side | Nessuna tracciabilità operazioni sensibili | Audit events (timestamp, attore, tenant, azione, esito) | Credenziali Supabase |
| FG-10 | Backup verificato | P1 | Sezione `backup` presente; verifica ripristino non dimostrata | Backup "riuscito" ma non ripristinabile | Backup + verifica integrità + prova ripristino | — (parziale) |
| FG-11 | Harness verifica monolite | P0 | Nessun syntax-check per i monoliti | Modifiche non verificabili | Harness parse `<script>` + secret-scan | — ✅ in corso |

**Distinzione obbligatoria (command §4):** FG-5, FG-11 sono **difetti riprodotti**; FG-1/2/3/4/8/9 sono gap architetturali **bloccati da credenziali/decisioni**; FG-6/7/10 richiedono verifica mirata sul monolite prima di classificarli come difetto confermato.
