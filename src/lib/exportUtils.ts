import { Purchase, CashCollection, AdvanceFundBatch, Supplier, Outlet } from '@/types/database';
import { formatDateIndo } from './formatters';

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 1. Export Purchases CSV
export function exportPurchasesCSV(purchases: Purchase[], outlets: Outlet[]) {
  const headers = ['ID Transaksi', 'Outlet', 'Tanggal', 'Supplier / Toko', 'Sumber Dana', 'Tempo', 'Jatuh Tempo', 'Status Tempo', 'Total (Rp)', 'Daftar Barang', 'Catatan'];
  const rows = purchases.map(p => {
    const outlet = outlets.find(o => o.id === p.outlet_id);
    const itemsStr = (p.items || []).map(it => `${it.item_name} (${it.quantity} ${it.unit} @ Rp${it.unit_price})`).join('; ');
    return [
      p.id,
      outlet?.name || p.outlet_id,
      p.purchase_date,
      `"${(p.supplier_name || '').replace(/"/g, '""')}"`,
      p.payment_source,
      p.is_tempo ? 'Ya' : 'Tidak',
      p.tempo_due_date || '-',
      p.is_tempo ? (p.tempo_status === 'paid' ? 'Lunas' : 'Belum Lunas') : '-',
      p.total_amount,
      `"${itemsStr.replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  downloadCSV(`Rekap_Belanja_FnB_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// 2. Export Advance Funds CSV
export function exportAdvanceFundsCSV(batches: AdvanceFundBatch[], outlets: Outlet[]) {
  const headers = ['ID Batch', 'Outlet', 'Nama Batch', 'Sumber Pengirim', 'Tanggal Diterima', 'Dana Awal (Rp)', 'Dana Terpakai (Rp)', 'Sisa Mengendap (Rp)', 'Status', 'Catatan'];
  const rows = batches.map(b => {
    const outlet = outlets.find(o => o.id === b.outlet_id);
    const used = b.initial_amount - b.remaining_amount;
    return [
      b.id,
      outlet?.name || b.outlet_id,
      `"${(b.batch_name || '').replace(/"/g, '""')}"`,
      `"${(b.sender_source || '').replace(/"/g, '""')}"`,
      b.received_at ? b.received_at.split('T')[0] : '-',
      b.initial_amount,
      used,
      b.remaining_amount,
      b.status,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  downloadCSV(`Rekap_Dana_Belanja_Rekening_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// 3. Export Cash Collection & Deposit CSV
export function exportCashCollectionsCSV(collections: CashCollection[], outlets: Outlet[]) {
  const headers = ['ID', 'Outlet', 'Tanggal Tarik', 'Nominal (Rp)', 'Sumber Kas', 'Status', 'Tanggal Setor Bank', 'Bank Tujuan', 'No Rekening', 'Catatan'];
  const rows = collections.map(c => {
    const outlet = outlets.find(o => o.id === c.outlet_id);
    return [
      c.id,
      outlet?.name || c.outlet_id,
      c.collected_at ? c.collected_at.split('T')[0] : '-',
      c.amount,
      c.source,
      c.status === 'deposited_to_bank' ? 'Sudah Setor Bank' : 'Dipegang Sendiri (Held)',
      c.deposited_at ? c.deposited_at.split('T')[0] : '-',
      c.deposit_bank || '-',
      `"${(c.deposit_account || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  downloadCSV(`Rekap_Kas_Dipegang_Setor_Bank_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// 4. Export Tempo CSV
export function exportTempoCSV(purchases: Purchase[], outlets: Outlet[]) {
  const tempoList = purchases.filter(p => p.is_tempo);
  const headers = ['ID Transaksi', 'Outlet', 'Supplier / Toko', 'Tanggal Pembelian', 'Jatuh Tempo', 'Total Tagihan (Rp)', 'Status Pembayaran', 'Tanggal Pelunasan', 'Catatan'];
  const rows = tempoList.map(p => {
    const outlet = outlets.find(o => o.id === p.outlet_id);
    return [
      p.id,
      outlet?.name || p.outlet_id,
      `"${(p.supplier_name || '').replace(/"/g, '""')}"`,
      p.purchase_date,
      p.tempo_due_date || '-',
      p.total_amount,
      p.tempo_status === 'paid' ? 'Lunas' : 'Belum Lunas',
      p.tempo_paid_at ? p.tempo_paid_at.split('T')[0] : '-',
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  downloadCSV(`Rekap_Hutang_Tempo_Supplier_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}

// 5. Export Suppliers CSV
export function exportSuppliersCSV(suppliers: Supplier[]) {
  const headers = ['ID', 'Nama Supplier / Toko', 'Kategori Bahan', 'No HP / WhatsApp', 'Alamat', 'Syarat Bayar', 'Tempo (Hari)', 'Nama Bank', 'No Rekening', 'Nama Pemilik Rekening'];
  const rows = suppliers.map(s => [
    s.id,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.category || '').replace(/"/g, '""')}"`,
    s.phone || '-',
    `"${(s.address || '').replace(/"/g, '""')}"`,
    s.payment_terms,
    s.default_tempo_days || 0,
    s.bank_name || '-',
    `"${(s.bank_account_number || '').replace(/"/g, '""')}"`,
    `"${(s.bank_account_name || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  downloadCSV(`Master_Data_Supplier_FnB_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
}
