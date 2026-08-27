import { Purchase, CashCollection, AdvanceFundBatch, Outlet, Supplier } from '@/types/database';

export interface AuditLogEntry {
  date: string;
  time: string;
  type: 'BELANJA' | 'TARIK_KAS' | 'DANA_MASUK' | 'BAYAR_TEMPO' | 'SETOR_BANK';
  outlet_name: string;
  title: string;
  amount: number;
  details: string;
  has_receipt: boolean;
}

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

// Generate unified audit timeline and export by date range
export function generateAuditReport(
  startDate: string,
  endDate: string,
  outletId: string,
  purchases: Purchase[],
  collections: CashCollection[],
  advanceBatches: AdvanceFundBatch[],
  outlets: Outlet[]
) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const logs: AuditLogEntry[] = [];

  // 1. Filter Purchases in range
  purchases.forEach(p => {
    if (outletId !== 'all' && p.outlet_id !== outletId) return;
    const pDate = new Date(p.purchase_date);
    if (pDate >= start && pDate <= end) {
      const outlet = outlets.find(o => o.id === p.outlet_id);
      logs.push({
        date: p.purchase_date,
        time: p.created_at ? p.created_at.split('T')[1]?.substring(0, 5) : '00:00',
        type: p.is_tempo ? 'BAYAR_TEMPO' : 'BELANJA',
        outlet_name: outlet?.name || p.outlet_id,
        title: `Belanja ${p.supplier_name}`,
        amount: p.total_amount,
        details: `${p.items?.length || 0} item barang (${(p.payment_source || '').replace('_', ' ')})`,
        has_receipt: Boolean(p.receipt_image_url),
      });
    }
  });

  // 2. Filter Collections in range
  collections.forEach(c => {
    if (outletId !== 'all' && c.outlet_id !== outletId) return;
    const cDate = new Date(c.collected_at);
    if (cDate >= start && cDate <= end) {
      const outlet = outlets.find(o => o.id === c.outlet_id);
      logs.push({
        date: c.collected_at.split('T')[0],
        time: c.collected_at.split('T')[1]?.substring(0, 5) || '00:00',
        type: 'TARIK_KAS',
        outlet_name: outlet?.name || c.outlet_id,
        title: `Tarik Kasir ${c.source}`,
        amount: c.amount,
        details: c.status === 'deposited_to_bank' ? `Sudah disetor ke ${c.deposit_bank}` : 'Uang masih dipegang (Held)',
        has_receipt: Boolean(c.proof_image_url),
      });
    }
  });

  // 3. Filter Advance Funds in range
  advanceBatches.forEach(b => {
    if (outletId !== 'all' && b.outlet_id !== outletId) return;
    const bDate = new Date(b.received_at);
    if (bDate >= start && bDate <= end) {
      const outlet = outlets.find(o => o.id === b.outlet_id);
      logs.push({
        date: b.received_at.split('T')[0],
        time: b.received_at.split('T')[1]?.substring(0, 5) || '00:00',
        type: 'DANA_MASUK',
        outlet_name: outlet?.name || b.outlet_id,
        title: `Terima Transfer Luar: ${b.batch_name}`,
        amount: b.initial_amount,
        details: `Pengirim: ${b.sender_source} (Sisa saat ini: Rp${b.remaining_amount.toLocaleString('id-ID')})`,
        has_receipt: Boolean(b.proof_image_url),
      });
    }
  });

  // Sort logs by date descending
  logs.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  return logs;
}

// Export Complete Audit Log CSV
export function exportPeriodAuditCSV(
  startDate: string,
  endDate: string,
  logs: AuditLogEntry[],
  outletName: string
) {
  const headers = ['Tanggal', 'Jam', 'Tipe Aktivitas', 'Outlet', 'Nama Aktivitas / Toko', 'Nominal (Rp)', 'Keterangan / Detail', 'Ada Bukti Foto / Nota'];
  const rows = logs.map(l => [
    l.date,
    l.time,
    l.type,
    `"${l.outlet_name.replace(/"/g, '""')}"`,
    `"${l.title.replace(/"/g, '""')}"`,
    l.amount,
    `"${l.details.replace(/"/g, '""')}"`,
    l.has_receipt ? 'Ya (Foto Ada)' : 'Tidak',
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  downloadCSV(`Laporan_Audit_FnB_${outletName}_${startDate}_sd_${endDate}.csv`, csvContent);
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
