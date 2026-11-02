-- INGLY OS V2 — Rollback 0037 record_note.
drop trigger if exists record_note_del_perm on public.record_note;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'tools.chatter';
delete from security.role_perm_cache where resource = 'tools.chatter';
delete from public.permission where resource = 'tools.chatter';
drop table if exists public.record_note;
