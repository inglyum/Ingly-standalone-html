-- INGLY OS V2 — Workspace Note (idee/innovazione/strategia/fiera).
-- STAGING ONLY. Additiva e reversibile. UNA tabella per 4 sezioni "appunti"
-- (kind discrimina la vista): niente 4 tabelle quasi identiche (principio
-- "non duplicare"). Riusa RBAC/tenant di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000032_workspace_note_down.sql
-- ==========================================================================

create table if not exists public.workspace_note (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  kind text not null default 'idea'
    check (kind in ('idea','innovation','strategy','fiera')),
  title text not null,
  body text,
  status text not null default 'open'
    check (status in ('open','in_progress','done','archived')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high')),
  tags text[],
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists workspace_note_tenant_idx on public.workspace_note (tenant_id, kind, created_at desc);

insert into public.permission (resource, action) values
  ('tools.workspace','read'),('tools.workspace','create'),
  ('tools.workspace','update'),('tools.workspace','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'tools.workspace', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'tools.workspace'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.workspace_note enable row level security;
drop policy if exists workspace_note_sel on public.workspace_note;
create policy workspace_note_sel on public.workspace_note for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.workspace','read') );
drop policy if exists workspace_note_ins on public.workspace_note;
create policy workspace_note_ins on public.workspace_note for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.workspace','create') );
drop policy if exists workspace_note_upd on public.workspace_note;
create policy workspace_note_upd on public.workspace_note for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.workspace','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists workspace_note_del_perm on public.workspace_note;
create trigger workspace_note_del_perm before update on public.workspace_note
  for each row execute function public.crm_enforce_delete_perm('tools.workspace');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
