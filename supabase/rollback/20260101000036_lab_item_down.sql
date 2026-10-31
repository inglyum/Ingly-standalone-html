-- INGLY OS V2 — Rollback 0036 lab_item.
drop trigger if exists lab_item_del_perm on public.lab_item;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'tools.lab';
delete from security.role_perm_cache where resource = 'tools.lab';
delete from public.permission where resource = 'tools.lab';
drop table if exists public.lab_item;
