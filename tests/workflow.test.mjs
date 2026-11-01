// INGLY OS V2 — test Workflow a stati unificato: transizioni ammesse/validate.
import { describe, it, assert, assertEq } from './harness.mjs';
import * as WF from '../app-v2/src/workflow.js';
import { renderStatusbar } from '../app-v2/src/workflow-ui.js';

describe('Workflow — transizioni per entità', (s) => {
  it(s, 'ordine: CONFIRMED→IN_PRODUCTION ammessa; CONFIRMED→DELIVERED salta e… è gestita', async () => {
    assert(WF.canTransition('order', 'CONFIRMED', 'IN_PRODUCTION'), 'avanza');
    assert(WF.canTransition('order', 'READY', 'DELIVERED'), 'consegna');
    assert(!WF.canTransition('order', 'DELIVERED', 'CONFIRMED'), 'niente regressione da consegnato');
    assert(!WF.canTransition('order', 'CONFIRMED', 'DELIVERED'), 'non salta a consegnato');
  });
  it(s, 'preventivo: DRAFT→SENT→ACCEPTED; da ACCEPTED non torna a DRAFT', async () => {
    assert(WF.canTransition('quote', 'DRAFT', 'SENT'), 'invia');
    assert(WF.canTransition('quote', 'SENT', 'ACCEPTED'), 'accetta');
    assert(!WF.canTransition('quote', 'ACCEPTED', 'DRAFT'), 'no regressione');
  });
  it(s, 'stati terminali non hanno successori', async () => {
    assertEq(WF.nextStates('order', 'DELIVERED').length, 0);
    assertEq(WF.nextStates('invoice', 'PAID').length, 0);
    assertEq(WF.nextStates('production', 'DONE').length, 0);
  });
  it(s, 'validateTransition spiega il motivo quando non ammessa', async () => {
    const v = WF.validateTransition('order', 'CONFIRMED', 'DELIVERED');
    assert(!v.ok && /puoi passare solo a/i.test(v.reason), 'spiegazione');
    const ok = WF.validateTransition('order', 'CONFIRMED', 'IN_PRODUCTION');
    assert(ok.ok, 'ammessa');
  });
  it(s, 'stesso stato = no-op consentito', async () => {
    assert(WF.canTransition('order', 'READY', 'READY'), 'no-op');
  });
});

describe('Workflow — statusbar render', (s) => {
  it(s, 'mostra pill lineari + pulsanti solo per stati ammessi (writable)', async () => {
    const html = WF.flow('order') ? renderStatusbar('order', 'CONFIRMED', true) : '';
    assert(/Confermato/.test(html), 'stato corrente');
    assert(/data-wf-to="IN_PRODUCTION"/.test(html), 'pulsante avanza ammesso');
    assert(!/data-wf-to="DELIVERED"/.test(html), 'niente pulsante per salto non ammesso');
  });
  it(s, 'senza permessi di scrittura niente pulsanti', async () => {
    const html = renderStatusbar('order', 'CONFIRMED', false);
    assert(!/data-wf-to=/.test(html), 'nessun pulsante in sola lettura');
  });
});
