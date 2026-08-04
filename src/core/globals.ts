/* ═══════════════════════════════════════════════════════════════════════════
   INGLY core — CONTRATTI TIPIZZATI dei global del monolite
   I moduli estratti girano dentro il monolite e usano questi global. Qui li
   dichiariamo con tipi, così TypeScript verifica le chiamate (niente `any`
   sparso). Nessun runtime: solo tipi + helper di accesso sicuro.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface IDBApi {
  put(store: string, rec: any): Promise<any>;
  get(store: string, key: any): Promise<any>;
  getAll(store: string): Promise<any[]>;
  del?(store: string, key: any): Promise<void>;
  remove?(store: string, key: any): Promise<void>;
  putBulk?(store: string, records: any[]): Promise<number>;
  clearStore?(store: string): Promise<void>;
  exportAll?(): Promise<Record<string, any[]>>;
}

export interface BusApi {
  on(event: string, cb: (payload?: any) => void): void;
  emit(event: string, payload?: any): void;
}

export interface AppStoreApi {
  get(key: string): Promise<any[]> | any[];
  invalidate?(key: string): void;
  invalidateAll?(): void;
  on?(key: string, cb: () => void): void;
}

export interface AppApi {
  navigate(section: string): void;
}

declare global {
  interface Window {
    IDB?: IDBApi;
    Bus?: BusApi;
    AppStore?: AppStoreApi;
    App?: AppApi;
  }
}

/** Accesso sicuro a un global: ritorna undefined se non ancora presente. */
export const idb = (): IDBApi | undefined => (typeof window !== 'undefined' ? window.IDB : undefined);
export const bus = (): BusApi | undefined => (typeof window !== 'undefined' ? window.Bus : undefined);
export const appStore = (): AppStoreApi | undefined => (typeof window !== 'undefined' ? window.AppStore : undefined);
export const app = (): AppApi | undefined => (typeof window !== 'undefined' ? window.App : undefined);

/** Emette un evento sul Bus se disponibile (no-op altrimenti). */
export function emit(event: string, payload?: any): void {
  try { bus()?.emit(event, payload); } catch { /* ignore */ }
}
/** Naviga a una sezione se App è pronto (no-op altrimenti). */
export function navigate(section: string): void {
  try { app()?.navigate(section); } catch { /* ignore */ }
}
