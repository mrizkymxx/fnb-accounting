-- Insert Staff Meals & initial seeds into Supabase remote
insert into public.outlets (name, type, cash_deposit_threshold, status)
values ('Staff Meals', 'internal', 0.00, 'active')
on conflict (name) do nothing;

insert into public.suppliers (name, category, phone, payment_terms, default_tempo_days)
values
('Toko Sumber Pangan (Andalan Tempo)', 'Sembako & Bahan Pokok', '081234567890', 'tempo', 14),
('Pasar Segar Subur', 'Sayuran & Buah Segar', '085712345678', 'cash', 0),
('Distributor Salmon & Nori Jaya', 'Bahan Khusus Sushi', '081398765432', 'tempo', 7),
('Warung Makan & Sayur Harian', 'Bahan Makanan Karyawan / Staff', '081299887711', 'cash', 0)
on conflict (name) do nothing;
