-- INGLY OS V2 — Rollback 0035 bank_account.
drop trigger if exists bank_account_del_perm on public.bank_account;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'finance.bank';
delete from security.role_perm_cache where resource = 'finance.bank';
delete from public.permission where resource = 'finance.bank';
drop table if exists public.bank_account;
