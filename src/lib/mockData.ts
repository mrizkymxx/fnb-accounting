import { Outlet, Supplier, Purchase, CashCollection, AdvanceFundBatch } from '@/types/database';

export const INITIAL_OUTLETS: Outlet[] = [
  {
    id: 'out_oklah',
    name: 'Oklah',
    type: 'cafe',
    cash_deposit_threshold: 500000,
    status: 'active',
    color: 'emerald',
    created_at: new Date().toISOString(),
  },
  {
    id: 'out_prima',
    name: 'Prima Sushi',
    type: 'resto',
    cash_deposit_threshold: 1000000,
    status: 'active',
    color: 'amber',
    created_at: new Date().toISOString(),
  },
  {
    id: 'out_rovu',
    name: 'Rovu',
    type: 'cafe/resto',
    cash_deposit_threshold: 500000,
    status: 'construction',
    color: 'slate',
    created_at: new Date().toISOString(),
  },
  {
    id: 'out_staff_meals',
    name: 'Staff Meals',
    type: 'internal',
    cash_deposit_threshold: 0,
    status: 'active',
    color: 'purple',
    created_at: new Date().toISOString(),
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Toko Sumber Pangan (Andalan Tempo)',
    category: 'Sembako & Bahan Pokok',
    phone: '081234567890',
    payment_terms: 'tempo',
    default_tempo_days: 14,
    bank_name: 'BCA',
    bank_account_number: '1234567890',
    bank_account_name: 'CV Sumber Pangan',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sup_2',
    name: 'Pasar Segar Subur',
    category: 'Sayuran & Buah Segar',
    phone: '085712345678',
    payment_terms: 'cash',
    default_tempo_days: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sup_3',
    name: 'Distributor Salmon & Nori Jaya',
    category: 'Bahan Khusus Sushi',
    phone: '081398765432',
    payment_terms: 'tempo',
    default_tempo_days: 7,
    bank_name: 'Mandiri',
    bank_account_number: '9876543210',
    bank_account_name: 'PT Nori Segar',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sup_staff',
    name: 'Warung Makan & Sayur Harian',
    category: 'Bahan Makanan Karyawan / Staff',
    phone: '081299887711',
    payment_terms: 'cash',
    default_tempo_days: 0,
    created_at: new Date().toISOString(),
  }
];

export const INITIAL_ADVANCE_BATCHES: AdvanceFundBatch[] = [
  {
    id: 'batch_oklah_01',
    outlet_id: 'out_oklah',
    sender_source: 'Transfer Owner / Luar',
    batch_name: 'Dana Belanja Bahan Oklah #1',
    received_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    initial_amount: 1500000,
    remaining_amount: 550000,
    status: 'active',
    notes: 'Transfer dari luar ke rekening pribadi untuk belanja operasional Oklah',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'batch_prima_01',
    outlet_id: 'out_prima',
    sender_source: 'Transfer Investor Luar',
    batch_name: 'Dana Belanja Bahan Salmon Prima Sushi',
    received_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    initial_amount: 2000000,
    remaining_amount: 1150000,
    status: 'active',
    notes: 'Khusus beli salmon & nori grade premium',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'batch_staff_01',
    outlet_id: 'out_staff_meals',
    sender_source: 'Kas Operasional / Owner',
    batch_name: 'Anggaran Makan Karyawan (Staff Meals)',
    received_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    initial_amount: 500000,
    remaining_amount: 380000,
    status: 'active',
    notes: 'Beras, telur, minyak & lauk pauk staff',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'pur_1',
    outlet_id: 'out_oklah',
    supplier_id: 'sup_1',
    supplier_name: 'Toko Sumber Pangan (Andalan Tempo)',
    purchase_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_source: 'tempo',
    total_amount: 450000,
    is_tempo: true,
    tempo_due_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tempo_status: 'unpaid',
    notes: 'Susu UHT 2 dus + Sirup Kopi Vanilla',
    items: [
      { id: 'item_1', item_name: 'Susu UHT Full Cream 1L (12 pcs)', quantity: 2, unit: 'karton', unit_price: 180000, subtotal: 360000 },
      { id: 'item_2', item_name: 'Sirup Vanilla Premium 750ml', quantity: 1, unit: 'botol', unit_price: 90000, subtotal: 90000 }
    ],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pur_2',
    outlet_id: 'out_oklah',
    supplier_id: 'sup_2',
    supplier_name: 'Pasar Segar Subur',
    purchase_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_source: 'advance_transfer',
    advance_batch_id: 'batch_oklah_01',
    total_amount: 950000,
    is_tempo: false,
    notes: 'Beli buah & sirup potong Batch #1',
    items: [
      { id: 'item_3', item_name: 'Buah Strawberry & Lemon Segar', quantity: 5, unit: 'kg', unit_price: 90000, subtotal: 450000 },
      { id: 'item_4', item_name: 'Gula Pasir & Sirup Kopi', quantity: 10, unit: 'kg', unit_price: 50000, subtotal: 500000 }
    ],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pur_staff_1',
    outlet_id: 'out_staff_meals',
    supplier_id: 'sup_staff',
    supplier_name: 'Warung Makan & Sayur Harian',
    purchase_date: new Date().toISOString().split('T')[0],
    payment_source: 'advance_transfer',
    advance_batch_id: 'batch_staff_01',
    total_amount: 120000,
    is_tempo: false,
    notes: 'Beras 5kg, Telur 1kg, Sayur sop & ayam untuk makan siang crew',
    items: [
      { id: 'item_s1', item_name: 'Beras Ramos 5kg', quantity: 1, unit: 'pack', unit_price: 75000, subtotal: 75000 },
      { id: 'item_s2', item_name: 'Telur Ayam 1kg', quantity: 1, unit: 'kg', unit_price: 28000, subtotal: 28000 },
      { id: 'item_s3', item_name: 'Bumbu & Sayuran Segar', quantity: 1, unit: 'pack', unit_price: 17000, subtotal: 17000 }
    ],
    created_at: new Date().toISOString(),
  }
];

export const INITIAL_COLLECTIONS: CashCollection[] = [
  {
    id: 'col_1',
    outlet_id: 'out_oklah',
    collected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 350000,
    source: 'pos_cash_drawer',
    notes: 'Tarik sisa kasir shift malam',
    status: 'held_by_me',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'col_2',
    outlet_id: 'out_oklah',
    collected_at: new Date().toISOString(),
    amount: 250000,
    source: 'pos_cash_drawer',
    notes: 'Tarik kasir siang (Total Oklah sekarang 600rb -> siap setor)',
    status: 'held_by_me',
    created_at: new Date().toISOString(),
  },
  {
    id: 'col_3',
    outlet_id: 'out_prima',
    collected_at: new Date().toISOString(),
    amount: 600000,
    source: 'daily_sales',
    notes: 'Kasir weekend (Target setor 1jt, baru 600rb -> simpan dulu)',
    status: 'held_by_me',
    created_at: new Date().toISOString(),
  }
];
