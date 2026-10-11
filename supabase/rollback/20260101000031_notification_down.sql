-- INGLY OS V2 — Rollback 0031 Notification Center.
drop trigger if exists notification_del_perm on public.notification;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'system.notification';
delete from security.role_perm_cache where resource = 'system.notification';
delete from public.permission where resource = 'system.notification';
drop table if exists public.notification_delivery;
drop table if exists public.notification;
