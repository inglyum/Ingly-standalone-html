-- INGLY OS V2 — Booking (appuntamenti/prenotazioni).
-- STAGING ONLY. Additiva e reversibile. Prenotazioni di servizi/consulenze con
-- stato. Riusa RBAC/tenant di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000034_booking_down.sql
-- ==========================================================================

create table if not exists public.booking (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  customer_id uuid,
  customer_name text,
  service text,
  slot_date date,
  slot_time text,                       -- orario testuale (HH:MM)
  status text not null default 'requested'
    check (status in ('requested','confirmed','done','cancelled')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists booking_tenant_idx on public.booking (tenant_id, slot_date);

insert into public.permission (resource, action) values
  ('ops.booking','read'),('ops.booking','create'),
  ('ops.booking','update'),('ops.booking','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'ops.booking', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'ops.booking'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.booking enable row level security;
drop policy if exists booking_sel on public.booking;
create policy booking_sel on public.booking for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'ops.booking','read') );
drop policy if exists booking_ins on public.booking;
create policy booking_ins on public.booking for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'ops.booking','create') );
drop policy if exists booking_upd on public.booking;
create policy booking_upd on public.booking for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'ops.booking','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists booking_del_perm on public.booking;
create trigger booking_del_perm before update on public.booking
  for each row execute function public.crm_enforce_delete_perm('ops.booking');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
