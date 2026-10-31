-- INGLY OS V2 — Rollback 0032 workspace_note.
drop trigger if exists workspace_note_del_perm on public.workspace_note;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'tools.workspace';
delete from security.role_perm_cache where resource = 'tools.workspace';
delete from public.permission where resource = 'tools.workspace';
drop table if exists public.workspace_note;
