-- INGLY OS V2 — Smart Quoter: Termini & Condizioni per preventivo (stile ERPNext
-- Terms and Conditions). STAGING ONLY. Additiva e reversibile: solo colonna
-- nuova su sales_quote. Rollback: 20260101000041_quote_terms_down.sql
alter table public.sales_quote add column if not exists terms text;
