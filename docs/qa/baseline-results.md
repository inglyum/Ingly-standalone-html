# QA Baseline Results — INGLY OS SaaS (FASE ZERO)

**Data:** 2026-10-11 · Branch `claude/ingly-os-dev-system-ddgv1f`

## Harness introdotto (non distruttivo)
`tests/test-saas-source.mjs` — collegato a `npm test`.

| Controllo | Risultato |
|---|---|
| Blocchi `<script>` JS parsati (syntax check `node --check`) | **154 / 154 OK** |
| Segreti condivisi hardcoded (service_role, sk-ant-, sk_live_, AKIA, PEM) | **0 trovati** |
| File target presenti (`saas-source/*`) | ✅ |

## Baseline verificata dei difetti (riproducibili)
| Metrica | OS v96 | Admin |
|---|---:|---:|
| `catch(){}` vuoti | 505 | 23 |
| Sezioni/viste | 113 | — |
| Persistenza | IndexedDB + localStorage | localStorage + Supabase REST |
| `service_role` hardcoded | 0 | 0 |

## Test pre-esistenti (sito statico, invariati)
`npm test` esegue: `validate-data.mjs`, `test-css.mjs`, `test-admin.mjs`, `test-sito.mjs`, **+ `test-saas-source.mjs`** (nuovo). I primi quattro riguardano il sito pubblico, non i monoliti SaaS; richiedono `jsdom` (dipendenza di dev) per l'esecuzione completa in CI.

## Non ancora testabile (blocchi reali)
- Isolamento multi-tenant / RLS: richiede progetto Supabase (egress + token assenti).
- Billing/webhook Stripe: richiede chiavi Stripe test.
- Consegna notifiche (email/WhatsApp): richiede credenziali provider.
- Conversione preventivo→ordine idempotente (FG-7): richiede esecuzione runtime del monolite in browser (prossimo incremento con Playwright).

## Release gate (command §19) — stato
🔴 **NON rilasciabile come SaaS** finché P0-C (auth/tenant/RLS) non è verificato con credenziali reali. Lo stato attuale è **baseline + guardrail**, non un SaaS production-ready. Nessuna dichiarazione di "zero errori"/"production ready".
