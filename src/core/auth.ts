/* ═══════════════════════════════════════════════════════════════════════════
   INGLY core — AUTH & RBAC (Fase 2, contratti + logica pura)
   Ruoli, permessi e controllo accessi. La funzione `can()` è pura e testabile;
   i tipi User/Session sono i contratti che il backend implementerà (OIDC, sessioni
   httpOnly). Nessuna infrastruttura richiesta qui.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Role = 'owner' | 'admin' | 'operator' | 'accountant' | 'viewer';

/** Risorse e azioni del gestionale (estendibili). */
export type Resource =
  | 'clients' | 'orders' | 'quotes' | 'catalog' | 'materials' | 'equipment'
  | 'suppliers' | 'cashflow' | 'invoices' | 'payments' | 'settings' | 'users' | 'reports';
export type Action = 'read' | 'write' | 'delete' | 'admin';
export type Permission = `${Resource}:${Action}` | '*';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  tenantId: string;
  active?: boolean;
}
export interface Session {
  userId: string;
  tenantId: string;
  role: Role;
  expiresAt: string; // ISO
  // il token vive in cookie httpOnly lato server — MAI nel client/localStorage.
}

/** Matrice permessi per ruolo. `*` = tutto. */
const MATRIX: Record<Role, Permission[]> = {
  owner: ['*'],
  admin: ['*'],
  operator: [
    'clients:read', 'clients:write', 'orders:read', 'orders:write', 'quotes:read', 'quotes:write',
    'catalog:read', 'catalog:write', 'materials:read', 'materials:write', 'equipment:read',
    'suppliers:read', 'reports:read',
  ],
  accountant: [
    'invoices:read', 'invoices:write', 'payments:read', 'payments:write', 'cashflow:read', 'cashflow:write',
    'orders:read', 'clients:read', 'reports:read',
  ],
  viewer: [
    'clients:read', 'orders:read', 'quotes:read', 'catalog:read', 'materials:read',
    'equipment:read', 'suppliers:read', 'reports:read', 'cashflow:read',
  ],
};

/** Il ruolo può eseguire l'azione sulla risorsa? (puro) */
export function can(role: Role, resource: Resource, action: Action): boolean {
  const perms = MATRIX[role]; if (!perms) return false;
  if (perms.includes('*')) return true;
  if (perms.includes(`${resource}:${action}` as Permission)) return true;
  // 'admin' su una risorsa implica read/write/delete su quella risorsa
  if (action !== 'admin' && perms.includes(`${resource}:admin` as Permission)) return true;
  // 'write' implica 'read'
  if (action === 'read' && perms.includes(`${resource}:write` as Permission)) return true;
  return false;
}

/** Elenco permessi effettivi di un ruolo (per UI/gating). */
export function permissionsOf(role: Role): Permission[] { return MATRIX[role] ? MATRIX[role].slice() : []; }

/** La sessione è valida (non scaduta)? (puro) */
export function isSessionValid(s: Session | null | undefined, now: number = Date.now()): boolean {
  if (!s || !s.expiresAt) return false;
  const t = Date.parse(s.expiresAt);
  return Number.isFinite(t) && t > now;
}
