-- Create Storage Bucket for Receipts
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Enable Public Access Policies for Receipts Bucket
create policy "Public Access Receipts" on storage.objects
for select using (bucket_id = 'receipts');

create policy "Public Upload Receipts" on storage.objects
for insert with check (bucket_id = 'receipts');

create policy "Public Update Receipts" on storage.objects
for update using (bucket_id = 'receipts');

create policy "Public Delete Receipts" on storage.objects
for delete using (bucket_id = 'receipts');
