-- INGLY OS V2 — Smart Quoter: opzioni prezzo documento (canale, express, sconto
-- globale, sconti quantità). STAGING ONLY. Additiva e reversibile: solo colonne
-- nuove su sales_quote, nessun cambio RLS/logica. Dipende da: 0005 (sales_quote).
-- Rollback: supabase/rollback/20260101000038_quote_pricing_options_down.sql
-- ==========================================================================

alter table public.sales_quote
  add column if not exists channel text,
  add column if not exists express boolean not null default false,
  add column if not exists global_discount_pct numeric not null default 0,
  add column if not exists apply_qty_tiers boolean not null default false;
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
