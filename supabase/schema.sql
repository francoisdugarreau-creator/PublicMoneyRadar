-- PublicMoney Radar table-backed schema for Supabase.
-- Not required by the static JSON MVP, but ready for the next iteration.

create table if not exists public.contracts (
  id text primary key,
  decp_id text,
  source_row_index integer,
  title text not null,
  buyer_name text not null,
  buyer_id text,
  supplier_name text not null,
  supplier_id text,
  amount numeric,
  date date,
  year integer,
  location text,
  cpv text,
  procedure text,
  source_url text not null,
  raw jsonb,
  imported_at timestamptz not null default now()
);

create index if not exists contracts_search_idx on public.contracts using gin (
  to_tsvector('french', coalesce(title,'') || ' ' || coalesce(buyer_name,'') || ' ' || coalesce(supplier_name,'') || ' ' || coalesce(location,'') || ' ' || coalesce(cpv,''))
);

create index if not exists contracts_buyer_idx on public.contracts (buyer_id);
create index if not exists contracts_supplier_idx on public.contracts (supplier_id);
create index if not exists contracts_decp_id_idx on public.contracts (decp_id);
create index if not exists contracts_year_idx on public.contracts (year);

alter table public.contracts enable row level security;

drop policy if exists "Public read contracts" on public.contracts;
create policy "Public read contracts" on public.contracts
  for select
  using (true);
