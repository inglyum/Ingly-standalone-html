-- INGLY OS V2 — Rollback 0038 opzioni prezzo Smart Quoter.
alter table public.sales_quote
  drop column if exists channel,
  drop column if exists express,
  drop column if exists global_discount_pct,
  drop column if exists apply_qty_tiers;
