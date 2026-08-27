'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { exportAdvanceFundsCSV } from '@/lib/exportUtils';
import {
  PlusCircle,
  Receipt,
  Search,
  Archive,
  Layers,
  CheckSquare,
  Square,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdvanceFundViewProps {
  onOpenNewAdvance: () => void;
  onOpenNewPurchase: () => void;
  onViewReceipt: (url: string, title: string) => void;
}

export const AdvanceFundView: React.FC<AdvanceFundViewProps> = ({
  onOpenNewAdvance,
  onOpenNewPurchase,
  onViewReceipt,
}) => {
  const {
    outlets,
    advanceBatches,
    purchases,
    closeAdvanceFundBatch,
    consolidateAdvanceBatches,
    totalAdvanceRemainingAll,
    selectedOutletId,
    setSelectedOutletId
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'depleted'>('active');

  const [isConsolidationMode, setIsConsolidationMode] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [consolidatedName, setConsolidatedName] = useState('');

  const filteredBatches = advanceBatches.filter(b => {
    if (selectedOutletId !== 'all' && b.outlet_id !== selectedOutletId) return false;
    if (filterStatus === 'active' && b.status !== 'active') return false;
    if (filterStatus === 'depleted' && b.status !== 'depleted' && b.status !== 'closed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.batch_name.toLowerCase().includes(q);
      const matchSender = b.sender_source?.toLowerCase().includes(q);
      const matchNotes = b.notes?.toLowerCase().includes(q);
      if (!matchName && !matchSender && !matchNotes) return false;
    }

    return true;
  });

  const activeBatchesWithRemaining = advanceBatches.filter(
    b => b.status === 'active' && b.remaining_amount > 0 && (selectedOutletId === 'all' || b.outlet_id === selectedOutletId)
  );

  const selectedTotalRemaining = advanceBatches
    .filter(b => selectedBatchIds.includes(b.id))
    .reduce((acc, b) => acc + b.remaining_amount, 0);

  const handleToggleBatchSelect = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedBatchIds(prev => [...prev, id]);
    }
  };

  const handleSelectAllActive = () => {
    if (selectedBatchIds.length === activeBatchesWithRemaining.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(activeBatchesWithRemaining.map(b => b.id));
    }
  };

  const handleConfirmConsolidate = async () => {
    if (selectedBatchIds.length < 2) {
      alert('Pilih minimal 2 batch sisa untuk digabungkan.');
      return;
    }

    const firstBatch = advanceBatches.find(b => b.id === selectedBatchIds[0]);
    const targetOutletId = firstBatch ? firstBatch.outlet_id : (selectedOutletId !== 'all' ? selectedOutletId : (outlets[0]?.id || ''));

    await consolidateAdvanceBatches(targetOutletId, selectedBatchIds, consolidatedName.trim() || undefined);

    setIsConsolidationMode(false);
    setSelectedBatchIds([]);
    setConsolidatedName('');

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight">
              Dana Belanja Dari Luar (Rekening)
            </h1>
            <span className="px-2 py-0.5 bg-[#00F0FF] border-2 border-black text-black text-[10px] sm:text-xs font-black uppercase">
              Per Batch
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-black/70 mt-1">
            Uang transferan dari luar (owner/investor) yang masuk ke rekening Anda untuk belanja outlet. Sisa uang mengendap dicatat rapi dan bisa digabungkan.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <div className="bg-[#FFE600] border-3 border-black p-2.5 sm:p-3.5 shadow-[3px_3px_0px_#121212] text-left sm:text-right flex-1 sm:flex-initial">
            <span className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-wider block">
              Total Kumpulan Sisa di Rekening
            </span>
            <span className="text-lg sm:text-2xl font-black text-black">
              {formatRupiah(totalAdvanceRemainingAll)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => exportAdvanceFundsCSV(filteredBatches, outlets)}
              className="px-3 py-2.5 sm:py-3 bg-white border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] hover:bg-slate-50 flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
              title="Export CSV Excel"
            >
              <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
              <span>Export</span>
            </button>

            <button
              onClick={onOpenNewAdvance}
              className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-3 bg-[#00F0FF] border-3 border-black text-black text-xs font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.5]" />
              <span>+ Terima Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Consolidation Action Bar */}
      <div className="bg-[#FFE600] border-3 border-black p-3.5 sm:p-4 shadow-[3px_3px_0px_#121212] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-black stroke-[2.5]" />
          <div>
            <h3 className="text-xs sm:text-sm font-black text-black uppercase">
              Konsolidasi / Gabungkan Sisa Batch
            </h3>
            <p className="text-[10px] sm:text-xs font-bold text-black/80">
              Satukan sisa-sisa dana dari beberapa transfer lama menjadi 1 batch baru yang siap dipakai belanja.
            </p>
          </div>
        </div>

        {!isConsolidationMode ? (
          <button
            onClick={() => setIsConsolidationMode(true)}
            className="px-3.5 py-2 bg-black text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
          >
            <Layers className="h-4 w-4 stroke-[2.5]" />
            <span>Gabungkan Sisa Batch</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllActive}
              className="px-2.5 py-1.5 bg-white text-black border-2 border-black text-xs font-black uppercase"
            >
              {selectedBatchIds.length === activeBatchesWithRemaining.length ? 'Batal Semua' : 'Pilih Semua'}
            </button>
            <button
              onClick={() => {
                setIsConsolidationMode(false);
                setSelectedBatchIds([]);
              }}
              className="px-2.5 py-1.5 bg-white text-black border-2 border-black text-xs font-bold uppercase"
            >
              Tutup Mode
            </button>
          </div>
        )}
      </div>

      {/* Form Dialog Konsolidasi */}
      {isConsolidationMode && selectedBatchIds.length > 0 && (
        <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0px_#121212] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase">
              Batch Terpilih: <span className="underline">{selectedBatchIds.length} Batch</span> • Total Gabungan: <span className="bg-[#FFE600] px-1.5 py-0.5 border border-black font-black">{formatRupiah(selectedTotalRemaining)}</span>
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-black text-black uppercase mb-1">
              Nama Batch Baru Hasil Gabungan
            </label>
            <input
              type="text"
              value={consolidatedName}
              onChange={(e) => setConsolidatedName(e.target.value)}
              placeholder="Contoh: Akumulasi Sisa Belanja Oklah Akhir Bulan"
              className="w-full bg-[#FFFDF5] border-2 border-black p-2 text-xs font-bold text-black focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleConfirmConsolidate}
              className="px-5 py-2 bg-[#00F0FF] border-3 border-black text-black text-xs font-black uppercase shadow-[3px_3px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px]"
            >
              ✓ Konfirmasi Gabungkan Jadi 1 Batch Baru
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 bg-white p-3 sm:p-4 border-3 border-black shadow-[3px_3px_0px_#121212]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengirim / nama batch..."
            className="w-full bg-[#FFFDF5] border-2 border-black pl-9 pr-3 py-1.5 text-xs font-bold text-black placeholder:text-black/50 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-black stroke-[2.5]" />
        </div>

        <div>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            className="w-full bg-[#FFFDF5] border-2 border-black px-3 py-1.5 text-xs font-bold text-black focus:outline-none"
          >
            <option value="all">Semua Outlet</option>
            {outlets.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        <div className="flex bg-[#FFFDF5] p-1 border-2 border-black">
          <button
            onClick={() => setFilterStatus('active')}
            className={`flex-1 py-1 text-xs font-black uppercase transition-all ${
              filterStatus === 'active' ? 'bg-[#FFE600] text-black border border-black shadow-[2px_2px_0px_#121212]' : 'text-black'
            }`}
          >
            Ada Sisa Dana
          </button>
          <button
            onClick={() => setFilterStatus('depleted')}
            className={`flex-1 py-1 text-xs font-black uppercase transition-all ${
              filterStatus === 'depleted' ? 'bg-[#FF4343] text-white border border-black shadow-[2px_2px_0px_#121212]' : 'text-black'
            }`}
          >
            Sudah Habis
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-1 text-xs font-black uppercase transition-all ${
              filterStatus === 'all' ? 'bg-black text-white' : 'text-black'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Batch Cards List */}
      {filteredBatches.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white border-3 border-black shadow-[3px_3px_0px_#121212] text-black font-bold text-xs">
          Belum ada data transfer belanja yang sesuai filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch) => {
            const outlet = outlets.find(o => o.id === batch.outlet_id);
            const batchPurchases = purchases.filter(p => p.advance_batch_id === batch.id);
            const totalUsed = batch.initial_amount - batch.remaining_amount;
            const percentageUsed = Math.min(100, Math.round((totalUsed / batch.initial_amount) * 100));
            const hasRemaining = batch.remaining_amount > 0;
            const isSelected = selectedBatchIds.includes(batch.id);

            return (
              <div
                key={batch.id}
                className={`p-4 sm:p-6 bg-white border-3 sm:border-4 border-black shadow-[3px_3px_0px_#121212] sm:shadow-[5px_5px_0px_#121212] space-y-3 sm:space-y-4 transition-all ${
                  isSelected ? 'ring-4 ring-[#00F0FF] bg-[#E6FDFF]' : ''
                }`}
              >
                {/* Header Batch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
                  <div className="flex items-start gap-2.5">
                    {isConsolidationMode && hasRemaining && (
                      <button
                        onClick={() => handleToggleBatchSelect(batch.id)}
                        className="mt-0.5 p-1 bg-white border-2 border-black"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-black stroke-[3]" />
                        ) : (
                          <Square className="h-5 w-5 text-black stroke-[2]" />
                        )}
                      </button>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-black text-sm sm:text-lg text-black uppercase">
                          {batch.batch_name}
                        </span>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 border-2 border-black bg-[#FFE600] font-black uppercase">
                          {outlet?.name}
                        </span>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 border border-black bg-[#FFFDF5] font-bold">
                          Dari: {batch.sender_source || 'Luar'}
                        </span>
                        <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 border border-black font-black uppercase ${
                          hasRemaining ? 'bg-[#00F0FF] text-black' : 'bg-[#FF4343] text-white'
                        }`}>
                          {hasRemaining ? 'AKTIF (ADA SISA)' : 'HABIS TERPAKAI'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-black/70 mt-1">
                        Diterima: {formatDateIndo(batch.received_at)} {batch.notes && `• Catatan: ${batch.notes}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {batch.proof_image_url && (
                      <button
                        onClick={() => onViewReceipt(batch.proof_image_url!, `Bukti Transfer ${batch.batch_name}`)}
                        className="p-1.5 sm:p-2 bg-white border-2 border-black shadow-[2px_2px_0px_#121212] text-xs font-black uppercase flex items-center gap-1"
                        title="Lihat Bukti Transfer Masuk"
                      >
                        <Receipt className="h-4 w-4 stroke-[2.5]" />
                        <span>Bukti Mutasi</span>
                      </button>
                    )}

                    {hasRemaining && (
                      <button
                        onClick={() => {
                          if (confirm(`Tutup batch ${batch.batch_name}? Sisa dana ${formatRupiah(batch.remaining_amount)} akan ditandai selesai/dikembalikan.`)) {
                            closeAdvanceFundBatch(batch.id);
                          }
                        }}
                        className="p-1.5 sm:p-2 bg-white hover:bg-slate-100 border-2 border-black shadow-[2px_2px_0px_#121212] text-xs font-bold text-black/70 flex items-center gap-1"
                        title="Tutup Batch"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>Tutup</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Saldo Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-3 bg-[#FFFDF5] border-2 border-black">
                    <div className="text-[10px] font-black text-black/70 uppercase">Dana Awal Masuk</div>
                    <div className="text-base sm:text-lg font-black text-black mt-0.5">
                      {formatRupiah(batch.initial_amount)}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FFFDF5] border-2 border-black">
                    <div className="text-[10px] font-black text-black/70 uppercase">Sudah Dipakai ({percentageUsed}%)</div>
                    <div className="text-base sm:text-lg font-black text-rose-600 mt-0.5">
                      {formatRupiah(totalUsed)}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#121212]">
                    <div className="text-[10px] font-black text-black uppercase">Sisa Mengendap di Rekening</div>
                    <div className="text-base sm:text-lg font-black text-black mt-0.5">
                      {formatRupiah(batch.remaining_amount)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white h-3 border-2 border-black overflow-hidden p-0.5">
                  <div
                    className="h-full bg-rose-500 border-r-2 border-black transition-all duration-300"
                    style={{ width: `${percentageUsed}%` }}
                  />
                </div>

                {/* Riwayat Belanja Pemotong Batch */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-black text-black uppercase flex items-center justify-between">
                    <span>Belanja Memotong Batch Ini ({batchPurchases.length}):</span>
                    {hasRemaining && (
                      <button
                        onClick={onOpenNewPurchase}
                        className="text-[11px] font-black underline hover:text-emerald-700"
                      >
                        + Pakai Batch Ini
                      </button>
                    )}
                  </div>

                  {batchPurchases.length === 0 ? (
                    <div className="p-2.5 bg-[#FFFDF5] border-2 border-black text-center text-xs font-bold text-black/60">
                      Belum ada transaksi belanja yang memotong batch transfer ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {batchPurchases.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-[#FFFDF5] border-2 border-black flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-black truncate block">{p.supplier_name}</span>
                            <span className="text-[10px] text-black/70">{formatDateIndo(p.purchase_date)} • {p.items.length} item</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-black block">{formatRupiah(p.total_amount)}</span>
                            {p.receipt_image_url && (
                              <button
                                onClick={() => onViewReceipt(p.receipt_image_url!, `Nota ${p.supplier_name}`)}
                                className="text-[10px] font-black underline text-emerald-700"
                              >
                                Nota
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
