-- ═══════════════════════════════════════════════════════════════════════════
-- INGLY OS — Schema Postgres (Fase 2, bozza pronta per il backend)
-- Deriva dagli store IndexedDB del monolite. Multi-tenant con Row-Level Security.
-- Strategia: colonne tipizzate per i campi interrogabili + `data jsonb` per il
-- resto (gli store hanno forme eterogenee) → migrazione senza perdita.
-- NB: bozza. Prima del deploy: indici mirati, vincoli, migrazioni versionate.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Piattaforma ────────────────────────────────────────────────────────────
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'starter',   -- starter|pro|business|enterprise
  created_at  timestamptz not null default now()
);

create table users (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  email       text not null,
  name        text,
  role        text not null default 'operator',  -- owner|admin|operator|accountant|viewer
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (tenant_id, email)
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
  -- il token vive in cookie httpOnly+SameSite lato server, non qui.
);

create table audit_log (
  id          bigserial primary key,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  store       text not null,
  entity_key  text,
  op          text not null,                     -- write|delete
  at          timestamptz not null default now()
);

-- Registro dei cambi per il sync local-first (LWW su updated_at).
create table sync_changes (
  id          bigserial primary key,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  store       text not null,
  entity_key  text not null,
  op          text not null,                     -- put|delete
  value       jsonb,
  updated_at  bigint not null,                   -- ms epoch (da _upd del client)
  created_at  timestamptz not null default now()
);
create index on sync_changes (tenant_id, updated_at);

-- ── Entità di business (derivate dagli store) ──────────────────────────────
-- Pattern comune: id, tenant_id, campi tipizzati principali, data jsonb, timestamps.

create table clients (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text,
  contact     text,
  segment     text,                              -- champion|fedele|a_rischio|nuovo|inattivo
  data        jsonb not null default '{}',
  updated_at  bigint,                            -- _upd del client (per LWW)
  primary key (tenant_id, id)
);

create table catalog (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text,
  category    text,
  price       numeric(12,2),
  data        jsonb not null default '{}',
  updated_at  bigint,
  primary key (tenant_id, id)
);

create table materials (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text,
  cat         text,
  cost        numeric(12,2),
  unit        text,
  supplier    text,
  data        jsonb not null default '{}',
  updated_at  bigint,
  primary key (tenant_id, id)
);

create table equipment (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text,
  tech        text,
  cost_buy    numeric(12,2),
  roi_monthly numeric(12,2),
  set_aside   numeric(12,2),
  data        jsonb not null default '{}',
  updated_at  bigint,
  primary key (tenant_id, id)
);

create table suppliers (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text,
  category    text,
  region      text,
  url         text,
  data        jsonb not null default '{}',
  updated_at  bigint,
  primary key (tenant_id, id)
);

create table orders (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  client_id   text,
  status      text,                              -- stati canonici (vedi domain/orders.ts)
  total       numeric(12,2),
  data        jsonb not null default '{}',
  created_at  timestamptz,
  updated_at  bigint,
  primary key (tenant_id, id)
);

create table quotes (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  client_id   text,
  channel     text,                              -- b2c|b2b|etsy
  subtotal    numeric(12,2),
  deposit     numeric(12,2),
  valid_until date,
  data        jsonb not null default '{}',
  updated_at  bigint,
  primary key (tenant_id, id)
);

create table invoices (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  number      text,                              -- es. 2026/000123
  doc_type    text,                              -- fattura|fattura_acconto|nota_credito
  imponibile  numeric(12,2),
  imposta     numeric(12,2),
  totale      numeric(12,2),
  sdi_status  text,                              -- stato invio intermediario SDI
  data        jsonb not null default '{}',
  updated_at  bigint,
  primary key (tenant_id, id)
);

create table cashflow (
  id          text not null,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  kind        text,                              -- entrata|uscita
  amount      numeric(12,2),
  bucket      text,                              -- tasse|riserva|obiettivi|operativo
  data        jsonb not null default '{}',
  updated_at  bigint,
  primary key (tenant_id, id)
);

-- ── Row-Level Security (isolamento per tenant) ─────────────────────────────
-- Ogni tabella di business filtra su tenant_id = corrente (impostato dalla sessione).
-- Esempio (da applicare a tutte le tabelle business):
--   alter table clients enable row level security;
--   create policy tenant_isolation on clients
--     using (tenant_id = current_setting('app.tenant_id')::uuid);
-- Il backend imposta `set app.tenant_id` a inizio richiesta dalla sessione verificata.
