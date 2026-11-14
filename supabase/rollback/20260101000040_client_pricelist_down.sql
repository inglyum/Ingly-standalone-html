-- INGLY OS V2 — Rollback 0040 client_pricelist.
drop trigger if exists client_pricelist_del_perm on public.client_pricelist;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'sales.pricelist';
delete from security.role_perm_cache where resource = 'sales.pricelist';
delete from public.permission where resource = 'sales.pricelist';
drop table if exists public.client_pricelist;
