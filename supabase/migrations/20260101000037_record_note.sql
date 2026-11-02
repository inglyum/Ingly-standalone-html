-- INGLY OS V2 — Chatter & Activities (record_note), pattern Odoo mail.thread.
-- STAGING ONLY. Additiva e reversibile. UNA tabella polimorfica (entity_type +
-- entity_id) per note/messaggi e attività/promemoria su QUALUNQUE record
-- (cliente, ordine, preventivo, fattura, commessa, prodotto...). Niente tabelle
-- per-modulo. Riusa RBAC/tenant di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000037_record_note_down.sql
-- ==========================================================================

create table if not exists public.record_note (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  entity_type text not null,            -- 'customer' | 'order' | 'quote' | ...
  entity_id text not null,              -- id del record collegato (uuid come testo)
  kind text not null default 'message'
    check (kind in ('message','activity')),
  body text not null,
  activity_type text                    -- 'call'|'email'|'meeting'|'todo' (solo activity)
    check (activity_type is null or activity_type in ('call','email','meeting','todo')),
  due_date date,                        -- scadenza (solo activity)
  done boolean not null default false,  -- attività completata
  done_at timestamptz,
  author text,                          -- email/nome autore (display)
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists record_note_entity_idx on public.record_note (tenant_id, entity_type, entity_id, created_at desc);
create index if not exists record_note_activity_idx on public.record_note (tenant_id, kind, done, due_date) where deleted_at is null;

insert into public.permission (resource, action) values
  ('tools.chatter','read'),('tools.chatter','create'),
  ('tools.chatter','update'),('tools.chatter','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'tools.chatter', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'tools.chatter'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.record_note enable row level security;
drop policy if exists record_note_sel on public.record_note;
create policy record_note_sel on public.record_note for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.chatter','read') );
drop policy if exists record_note_ins on public.record_note;
create policy record_note_ins on public.record_note for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.chatter','create') );
drop policy if exists record_note_upd on public.record_note;
create policy record_note_upd on public.record_note for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'tools.chatter','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists record_note_del_perm on public.record_note;
create trigger record_note_del_perm before update on public.record_note
  for each row execute function public.crm_enforce_delete_perm('tools.chatter');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
