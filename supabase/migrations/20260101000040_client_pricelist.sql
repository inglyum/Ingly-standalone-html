-- INGLY OS V2 — Listini per cliente (client_pricelist). Pattern v96
-- client_pricelists + enhanceListino. STAGING ONLY. Additiva e reversibile.
-- Prezzo/sconto CONCORDATO per (cliente, prodotto): lo Smart Quoter lo applica
-- in automatico. Riusa RBAC/tenant di 0006. Dipende da: 0001, 0006, 0007.
-- Rollback: supabase/rollback/20260101000040_client_pricelist_down.sql
-- ==========================================================================

create table if not exists public.client_pricelist (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  customer_id uuid not null references public.customer(id) on delete cascade,
  product_id uuid not null references public.catalog_product(id) on delete cascade,
  agreed_price numeric check (agreed_price is null or agreed_price >= 0),
  discount_pct numeric not null default 0 check (discount_pct >= 0 and discount_pct <= 95),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz,
  unique (customer_id, product_id)
);
create index if not exists client_pricelist_cust_idx on public.client_pricelist (tenant_id, customer_id);

insert into public.permission (resource, action) values
  ('sales.pricelist','read'),('sales.pricelist','create'),
  ('sales.pricelist','update'),('sales.pricelist','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'sales.pricelist', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'sales.pricelist'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.client_pricelist enable row level security;
drop policy if exists client_pricelist_sel on public.client_pricelist;
create policy client_pricelist_sel on public.client_pricelist for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.pricelist','read') );
drop policy if exists client_pricelist_ins on public.client_pricelist;
create policy client_pricelist_ins on public.client_pricelist for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.pricelist','create') );
drop policy if exists client_pricelist_upd on public.client_pricelist;
create policy client_pricelist_upd on public.client_pricelist for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.pricelist','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists client_pricelist_del_perm on public.client_pricelist;
create trigger client_pricelist_del_perm before update on public.client_pricelist
  for each row execute function public.crm_enforce_delete_perm('sales.pricelist');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
