-- INGLY OS V2 — Lab & Lista Acquisti (lab_item).
-- STAGING ONLY. Additiva e reversibile. Lista attrezzatura/consumabili del
-- laboratorio da acquistare, con costo e stato acquistato. Riusa RBAC/tenant di
-- 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000036_lab_item_down.sql
-- ==========================================================================

create table if not exists public.lab_item (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  name text not null,
  category text,
  quantity numeric not null default 1 check (quantity >= 0),
  unit_cost numeric not null default 0 check (unit_cost >= 0),
  priority text not null default 'normal'
    check (priority in ('low','normal','high')),
  bought boolean not null default false,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists lab_item_tenant_idx on public.lab_item (tenant_id);

insert into public.permission (resource, action) values
  ('tools.lab','read'),('tools.lab','create'),
  ('tools.lab','update'),('tools.lab','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'tools.lab', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'tools.lab'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.lab_item enable row level security;
drop policy if exists lab_item_sel on public.lab_item;
create policy lab_item_sel on public.lab_item for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.lab','read') );
drop policy if exists lab_item_ins on public.lab_item;
create policy lab_item_ins on public.lab_item for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.lab','create') );
drop policy if exists lab_item_upd on public.lab_item;
create policy lab_item_upd on public.lab_item for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.lab','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists lab_item_del_perm on public.lab_item;
create trigger lab_item_del_perm before update on public.lab_item
  for each row execute function public.crm_enforce_delete_perm('tools.lab');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
