-- INGLY OS V2 — Modelli di preventivo (quote_template). Pattern v96
-- quote_templates + applyTemplate. STAGING ONLY. Additiva e reversibile.
-- Salva una configurazione completa dello Smart Quoter (righe+lavorazioni+
-- opzioni prezzo) come MODELLO riutilizzabile in `doc` (jsonb). Riusa RBAC/tenant
-- di 0006. Dipende da: 0001, 0006.
-- Rollback: supabase/rollback/20260101000039_quote_template_down.sql
-- ==========================================================================

create table if not exists public.quote_template (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenant(id) on delete cascade,
  name text not null,
  category text,
  doc jsonb not null default '{}'::jsonb,   -- snapshot config (lines, workings, opzioni)
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
create index if not exists quote_template_tenant_idx on public.quote_template (tenant_id, created_at desc);

insert into public.permission (resource, action) values
  ('sales.quote_template','read'),('sales.quote_template','create'),
  ('sales.quote_template','update'),('sales.quote_template','delete')
on conflict (resource, action) do nothing;

insert into security.role_perm_cache (role_key, resource, action)
select r.key, 'sales.quote_template', a.action
from public.role r
cross join (values ('read'),('create'),('update'),('delete')) as a(action)
where (a.action = 'read')
   or (a.action in ('create','update') and r.key in ('OWNER','ADMIN','MANAGER','SALES'))
   or (a.action = 'delete' and r.key in ('OWNER','ADMIN','MANAGER'))
on conflict (role_key, resource, action) do nothing;

insert into public.role_permission (role_id, permission_id)
select r.id, p.id
from public.role r
join security.role_perm_cache c on c.role_key = r.key and c.resource = 'sales.quote_template'
join public.permission p on p.resource = c.resource and p.action = c.action
on conflict (role_id, permission_id) do nothing;

alter table public.quote_template enable row level security;
drop policy if exists quote_template_sel on public.quote_template;
create policy quote_template_sel on public.quote_template for select to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.quote_template','read') );
drop policy if exists quote_template_ins on public.quote_template;
create policy quote_template_ins on public.quote_template for insert to authenticated
  with check ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.quote_template','create') );
drop policy if exists quote_template_upd on public.quote_template;
create policy quote_template_upd on public.quote_template for update to authenticated
  using ( tenant_id = any (public.current_tenant_ids()) and public.has_permission(tenant_id,'sales.quote_template','update') )
  with check ( tenant_id = any (public.current_tenant_ids()) );

drop trigger if exists quote_template_del_perm on public.quote_template;
create trigger quote_template_del_perm before update on public.quote_template
  for each row execute function public.crm_enforce_delete_perm('sales.quote_template');
-- ==========================================================================
-- FINE — applicare SOLO in staging dopo dry-run pulito. Non toccare produzione.
-- ==========================================================================
