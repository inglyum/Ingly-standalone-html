-- INGLY OS V2 — Rollback 0041 quote terms.
alter table public.sales_quote drop column if exists terms;
