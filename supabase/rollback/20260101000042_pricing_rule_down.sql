-- INGLY OS V2 — Rollback 0042 pricing_rule.
drop trigger if exists pricing_rule_del_perm on public.pricing_rule;
delete from public.role_permission rp using public.permission p
  where rp.permission_id = p.id and p.resource = 'sales.pricing_rule';
delete from security.role_perm_cache where resource = 'sales.pricing_rule';
delete from public.permission where resource = 'sales.pricing_rule';
drop table if exists public.pricing_rule;
