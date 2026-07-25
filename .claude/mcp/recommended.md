# MCP Servers consigliati — INGLY Enterprise

Configurazione via `claude mcp` (sessione interattiva) o `.mcp.json`. L'OAuth di
alcuni server va fatto dall'utente in sessione interattiva (non in remoto).

## Fase 1 — Dev workflow (rischio zero)
| Server | Autore | Scopo | Priorità |
|---|---|---|---|
| filesystem | modelcontextprotocol/servers | accesso file controllato | Alta |
| fetch | modelcontextprotocol/servers | recupero pagine/web | Alta |
| git | modelcontextprotocol/servers | operazioni git strutturate | Media |

## Fase 2 — Business (attivare solo se pertinente)
| Server | Scopo | Quando |
|---|---|---|
| Stripe MCP (mcp.stripe.com) | pagamenti/acconti, payment link | quando si incassa online |
| Shopify MCP | catalogo/ordini | se si apre store Shopify |
| Google (Drive/Calendar/Gmail) | documenti, agenda, email | operatività quotidiana |

## Fase 3 — Dati/analytics
| Server | Scopo |
|---|---|
| Postgres/SQLite MCP | quando si aggiunge un DB server-side |
| Windsor.ai | marketing/ads analytics multi-piattaforma |

## Regola
Attiva solo i server che servono a un obiettivo concreto (KB golden rule).
Ogni server aggiunto va documentato in DECISIONS.md con il motivo.
