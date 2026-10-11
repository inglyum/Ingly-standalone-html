-- INGLY OS V2 — Notification Center (notification + notification_delivery).
-- STAGING ONLY. Additiva e reversibile. Centro notifiche basato su EVENTI con
-- CONSEGNE TRACCIATE (stati distinti). La consegna reale passa da adapter
-- server-side (email/WhatsApp/webhook): finché i provider non sono configurati,
-- l'adapter MOCK simula il workflow ed è etichettato come simulazione — nessun
-- invio reale dichiarato (command §6/§12). wa.me = apertura manuale, mai
-- "delivered" automatico. Riusa RBAC/tenant di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000031_notification_down.sql
-- ==========================================================================

create table if not exists public.notification (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  event text not null,                 -- subscription_expiring/payment_failed/...
  channel text not null default 'in_app'
    check (channel in ('in_app','email','whatsapp','webhook')),
  recipient text,                      -- email / telefono / url webhook / user id
  subject text,
  body text,
  status text not null default 'queued'
    check (status in ('queued','processing','accepted','delivered','failed','cancelled')),
  provider text,                       -- 'mock' | 'email:...' | 'whatsapp:...'
  error text,
  attempts int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists notification_tenant_idx on public.notification (tenant_id, created_at desc);
create index if not exists notification_status_idx on public.notification (status) where deleted_at is null;

-- Registro dei TENTATIVI di consegna (un record per tentativo/transizione).
create table if not exists public.notification_delivery (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  notification_id uuid not null references public.notification(id) on delete cascade,
  provider text,
  status text not null,                -- stato risultante del tentativo
  detail text,
  at timestamptz not null default now()
);
create index if not exists notification_delivery_notif_idx on public.notification_delivery (notification_id, at);

-- PERMESSI system.notification (matrice CRM): lettura a tutti i ruoli operativi;
-- scrittura OWNER/ADMIN/MANAGER/SALES; delete OWNER/ADMIN/MANAGER.
insert into public.permission (resource, action) values
  ('system.notification','read'),('system.notification','create'),
  ('system.notification','update'),('system.notification','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'system.notification', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'system.notification'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.notification enable row level security;
alter table public.notification_delivery enable row level security;

drop policy if exists notification_sel on public.notification;
create policy notification_sel on public.notification for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.notification','read') );
drop policy if exists notification_ins on public.notification;
create policy notification_ins on public.notification for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.notification','create') );
drop policy if exists notification_upd on public.notification;
create policy notification_upd on public.notification for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.notification','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop policy if exists notification_delivery_sel on public.notification_delivery;
create policy notification_delivery_sel on public.notification_delivery for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.notification','read') );
drop policy if exists notification_delivery_ins on public.notification_delivery;
create policy notification_delivery_ins on public.notification_delivery for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'system.notification','update') );

drop trigger if exists notification_del_perm on public.notification;
create trigger notification_del_perm before update on public.notification
  for each row execute function public.crm_enforce_delete_perm('system.notification');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
