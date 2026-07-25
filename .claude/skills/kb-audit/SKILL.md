---
name: kb-audit
description: Verifica che i valori di business nel tool (prezzi, KPI, soglie, tempi) siano allineati alla INGLY-OS Knowledge Base. Usare quando si toccano quoter, KPI, Decision Engine, finance o si audita una sezione.
---

# kb-audit

La fonte di verità del business è la **INGLY-OS Knowledge Base**. Ogni valore
hardcoded nel tool deve corrispondere alla KB. Questa skill guida l'audit.

## Valori canonici (da PRICING.md / KPI.md / CASHFLOW.md / SALES_PLAYBOOK.md)

| Ambito | Valore KB | Dove nel tool |
|---|---|---|
| Costo lavoro | **€18/h** | tutti i quoter (`labor`, `lh`, `_laborHourly`) |
| Markup canale | B2C ×3 · B2B ×2–2.5 · Etsy ×3.5 | `MU`, `_cfgV32.markup`, channel presets |
| Ordine minimo | **€15** | `Math.max(15, ...)` su ogni `fp` |
| Sconti volume | 10pz −10% · 25pz −15% · 50pz −20% | `sd = qty>=50?.20:qty>=25?.15:qty>=10?.10:0` |
| Ticket medio | ≥ **€45** | Decision Engine `avgOrderValue` |
| Conversione | ≥ **40%** | Decision Engine / KPICoherence `convRate` |
| Ricavi settimana | ≥ **€375** | Decision Engine `weekRev` |
| Margine mensile | ≥ **60%** | AILayer `profitMargin`, KPIEngine |
| Riserva fiscale | **15%** profit-first | `taxReserve` |
| Validità preventivo | **7 giorni** | `validDays`, template PDF |
| Acconto 50% | su ordini > **€50** | Termini & Condizioni |
| Express <48h | **+25%** (opt-in) | toggle quoter |

## Procedura

1. Identifica i valori hardcoded nella sezione toccata (grep mirato).
2. Confronta con la tabella sopra / con il file KB pertinente.
3. Se divergono: correggi verso la KB. Se la KB non copre il caso, **non
   inventare** — segnala e chiedi.
4. `verify-html-build`, poi commit con riferimento al file KB (`PRICING.md`…).

## Golden rule
> Se un'attività non avvicina a €1.500–3.000/mese stabili, linea eventi
> consolidata, aziende ricorrenti o status xTool Creator → è rumore.
