-- INGLY OS V2 — Bank & Funds (conti e fondi).
-- STAGING ONLY. Additiva e reversibile. Saldi di conti/casse/fondi, per la vista
-- liquidità. Riusa RBAC/tenant di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000035_bank_account_down.sql
-- ==========================================================================

create table if not exists public.bank_account (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  name text not null,
  kind text not null default 'bank'
    check (kind in ('bank','cash','savings','other')),
  balance numeric not null default 0,
  currency text not null default 'EUR',
  notes text,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists bank_account_tenant_idx on public.bank_account (tenant_id);

insert into public.permission (resource, action) values
  ('finance.bank','read'),('finance.bank','create'),
  ('finance.bank','update'),('finance.bank','delete')
on conflict (resource, action) do nothing;

-- Dati finanziari: lettura OWNER/ADMIN/MANAGER.
insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'finance.bank', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read' and r.key in ('OWNER','ADMIN','MANAGER'))
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'finance.bank'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.bank_account enable row level security;
drop policy if exists bank_account_sel on public.bank_account;
create policy bank_account_sel on public.bank_account for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'finance.bank','read') );
drop policy if exists bank_account_ins on public.bank_account;
create policy bank_account_ins on public.bank_account for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'finance.bank','create') );
drop policy if exists bank_account_upd on public.bank_account;
create policy bank_account_upd on public.bank_account for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'finance.bank','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists bank_account_del_perm on public.bank_account;
create trigger bank_account_del_perm before update on public.bank_account
  for each row execute function public.crm_enforce_delete_perm('finance.bank');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
