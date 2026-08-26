-- Enable RLS and public policies for full two-way CRUD
alter table public.outlets enable row level security;
alter table public.suppliers enable row level security;
alter table public.advance_fund_batches enable row level security;
alter table public.cash_collections enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

-- Create full access policies for anon / authenticated
create policy "Allow all operations on outlets" on public.outlets for all using (true) with check (true);
create policy "Allow all operations on suppliers" on public.suppliers for all using (true) with check (true);
create policy "Allow all operations on advance_fund_batches" on public.advance_fund_batches for all using (true) with check (true);
create policy "Allow all operations on cash_collections" on public.cash_collections for all using (true) with check (true);
create policy "Allow all operations on purchases" on public.purchases for all using (true) with check (true);
create policy "Allow all operations on purchase_items" on public.purchase_items for all using (true) with check (true);
