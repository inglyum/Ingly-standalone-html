-- INGLY OS V2 — Team & HR (team_member).
-- STAGING ONLY. Additiva e reversibile. Anagrafica collaboratori con costo
-- orario interno (alimenta analisi marginalità/manodopera). Riusa RBAC/tenant
-- di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000033_team_member_down.sql
-- ==========================================================================

create table if not exists public.team_member (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  name text not null,
  role text,                            -- ruolo operativo (libero)
  email text,
  phone text,
  hourly_cost numeric check (hourly_cost is null or hourly_cost >= 0),
  active boolean not null default true,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists team_member_tenant_idx on public.team_member (tenant_id);

insert into public.permission (resource, action) values
  ('system.team','read'),('system.team','create'),
  ('system.team','update'),('system.team','delete')
on conflict (resource, action) do nothing;

-- Dati HR sensibili: lettura OWNER/ADMIN/MANAGER (non SALES/VIEWER).
insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'system.team', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read' and r.key in ('OWNER','ADMIN','MANAGER'))
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'system.team'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.team_member enable row level security;
drop policy if exists team_member_sel on public.team_member;
create policy team_member_sel on public.team_member for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.team','read') );
drop policy if exists team_member_ins on public.team_member;
create policy team_member_ins on public.team_member for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.team','create') );
drop policy if exists team_member_upd on public.team_member;
create policy team_member_upd on public.team_member for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.team','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists team_member_del_perm on public.team_member;
create trigger team_member_del_perm before update on public.team_member
  for each row execute function public.crm_enforce_delete_perm('system.team');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
