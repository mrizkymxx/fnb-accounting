import { Outlet, Supplier, Purchase, CashCollection, AdvanceFundBatch } from '@/types/database';

export const INITIAL_OUTLETS: Outlet[] = [
  {
    id: '6877fcd1-7821-4b22-8bec-44d7a3183d79',
    name: 'Oklah',
    type: 'cafe',
    cash_deposit_threshold: 500000,
    status: 'active',
    color: 'emerald',
    created_at: '2026-08-26T16:13:00.987906+00:00',
  },
  {
    id: '96f9a0eb-67a5-4fad-88ff-bf33e5d0e4cf',
    name: 'Prima Sushi',
    type: 'resto',
    cash_deposit_threshold: 1000000,
    status: 'active',
    color: 'amber',
    created_at: '2026-08-26T16:13:00.987906+00:00',
  },
  {
    id: '81ac3095-69f8-4eca-a8ee-4be9e9e876b2',
    name: 'Rovu',
    type: 'cafe/resto',
    cash_deposit_threshold: 500000,
    status: 'construction',
    color: 'slate',
    created_at: '2026-08-26T16:13:00.987906+00:00',
  },
  {
    id: '13bc6656-dddf-4653-97da-fdde078229bf',
    name: 'Staff Meals',
    type: 'internal',
    cash_deposit_threshold: 0,
    status: 'active',
    color: 'purple',
    created_at: '2026-08-26T16:32:36.54103+00:00',
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: '6cfc84f9-5aca-4221-8038-bb15e38e3fd0',
    name: 'Toko Sumber Pangan (Andalan Tempo)',
    category: 'Sembako & Bahan Pokok',
    phone: '081234567890',
    payment_terms: 'tempo',
    default_tempo_days: 14,
    bank_name: 'BCA',
    bank_account_number: '1234567890',
    bank_account_name: 'CV Sumber Pangan',
    created_at: '2026-08-26T16:32:36.54103+00:00',
  },
  {
    id: '3f6e7662-9739-466f-8662-3d21199abf41',
    name: 'Pasar Segar Subur',
    category: 'Sayuran & Buah Segar',
    phone: '085712345678',
    payment_terms: 'cash',
    default_tempo_days: 0,
    created_at: '2026-08-26T16:32:36.54103+00:00',
  },
  {
    id: 'da6e7341-651a-4e0c-a602-34923f6dd832',
    name: 'Distributor Salmon & Nori Jaya',
    category: 'Bahan Khusus Sushi',
    phone: '081398765432',
    payment_terms: 'tempo',
    default_tempo_days: 7,
    bank_name: 'Mandiri',
    bank_account_number: '9876543210',
    bank_account_name: 'PT Nori Segar',
    created_at: '2026-08-26T16:32:36.54103+00:00',
  },
  {
    id: 'f434e8f1-ff46-46af-b8f8-b1929410a08b',
    name: 'Warung Makan & Sayur Harian',
    category: 'Bahan Makanan Karyawan / Staff',
    phone: '081299887711',
    payment_terms: 'cash',
    default_tempo_days: 0,
    created_at: '2026-08-26T16:32:36.54103+00:00',
  }
];

export const INITIAL_ADVANCE_BATCHES: AdvanceFundBatch[] = [];
export const INITIAL_PURCHASES: Purchase[] = [];
export const INITIAL_COLLECTIONS: CashCollection[] = [];
