// INGLY OS V2 — test Centro "Cose da fare": aggregazione attività aperte globali.
import { describe, it, assert, assertEq } from './harness.mjs';
import { renderTodo } from '../app-v2/src/todo-ui.js';

describe('Cose da fare — render', (s) => {
  it(s, 'vuoto → messaggio positivo', async () => {
    assert(/Nessuna attività aperta/.test(renderTodo([])), 'empty');
  });
  it(s, 'separa scadute e in programma, con link e Fatto', async () => {
    const html = renderTodo([
      { id: 'a1', body: 'Richiamare Rossi', activity_type: 'call', entity_type: 'customer', due_date: '2020-01-01', overdue: true },
      { id: 'a2', body: 'Preparare consegna', activity_type: 'todo', entity_type: 'order', due_date: '2099-01-01', overdue: false },
    ]);
    assert(/Scadute \(1\)/.test(html), 'sezione scadute');
    assert(/In programma \(1\)/.test(html), 'sezione in programma');
    assert(/data-td-done="a1"/.test(html) && /data-td-go="customer"/.test(html), 'azioni');
    assert(/Cliente/.test(html) && /Ordine/.test(html), 'etichette entità');
  });
});
