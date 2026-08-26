-- =========================================================
-- F&B ACCOUNTING & PURCHASING SCHEMA (Supabase PostgreSQL)
-- =========================================================

create extension if not exists "uuid-ossp";

-- 1. OUTLETS
create table if not exists outlets (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    type text not null default 'cafe',
    cash_deposit_threshold numeric(12,2) not null default 500000.00,
    status text not null default 'active',
    created_at timestamptz default now()
);

-- 2. SUPPLIERS
create table if not exists suppliers (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    category text default 'Bahan Baku',
    phone text,
    address text,
    payment_terms text not null default 'cash',
    default_tempo_days int default 0,
    bank_name text,
    bank_account_number text,
    bank_account_name text,
    created_at timestamptz default now()
);

-- 3. CASH COLLECTIONS (Uang Kasir Dipegang)
create table if not exists cash_collections (
    id uuid primary key default uuid_generate_v4(),
    outlet_id uuid not null references outlets(id) on delete cascade,
    collected_at timestamptz not null default now(),
    amount numeric(12,2) not null check (amount > 0),
    source text not null default 'pos_cash_drawer',
    notes text,
    status text not null default 'held_by_me', -- 'held_by_me', 'deposited_to_bank'
    deposited_at timestamptz,
    deposit_bank text,
    deposit_account text,
    proof_image_url text,
    created_at timestamptz default now()
);

-- 4. ADVANCE FUND BATCHES (Transfer Dana Belanja Terpisah / Dana Mengendap)
create table if not exists advance_fund_batches (
    id uuid primary key default uuid_generate_v4(),
    outlet_id uuid not null references outlets(id) on delete cascade,
    batch_name text not null,
    received_at timestamptz not null default now(),
    initial_amount numeric(12,2) not null check (initial_amount > 0),
    remaining_amount numeric(12,2) not null check (remaining_amount >= 0),
    status text not null default 'active', -- 'active', 'depleted', 'closed'
    notes text,
    proof_image_url text,
    created_at timestamptz default now()
);

-- 5. PURCHASES
create table if not exists purchases (
    id uuid primary key default uuid_generate_v4(),
    outlet_id uuid not null references outlets(id) on delete cascade,
    supplier_id uuid references suppliers(id) on delete set null,
    supplier_name text not null,
    purchase_date date not null default current_date,
    payment_source text not null default 'opening_cash', -- 'opening_cash', 'personal_cash', 'advance_transfer', 'tempo', 'transfer_bank'
    advance_batch_id uuid references advance_fund_batches(id) on delete set null,
    total_amount numeric(12,2) not null check (total_amount >= 0),

    is_tempo boolean not null default false,
    tempo_due_date date,
    tempo_status text not null default 'unpaid',
    tempo_paid_at timestamptz,
    tempo_payment_proof_url text,

    receipt_image_url text,
    notes text,
    created_at timestamptz default now()
);

-- 6. PURCHASE ITEMS
create table if not exists purchase_items (
    id uuid primary key default uuid_generate_v4(),
    purchase_id uuid not null references purchases(id) on delete cascade,
    item_name text not null,
    quantity numeric(10,2) not null default 1,
    unit text not null default 'pcs',
    unit_price numeric(12,2) not null default 0,
    subtotal numeric(12,2) not null default 0,
    created_at timestamptz default now()
);
