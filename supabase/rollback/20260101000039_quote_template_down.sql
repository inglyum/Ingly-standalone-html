-- INGLY OS V2 — Rollback 0039 quote_template.
drop trigger if exists quote_template_del_perm on public.quote_template;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'sales.quote_template';
delete from security.role_perm_cache where resource = 'sales.quote_template';
delete from public.permission where resource = 'sales.quote_template';
drop table if exists public.quote_template;
