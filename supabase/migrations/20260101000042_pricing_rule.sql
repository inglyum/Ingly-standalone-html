-- INGLY OS V2 — Regole prezzo/imposta riutilizzabili (pricing_rule). Concetto
-- ERPNext (Pricing Rule + Tax Template) adattato alla KB INGLY. STAGING ONLY.
-- Additiva e reversibile. Un preset riunisce canale, markup, aliquota IVA,
-- sconti, acconto e termini, applicabili in blocco allo Smart Quoter. Riusa
-- RBAC/tenant di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000042_pricing_rule_down.sql
-- ==========================================================================

create table if not exists public.pricing_rule (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  name text not null,
  regime text,                       -- etichetta regime fiscale (es. "IVA 22%", "Inversione contabile")
  channel text,                      -- B2C / B2B / ETSY / CUSTOM
  markup_pct numeric,                -- markup applicato a tutte le righe
  vat_rate numeric,                  -- aliquota IVA applicata a tutte le righe
  line_discount_pct numeric,         -- sconto riga di default
  global_discount_pct numeric,       -- sconto globale documento
  deposit_pct numeric,               -- acconto %
  express boolean,                   -- express +25%
  apply_qty_tiers boolean,           -- sconti quantità KB
  terms text,                        -- termini & condizioni (PDF)
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists pricing_rule_tenant_idx on public.pricing_rule (tenant_id, created_at desc);

insert into public.permission (resource, action) values
  ('sales.pricing_rule','read'),('sales.pricing_rule','create'),
  ('sales.pricing_rule','update'),('sales.pricing_rule','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'sales.pricing_rule', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'sales.pricing_rule'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.pricing_rule enable row level security;
drop policy if exists pricing_rule_sel on public.pricing_rule;
create policy pricing_rule_sel on public.pricing_rule for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.pricing_rule','read') );
drop policy if exists pricing_rule_ins on public.pricing_rule;
create policy pricing_rule_ins on public.pricing_rule for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.pricing_rule','create') );
drop policy if exists pricing_rule_upd on public.pricing_rule;
create policy pricing_rule_upd on public.pricing_rule for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.pricing_rule','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists pricing_rule_del_perm on public.pricing_rule;
create trigger pricing_rule_del_perm before update on public.pricing_rule
  for each row execute function public.crm_enforce_delete_perm('sales.pricing_rule');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
