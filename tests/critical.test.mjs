// Test dei flussi critici INGLY OS — protegge da regressioni (Fase 0).
import { describe, it, assert, assertEq, withPage } from './harness.mjs';
import { findLatestMonolith } from '../scripts/find-latest.mjs';

const { url, version } = findLatestMonolith();
console.log(`Test su INGLY-OS v${version}`);

describe('Boot & integrità', (s) => {
  it(s, 'carica senza errori JS fatali e con i core pronti', async () => {
    await withPage(url, async (page, errors) => {
      const core = await page.evaluate(() => ({
        App: typeof window.App !== 'undefined',
        IDB: typeof window.IDB !== 'undefined',
        DS: typeof window.DS !== 'undefined',
      }));
      assert(core.App, 'App mancante');
      assert(core.IDB, 'IDB mancante');
      assert(core.DS, 'Design System (DS) mancante');
      assert(errors.length === 0, 'errori console: ' + errors.slice(0, 3).join(' | '));
    });
  });
});

describe('Moduli enterprise presenti', (s) => {
  it(s, 'DS, DataTools, MachineInvest, ERPIntel, AuditLog, MarketHub, InglyIcons', async () => {
    await withPage(url, async (page) => {
      const mods = await page.evaluate(() => ({
        DS: !!window.DS, DataTools: !!window.DataTools, MachineInvest: !!window.MachineInvest,
        ERPIntel: !!window.ERPIntel, AuditLog: !!window.AuditLog, MarketHub: !!window.MarketHub,
        InglyIcons: !!window.InglyIcons,
      }));
      Object.entries(mods).forEach(([k, v]) => assert(v, `modulo ${k} mancante`));
    });
  });
});

describe('Navigazione (no-freeze)', (s) => {
  it(s, 'naviga le sezioni principali sotto soglia di tempo', async () => {
    await withPage(url, async (page) => {
      const secs = ['dashboard', 'clients', 'equipment', 'materials', 'suppliers', 'settings', 'goals', 'kpi'];
      for (const sec of secs) {
        const dt = await page.evaluate((x) => {
          const t0 = performance.now();
          try { window.App.navigate(x); } catch (e) {}
          return performance.now() - t0;
        }, sec);
        assert(dt < 2000, `nav '${sec}' troppo lenta (${Math.round(dt)}ms) — possibile freeze`);
      }
    });
  });
});

describe('Integrità dati IndexedDB', (s) => {
  it(s, 'put/get roundtrip su uno store reale', async () => {
    await withPage(url, async (page) => {
      const ok = await page.evaluate(async () => {
        const rec = { name: 'CI Test Client', _t: Date.now() };
        await window.IDB.put('clients', rec);
        const all = await window.IDB.getAll('clients');
        return all.some((c) => c.name === 'CI Test Client');
      });
      assert(ok, 'record non ritrovato dopo put');
    });
  });

  it(s, 'checkpoint → modifica → restore ripristina lo stato', async () => {
    await withPage(url, async (page) => {
      const r = await page.evaluate(async () => {
        const orig = { name: 'CI Checkpoint Orig', _t: Date.now() };
        await window.IDB.put('clients', orig);
        const id = (await window.IDB.getAll('clients')).find((c) => c.name === 'CI Checkpoint Orig').id;
        const ck = await window.AuditLog.checkpoint('CI test');
        const c = await window.IDB.get('clients', id); c.name = 'CI MODIFIED'; await window.IDB.put('clients', c);
        await window.AuditLog.restore(ck.id);
        await new Promise((res) => setTimeout(res, 300));
        return (await window.IDB.get('clients', id)).name;
      });
      assertEq(r, 'CI Checkpoint Orig', 'restore non ha ripristinato il nome originale');
    });
  });
});
