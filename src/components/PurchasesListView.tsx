'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Purchase } from '@/types/database';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { exportPurchasesCSV } from '@/lib/exportUtils';
import {
  Search,
  Receipt,
  Trash2,
  Edit,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PurchasesListViewProps {
  onOpenNewPurchase: () => void;
  onEditPurchase: (purchase: Purchase) => void;
  onViewReceipt: (url: string, title: string) => void;
}

export const PurchasesListView: React.FC<PurchasesListViewProps> = ({
  onOpenNewPurchase,
  onEditPurchase,
  onViewReceipt,
}) => {
  const { purchases, outlets, deletePurchase, selectedOutletId, setSelectedOutletId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterTempo, setFilterTempo] = useState<string>('all');
  const [filterReceipt, setFilterReceipt] = useState<string>('all'); // 'all' | 'has_receipt' | 'no_receipt'

  const filtered = purchases.filter(p => {
    if (selectedOutletId !== 'all' && p.outlet_id !== selectedOutletId) return false;
    if (filterSource !== 'all' && p.payment_source !== filterSource) return false;
    if (filterTempo === 'tempo_only' && !p.is_tempo) return false;
    if (filterTempo === 'tempo_unpaid' && (!p.is_tempo || p.tempo_status !== 'unpaid')) return false;

    // Filter Foto Nota
    if (filterReceipt === 'has_receipt' && !p.receipt_image_url) return false;
    if (filterReceipt === 'no_receipt' && p.receipt_image_url) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSupplier = p.supplier_name.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      const matchItems = p.items?.some(it => it.item_name.toLowerCase().includes(q));
      if (!matchSupplier && !matchNotes && !matchItems) return false;
    }

    return true;
  });

  const totalAmountFiltered = filtered.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalWithReceiptCount = purchases.filter(p => p.receipt_image_url).length;
  const totalWithoutReceiptCount = purchases.filter(p => !p.receipt_image_url).length;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight">
              Data Belanja & Nota Fisik
            </h1>
            <span className="px-2 py-0.5 bg-[#00F0FF] border-2 border-black text-black text-[10px] sm:text-xs font-black uppercase">
              {filtered.length} Transaksi
            </span>
            <span className="px-2 py-0.5 bg-[#FFE600] border-2 border-black text-black text-[10px] sm:text-xs font-black uppercase">
              📸 {totalWithReceiptCount} Ada Nota
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-black/70 mt-1">
            Total Belanja: <span className="font-black text-black bg-[#FFE600] px-1.5 py-0.5 border border-black">{formatRupiah(totalAmountFiltered)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPurchasesCSV(filtered, outlets)}
            className="px-3 py-2 bg-white border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] hover:bg-slate-50 flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
            title="Export CSV Excel"
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onOpenNewPurchase}
            className="px-3.5 py-2 bg-[#FF4343] text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>+ Belanja</span>
          </button>
        </div>
      </div>

      {/* Filters Bar with Receipt Status Switcher */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 bg-white p-3 sm:p-4 border-3 border-black shadow-[3px_3px_0px_#121212]">
        <div className="relative col-span-2 sm:col-span-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari toko / barang..."
            className="w-full bg-[#FFFDF5] border-2 border-black pl-8 pr-2.5 py-1.5 text-xs font-bold text-black placeholder:text-black/50 focus:outline-none"
          />
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-black stroke-[2.5]" />
        </div>

        <div>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black px-2 py-1.5 text-xs font-bold text-black focus:outline-none"
          >
            <option value="all">Semua Outlet</option>
            {outlets.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black px-2 py-1.5 text-xs font-bold text-black focus:outline-none"
          >
            <option value="all">Semua Sumber</option>
            <option value="advance_transfer">Dana Titipan Belanja</option>
            <option value="opening_cash">Opening Cash</option>
            <option value="personal_cash">Talangan Pribadi</option>
            <option value="tempo">Tempo Supplier</option>
            <option value="transfer_bank">Transfer Langsung</option>
          </select>
        </div>

        {/* Filter Status Foto Nota */}
        <div>
          <select
            value={filterReceipt}
            onChange={(e) => setFilterReceipt(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black px-2 py-1.5 text-xs font-bold text-black focus:outline-none font-black text-emerald-800"
          >
            <option value="all">Semua Foto Nota</option>
            <option value="has_receipt">📸 Sudah Ada Foto Nota ({totalWithReceiptCount})</option>
            <option value="no_receipt">⚠️ Belum Ada Foto Nota ({totalWithoutReceiptCount})</option>
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <select
            value={filterTempo}
            onChange={(e) => setFilterTempo(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black px-2 py-1.5 text-xs font-bold text-black focus:outline-none"
          >
            <option value="all">Semua Jenis</option>
            <option value="tempo_only">Khusus Tempo</option>
            <option value="tempo_unpaid">Tempo BELUM LUNAS</option>
          </select>
        </div>
      </div>

      {/* List Transaksi */}
      {filtered.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white border-3 border-black shadow-[3px_3px_0px_#121212] text-black font-bold text-xs">
          Tidak ada transaksi belanja yang sesuai filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const outlet = outlets.find(o => o.id === p.outlet_id);
            const hasReceipt = Boolean(p.receipt_image_url);

            return (
              <div
                key={p.id}
                className="p-3.5 sm:p-5 bg-white border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[4px_4px_0px_#121212] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-black text-black text-sm sm:text-base uppercase">{p.supplier_name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 border-2 border-black bg-[#FFE600] font-black uppercase">
                      {outlet?.name}
                    </span>
                    <span className="text-[10px] font-bold text-black/70">
                      {formatDateIndo(p.purchase_date)}
                    </span>

                    {/* BADGE STATUS FOTO NOTA FISIK */}
                    {hasReceipt ? (
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 border-2 border-black bg-[#00F0FF] text-black font-black uppercase flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                        <span>Ada Nota Fisik</span>
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 border border-black bg-[#FFFDF5] text-black/60 font-bold uppercase flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Tanpa Foto Nota</span>
                      </span>
                    )}

                    {p.is_tempo && (
                      <span className={`text-[9px] px-1.5 py-0.2 border border-black font-black uppercase ${
                        p.tempo_status === 'paid'
                          ? 'bg-[#00F0FF] text-black'
                          : 'bg-[#FF4343] text-white'
                      }`}>
                        Tempo: {p.tempo_status === 'paid' ? 'LUNAS' : `Jatuh Tempo ${formatDateIndo(p.tempo_due_date || '')}`}
                      </span>
                    )}
                    <span className="text-[9px] px-1.5 py-0.2 border border-black bg-[#FFFDF5] text-black font-mono uppercase">
                      {p.payment_source.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Items */}
                  {p.items && p.items.length > 0 && (
                    <div className="bg-[#FFFDF5] p-2 sm:p-2.5 border-2 border-black text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                        {p.items.map((it, idx) => (
                          <div key={it.id || idx} className="text-black font-semibold flex items-center justify-between gap-2 border-b border-black/10 pb-0.5 sm:border-0 sm:pb-0">
                            <span className="truncate">{it.item_name}</span>
                            <span className="text-black/70 font-mono text-[11px] shrink-0">
                              {it.quantity} {it.unit} • {formatRupiah(it.subtotal || it.unit_price || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.notes && (
                    <p className="text-xs font-bold text-black/70 italic">
                      Catatan: {p.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t-2 md:border-t-0 border-black shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-black/70 uppercase">Total Nota:</div>
                    <div className="text-base sm:text-xl font-black text-black">
                      {formatRupiah(p.total_amount)}
                    </div>
                  </div>

                  {/* Action Buttons: Nota Preview, Edit, Hapus */}
                  <div className="flex items-center gap-1.5">
                    {hasReceipt && (
                      <button
                        onClick={() => onViewReceipt(p.receipt_image_url!, `Nota ${p.supplier_name} (${outlet?.name}) - ${formatRupiah(p.total_amount)}`)}
                        className="p-2 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#121212] hover:bg-[#ffd900] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 text-xs font-black uppercase"
                        title="Lihat & Perbesar Foto Nota"
                      >
                        <Receipt className="h-4 w-4 stroke-[2.5]" />
                        <span className="hidden sm:inline">Lihat Nota</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditPurchase(p)}
                      className="p-2 bg-[#00F0FF] border-2 border-black text-black shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
                      title="Edit Transaksi Belanja"
                    >
                      <Edit className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus transaksi belanja ${p.supplier_name} senilai ${formatRupiah(p.total_amount)}? Sisa saldo batch transfer akan dikembalikan otomatis.`)) {
                          deletePurchase(p.id);
                        }
                      }}
                      className="p-2 bg-[#FF4343] border-2 border-black text-white shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
                      title="Hapus Transaksi Belanja"
                    >
                      <Trash2 className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
