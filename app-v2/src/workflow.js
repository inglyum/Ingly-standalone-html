// INGLY OS V2 — Workflow a stati unificato (Odoo-like statusbar). UN solo motore
// di stati per preventivi/ordini/fatture/produzione/booking: definisce le
// transizioni AMMESSE e le valida, così nessun modulo salta passaggi o regredisce
// a caso. Puro e deterministico. Non scrive nulla: valida e descrive; la
// scrittura resta ai data-layer (changeStatus) dei singoli moduli.

// Flussi: per ogni stato, gli stati successivi ammessi. Gli stati terminali
// hanno lista vuota (eventualmente solo annullamento dove ha senso).
export const FLOWS = {
  quote: {
    label: 'Preventivo',
    states: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
    labels: { DRAFT: 'Bozza', SENT: 'Inviato', ACCEPTED: 'Accettato', REJECTED: 'Rifiutato', EXPIRED: 'Scaduto', CANCELLED: 'Annullato' },
    transitions: {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
      ACCEPTED: ['CANCELLED'], REJECTED: ['SENT'], EXPIRED: ['SENT'], CANCELLED: [],
    },
  },
  order: {
    label: 'Ordine',
    states: ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED'],
    labels: { CONFIRMED: 'Confermato', IN_PRODUCTION: 'In produzione', READY: 'Pronto', DELIVERED: 'Consegnato', CANCELLED: 'Annullato' },
    transitions: {
      CONFIRMED: ['IN_PRODUCTION', 'READY', 'CANCELLED'],
      IN_PRODUCTION: ['READY', 'CANCELLED'],
      READY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [], CANCELLED: [],
    },
  },
  invoice: {
    label: 'Fattura',
    states: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
    labels: { DRAFT: 'Bozza', ISSUED: 'Emessa', PARTIALLY_PAID: 'Parz. pagata', PAID: 'Pagata', OVERDUE: 'Scaduta', CANCELLED: 'Annullata' },
    transitions: {
      DRAFT: ['ISSUED', 'CANCELLED'],
      ISSUED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
      PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED'],
      OVERDUE: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
      PAID: [], CANCELLED: [],
    },
  },
  production: {
    label: 'Produzione',
    states: ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
    labels: { PLANNED: 'Pianificato', IN_PROGRESS: 'In lavorazione', DONE: 'Completato', CANCELLED: 'Annullato' },
    transitions: { PLANNED: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['DONE', 'CANCELLED'], DONE: [], CANCELLED: [] },
  },
  booking: {
    label: 'Prenotazione',
    states: ['requested', 'confirmed', 'done', 'cancelled'],
    labels: { requested: 'Richiesto', confirmed: 'Confermato', done: 'Completato', cancelled: 'Annullato' },
    transitions: { requested: ['confirmed', 'cancelled'], confirmed: ['done', 'cancelled'], done: [], cancelled: [] },
  },
};

export function flow(entity) { return FLOWS[entity] || null; }
export function statusLabel(entity, state) { const f = FLOWS[entity]; return (f && f.labels[state]) || state; }
export function states(entity) { const f = FLOWS[entity]; return f ? f.states : []; }

// Stati successivi ammessi dallo stato corrente (vuoto = terminale).
export function nextStates(entity, from) {
  const f = FLOWS[entity]; if (!f) return [];
  return (f.transitions[from] || []).slice();
}

// Transizione valida? (stesso stato = no-op consentito).
export function canTransition(entity, from, to) {
  if (from === to) return true;
  return nextStates(entity, from).includes(to);
}

// Valida e, se non ammessa, spiega perché (per feedback all'utente).
export function validateTransition(entity, from, to) {
  const f = FLOWS[entity];
  if (!f) return { ok: false, reason: 'Flusso sconosciuto.' };
  if (!f.states.includes(to)) return { ok: false, reason: `Stato "${to}" non valido per ${f.label}.` };
  if (canTransition(entity, from, to)) return { ok: true };
  const opts = nextStates(entity, from).map((s) => f.labels[s] || s).join(', ') || 'nessuno (stato finale)';
  return { ok: false, reason: `Da "${f.labels[from] || from}" puoi passare solo a: ${opts}.` };
}

// Indice di avanzamento (per la statusbar). CANCELLED/REJECTED fuori dalla linea.
export function progressIndex(entity, state) {
  const f = FLOWS[entity]; if (!f) return -1;
  const linear = f.states.filter((s) => !/cancel|reject|expire/i.test(s));
  return linear.indexOf(state);
}
