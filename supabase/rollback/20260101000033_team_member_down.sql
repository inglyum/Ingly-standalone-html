-- INGLY OS V2 — Rollback 0033 team_member.
drop trigger if exists team_member_del_perm on public.team_member;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'system.team';
delete from security.role_perm_cache where resource = 'system.team';
delete from public.permission where resource = 'system.team';
drop table if exists public.team_member;
