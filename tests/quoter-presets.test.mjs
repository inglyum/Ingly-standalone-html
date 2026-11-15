// INGLY OS V2 — test estensioni motore per i preset di dominio (Laser/3D/Apparel):
// filamento 3D a grammi, macchina a ore, retro-compatibilità macchina a minuti.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as Q from '../app-v2/src/quoter.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

describe('Motore — filamento 3D (a grammi)', (s) => {
  it(s, 'categoria filament presente nel catalogo lavorazioni', () => {
    assert(Q.WORKING_CATEGORIES.some((c) => c.k === 'filament'), 'filament in WORKING_CATEGORIES');
  });
  it(s, 'grammi × €/kg ÷ 1000, con sfrido/supporti', () => {
    assertEq(Q.computeWorking({ category: 'filament', grams: 50, cost_per_kg: 25, sfrido_pct: 0 }).cost, 1.25);
    assertEq(Q.computeWorking({ category: 'filament', grams: 50, cost_per_kg: 25, sfrido_pct: 5 }).cost, r2(1.25 * 1.05));
    assertEq(Q.computeWorking({ category: 'filament', grams: 0, cost_per_kg: 25 }).cost, 0);
  });
  it(s, 'filament confluisce nel bucket material', () => {
    const b = Q.bucketsFromWorkings([{ category: 'filament', grams: 100, cost_per_kg: 20 }]);
    assertEq(b.buckets.material, 2); assertEq(b.unitCost, 2);
  });
});

describe('Motore — macchina a ore + retro-compatibilità', (s) => {
  it(s, 'stampante 3D: ore × €/ora', () => {
    assertEq(Q.computeWorking({ category: 'machine', hours: 4, cost_per_hour: 0.8 }).cost, 3.2);
  });
  it(s, 'laser legacy (solo minuti) invariato', () => {
    assertEq(Q.computeWorking({ category: 'machine', minutes: 10, cost_per_min: 0.45 }).cost, 4.5);
  });
  it(s, 'minuti + ore si sommano', () => {
    assertEq(Q.computeWorking({ category: 'machine', minutes: 10, cost_per_min: 0.45, hours: 1, cost_per_hour: 1.5 }).cost, 6);
  });
});

describe('Motore — preset di dominio (linea completa)', (s) => {
  it(s, 'preset Stampa 3D: breakdown corretto e prezzo > 0', () => {
    const line = { quantity: 1, markup_pct: 100, vat_rate: 22, workings: [
      { category: 'filament', grams: 50, sfrido_pct: 5, cost_per_kg: 25 },
      { category: 'machine', hours: 4, cost_per_hour: 0.8 },
      { category: 'labor', minutes: 15, hours: 0, rate_per_hour: 18 },
    ] };
    const c = Q.computeLine(line, {});
    assertEq(c.material, r2(1.25 * 1.05)); // filamento nel bucket material
    assertEq(c.machine, 3.2);
    assertEq(c.labor, 4.5);
    assertEq(c.unitCost, r2(r2(1.25 * 1.05) + 3.2 + 4.5));
    assert(c.unitPrice > c.unitCost, 'prezzo con markup > costo');
  });
  it(s, 'preset Apparel: capo+stampa (gadget) + manodopera', () => {
    const line = { quantity: 1, markup_pct: 100, vat_rate: 22, workings: [
      { category: 'gadget', quantity: 1, unit_cost: 6 },
      { category: 'gadget', quantity: 1, unit_cost: 2.5 },
      { category: 'labor', minutes: 10, hours: 0, rate_per_hour: 18 },
    ] };
    const c = Q.computeLine(line, {});
    assertEq(c.extra, 8.5); // due gadget nel bucket extra
    assertEq(c.labor, 3);
    assertEq(c.unitCost, 11.5);
  });
});
