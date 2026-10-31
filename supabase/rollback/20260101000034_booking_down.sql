-- INGLY OS V2 — Rollback 0034 booking.
drop trigger if exists booking_del_perm on public.booking;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'ops.booking';
delete from security.role_perm_cache where resource = 'ops.booking';
delete from public.permission where resource = 'ops.booking';
drop table if exists public.booking;
